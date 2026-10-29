import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { EventRequest, IEventRequest, EventStatus } from '../models/EventRequest.js';
import { Reservation } from '../models/Reservation.js';
import { Resource } from '../models/Resource.js';
import { Club } from '../models/Club.js';
import { Department } from '../models/Department.js';
import { ApprovalTask } from '../models/ApprovalTask.js';
import { ApprovalDecision } from '../models/ApprovalDecision.js';
import { HandoverRecord } from '../models/HandoverRecord.js';
import { AuthRequest } from '../middleware/auth.js';
import { checkResourceAvailability, promoteWaitlistedReservations } from '../services/schedulingEngine.js';
import { evaluateClubFairUsage } from '../services/fairAllocationService.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function createEventRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const {
      title,
      description,
      eventType,
      organizingClubId,
      departmentId,
      facultyCoordinatorId,
      venueId,
      startDate,
      endDate,
      setupMinutes = 30,
      cleanupMinutes = 30,
      expectedAttendance,
      purpose,
      equipmentRequests = [], // Array<{ resourceId: string, quantity: number }>
      supportingDocs = [],
      isDraft = false,
    } = req.body;

    if (!title || !eventType || !organizingClubId || !departmentId || !facultyCoordinatorId || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Missing required event fields: title, eventType, club, department, faculty, start/end dates are mandatory.',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid start or end date' });
      return;
    }

    if (end <= start) {
      res.status(400).json({ success: false, message: 'Event end time must be after start time' });
      return;
    }

    // Advance notice verification (prevent booking in past)
    if (start.getTime() < Date.now() - 5 * 60 * 1000) {
      res.status(400).json({ success: false, message: 'Event date cannot be in the past' });
      return;
    }

    // Validate club membership authorization
    const club = await Club.findById(organizingClubId);
    if (!club) {
      res.status(404).json({ success: false, message: 'Organizing club not found' });
      return;
    }

    const isAuthorizedRep =
      user.role === 'ADMIN' ||
      user.clubMemberships?.some((c) => c.toString() === club._id.toString()) ||
      club.authorizedRepresentatives?.some((r) => r.toString() === user._id.toString());

    if (!isAuthorizedRep) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not an authorized representative for this club.',
      });
      return;
    }

    // Fair allocation check
    const fairCheck = await evaluateClubFairUsage(club._id, eventType);
    if (!fairCheck.allowed && user.role !== 'ADMIN') {
      res.status(429).json({
        success: false,
        message: fairCheck.explanation,
      });
      return;
    }

    // Determine HOD requirement:
    // Attendance >= 100, or venue explicitly requires HOD, or any requested equipment requires HOD
    let requiresHod = Number(expectedAttendance) >= 100;

    const clientTimezone = (req.body.clientTimezone || req.headers['x-timezone']) as string | undefined;

    // Validate Venue if selected
    if (venueId) {
      const venue = await Resource.findById(venueId);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Selected venue not found' });
        return;
      }
      if (venue.capacity && venue.capacity < Number(expectedAttendance)) {
        res.status(400).json({
          success: false,
          message: `Venue capacity (${venue.capacity}) is insufficient for expected attendance (${expectedAttendance}).`,
        });
        return;
      }
      if (venue.requiresHodApproval) {
        requiresHod = true;
      }

      // Check venue availability
      const venueAvail = await checkResourceAvailability(venue._id, start, end, 1, undefined, clientTimezone);
      if (!venueAvail.isAvailable && !isDraft) {
        res.status(409).json({
          success: false,
          message: `Venue conflict: ${venueAvail.conflictReason}`,
          suggestedAlternatives: venueAvail.suggestedAlternativeSlots,
        });
        return;
      }
    }

    // Check availability of each requested equipment
    for (const eq of equipmentRequests) {
      const resource = await Resource.findById(eq.resourceId);
      if (!resource) {
        res.status(404).json({ success: false, message: `Resource ${eq.resourceId} not found` });
        return;
      }
      if (resource.requiresHodApproval) {
        requiresHod = true;
      }

      const eqAvail = await checkResourceAvailability(
        resource._id,
        start,
        end,
        Number(eq.quantity || 1),
        undefined,
        clientTimezone
      );

      if (!eqAvail.isAvailable && !isDraft) {
        res.status(409).json({
          success: false,
          message: `Resource conflict for "${resource.name}": ${eqAvail.conflictReason}`,
          suggestedAlternatives: eqAvail.suggestedAlternativeSlots,
        });
        return;
      }
    }

    // Generate robust unique Request Number
    const latestEvent = await EventRequest.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (latestEvent && latestEvent.requestNumber) {
      const match = latestEvent.requestNumber.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    let requestNumber = `REQ-2026-${String(nextNum).padStart(4, '0')}`;
    const duplicate = await EventRequest.findOne({ requestNumber });
    if (duplicate) {
      requestNumber = `REQ-2026-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    }

    const initialStatus: EventStatus = isDraft ? 'DRAFT' : 'UNDER_REVIEW';

    const event = new EventRequest({
      requestNumber,
      title: title.trim(),
      description: (description && description.trim()) || `${title.trim()} organized by club.`,
      eventType,
      organizingClub: club._id,
      organizer: user._id,
      department: departmentId,
      facultyCoordinator: facultyCoordinatorId,
      venue: venueId || undefined,
      startDate: start,
      endDate: end,
      setupMinutes,
      cleanupMinutes,
      expectedAttendance: Number(expectedAttendance),
      purpose,
      supportingDocs,
      status: initialStatus,
      currentApprovalStage: 'FACULTY_REVIEW',
      requiresHodApproval: requiresHod,
    });

    await event.save();

    // Create Reservations for venue
    if (venueId) {
      await Reservation.create({
        event: event._id,
        resource: venueId,
        quantity: 1,
        startDate: start,
        endDate: end,
        status: 'PENDING',
      });
    }

    // Create Reservations for equipment
    for (const eq of equipmentRequests) {
      await Reservation.create({
        event: event._id,
        resource: eq.resourceId,
        quantity: Number(eq.quantity || 1),
        startDate: start,
        endDate: end,
        status: 'PENDING',
      });
    }

    // Create persistent ApprovalTasks when submitted
    if (!isDraft) {
      // 1. Stage 1: Faculty Review (ACTIONABLE)
      await ApprovalTask.create({
        request: event._id,
        stage: 'FACULTY_REVIEW',
        assignedReviewer: facultyCoordinatorId,
        assignedReviewerRole: 'FACULTY',
        department: departmentId,
        status: 'ACTIONABLE',
      });

      // 2. Stage 2: HOD Review (STAGED if required)
      if (requiresHod) {
        const dept = await Department.findById(departmentId);
        const hodId = (dept as any)?.hod;
        await ApprovalTask.create({
          request: event._id,
          stage: 'HOD_REVIEW',
          assignedReviewer: hodId || undefined,
          assignedReviewerRole: 'HOD',
          department: departmentId,
          status: 'STAGED',
        });
      }

      // 3. Stage 3: Resource Manager Review (STAGED)
      await ApprovalTask.create({
        request: event._id,
        stage: 'RESOURCE_MANAGER_REVIEW',
        assignedReviewerRole: 'RESOURCE_MANAGER',
        status: 'STAGED',
      });

      // Dispatch notification to Faculty Coordinator
      await createNotification({
        recipient: facultyCoordinatorId,
        title: 'New Event Approval Request',
        message: `${user.name} submitted an event request "${title}" for ${club.name}. Awaiting your review.`,
        type: 'REVIEW_ASSIGNED',
        relatedEntityId: event._id.toString(),
        relatedEntityType: 'EventRequest',
        actionLink: `/approvals/${event._id}`,
      });
    }

    await logAuditEvent({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: isDraft ? 'EVENT_DRAFT_SAVED' : 'EVENT_SUBMITTED',
      entityType: 'EventRequest',
      entityId: event._id.toString(),
      details: { title, requestNumber, requiresHodApproval: requiresHod },
    });

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully' : 'Event request submitted for review',
      requestNumber,
      event,
      nextStage: 'FACULTY_REVIEW',
    });
  } catch (error) {
    next(error);
  }
}

export async function resubmitEventRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const {
      title,
      description,
      startDate,
      endDate,
      expectedAttendance,
      purpose,
      venueId,
      equipmentRequests = [],
    } = req.body;

    const event = await EventRequest.findById(id).populate('organizingClub');
    if (!event) {
      res.status(404).json({ success: false, message: 'Event request not found' });
      return;
    }

    const isOwner = event.organizer.toString() === user._id.toString();
    const isAdmin = user.roles?.includes('ADMIN') || user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to modify this event request.' });
      return;
    }

    if (event.status !== 'CHANGES_REQUESTED') {
      res.status(400).json({
        success: false,
        message: `Only requests in CHANGES_REQUESTED status can be resubmitted. Current status: ${event.status}`,
      });
      return;
    }

    const start = startDate ? new Date(startDate) : event.startDate;
    const end = endDate ? new Date(endDate) : event.endDate;

    if (end <= start) {
      res.status(400).json({ success: false, message: 'End time must be after start time' });
      return;
    }

    const clientTimezone = (req.body.clientTimezone || req.headers['x-timezone']) as string | undefined;

    // Availability verification on new dates/venue if changed
    if (venueId) {
      const venueAvail = await checkResourceAvailability(venueId, start, end, 1, event._id, clientTimezone);
      if (!venueAvail.isAvailable) {
        res.status(409).json({
          success: false,
          message: `Venue conflict: ${venueAvail.conflictReason}`,
        });
        return;
      }
    }

    // Apply updates
    if (title) event.title = title.trim();
    if (description) event.description = description;
    if (startDate) event.startDate = start;
    if (endDate) event.endDate = end;
    if (expectedAttendance) event.expectedAttendance = Number(expectedAttendance);
    if (purpose) event.purpose = purpose;
    if (venueId !== undefined) event.venue = venueId ? new mongoose.Types.ObjectId(venueId) : undefined;

    // Reset workflow status to UNDER_REVIEW at FACULTY_REVIEW stage
    event.status = 'UNDER_REVIEW';
    event.currentApprovalStage = 'FACULTY_REVIEW';
    event.changeNotes = undefined;
    await event.save();

    // Replace reservations
    await Reservation.deleteMany({ event: event._id });

    if (event.venue) {
      await Reservation.create({
        event: event._id,
        resource: event.venue,
        quantity: 1,
        startDate: start,
        endDate: end,
        status: 'PENDING',
      });
    }

    for (const eq of equipmentRequests) {
      await Reservation.create({
        event: event._id,
        resource: eq.resourceId,
        quantity: Number(eq.quantity || 1),
        startDate: start,
        endDate: end,
        status: 'PENDING',
      });
    }

    // Re-activate Faculty ApprovalTask
    let facultyTask = await ApprovalTask.findOne({ request: event._id, stage: 'FACULTY_REVIEW' });
    if (facultyTask) {
      facultyTask.status = 'ACTIONABLE';
      facultyTask.decisionReason = undefined;
      facultyTask.decisionTimestamp = undefined;
      await facultyTask.save();
    } else {
      await ApprovalTask.create({
        request: event._id,
        stage: 'FACULTY_REVIEW',
        assignedReviewer: event.facultyCoordinator,
        assignedReviewerRole: 'FACULTY',
        department: event.department,
        status: 'ACTIONABLE',
      });
    }

    // Reset any subsequent tasks to STAGED
    await ApprovalTask.updateMany(
      { request: event._id, stage: { $in: ['HOD_REVIEW', 'RESOURCE_MANAGER_REVIEW'] } },
      { status: 'STAGED', decisionReason: undefined, decisionTimestamp: undefined }
    );

    // Notify Faculty Coordinator
    await createNotification({
      recipient: event.facultyCoordinator,
      title: 'Event Proposal Resubmitted',
      message: `${user.name} addressed your change requests for "${event.title}". Proposal is back in your review queue.`,
      type: 'REVIEW_ASSIGNED',
      relatedEntityId: event._id.toString(),
      relatedEntityType: 'EventRequest',
      actionLink: `/approvals/${event._id}`,
    });

    await logAuditEvent({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'EVENT_RESUBMITTED',
      entityType: 'EventRequest',
      entityId: event._id.toString(),
      details: { title: event.title, requestNumber: event.requestNumber },
    });

    res.status(200).json({
      success: true,
      message: 'Event request resubmitted for faculty review successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { status, clubId, departmentId, search } = req.query;

    const baseFilter: any = {};
    if (status) baseFilter.status = status;
    if (clubId) baseFilter.organizingClub = clubId;
    if (departmentId) baseFilter.department = departmentId;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      baseFilter.$or = [{ title: searchRegex }, { requestNumber: searchRegex }, { description: searchRegex }];
    }

    // Role-based visibility scoping supporting users with multiple active roles
    const userRoles = user.roles?.length ? user.roles : [user.role];

    let query: any = { ...baseFilter };

    if (!userRoles.includes('ADMIN')) {
      const roleConditions: any[] = [];

      // 1. Organizer condition (always see what they organized)
      roleConditions.push({ organizer: user._id });

      // 2. Club membership condition (students see club events)
      if (user.clubMemberships?.length) {
        roleConditions.push({ organizingClub: { $in: user.clubMemberships } });
      }

      // 3. Faculty coordinator condition
      if (userRoles.includes('FACULTY')) {
        roleConditions.push({ facultyCoordinator: user._id });
      }

      // 4. HOD department condition
      if (userRoles.includes('HOD') && user.department) {
        roleConditions.push({ department: user.department });
      }

      // 5. Resource Manager condition (sees confirmed or operational events)
      if (userRoles.includes('RESOURCE_MANAGER')) {
        roleConditions.push({
          status: { $in: ['UNDER_REVIEW', 'APPROVED_PENDING_RESOURCE_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        });
      }

      if (baseFilter.$or) {
        // If search already uses $or, combine with $and
        query = {
          $and: [
            baseFilter,
            { $or: roleConditions },
          ],
        };
      } else {
        query.$or = roleConditions;
      }
    }

    const events = await EventRequest.find(query)
      .populate('organizer', 'name email')
      .populate('organizingClub', 'name code category')
      .populate('facultyCoordinator', 'name email')
      .populate('department', 'name code')
      .populate('venue', 'name code location capacity')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const event = await EventRequest.findById(id)
      .populate('organizer', 'name email phone studentOrEmpId department')
      .populate('organizingClub', 'name code category logo monthlyBookingQuota')
      .populate('facultyCoordinator', 'name email department')
      .populate('department', 'name code location hod')
      .populate('venue', 'name code location capacity operationalStatus operatingHours');

    if (!event) {
      res.status(404).json({ success: false, message: 'Event request not found' });
      return;
    }

    // Role and ownership scoping to prevent unauthorized access / IDOR
    const user = req.user!;
    const userRoles = user.roles?.length ? user.roles : [user.role];
    const isAdmin = userRoles.includes('ADMIN');
    const isManager = userRoles.includes('RESOURCE_MANAGER');
    const isOrganizer = event.organizer && (event.organizer as any)._id?.toString() === user._id.toString();
    const isClubMember = user.clubMemberships?.some(
      (c) => c.toString() === (event.organizingClub as any)?._id?.toString()
    );
    const isFacultyCoordinator =
      event.facultyCoordinator &&
      (event.facultyCoordinator as any)._id?.toString() === user._id.toString();
    const isDeptHod =
      userRoles.includes('HOD') &&
      user.department &&
      user.department.toString() === (event.department as any)?._id?.toString();

    if (!isAdmin && !isManager && !isOrganizer && !isClubMember && !isFacultyCoordinator && !isDeptHod) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this event proposal.',
      });
      return;
    }

    const reservations = await Reservation.find({ event: event._id }).populate(
      'resource',
      'name code category location totalQuantity availableQuantity operationalStatus'
    );

    const decisions = await ApprovalDecision.find({ event: event._id })
      .populate('reviewer', 'name email role')
      .sort({ createdAt: 1 });

    const handovers = await HandoverRecord.find({ event: event._id })
      .populate('resource', 'name code category')
      .populate('manager', 'name email');

    const tasks = await ApprovalTask.find({ request: event._id })
      .populate('assignedReviewer', 'name email role department')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      event,
      reservations,
      decisions,
      handovers,
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelEventRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by organizer' } = req.body;
    const user = req.user!;

    const event = await EventRequest.findById(id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event request not found' });
      return;
    }

    const isOwner = event.organizer.toString() === user._id.toString();
    const isAdmin = user.roles?.includes('ADMIN') || user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this event request.' });
      return;
    }

    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: `Cannot cancel event with status ${event.status}` });
      return;
    }

    event.status = 'CANCELLED';
    event.cancellationReason = reason;
    await event.save();

    // Release reservations
    const reservations = await Reservation.find({ event: event._id });
    await Reservation.updateMany({ event: event._id }, { status: 'CANCELLED' });

    // Cancel active/staged tasks
    await ApprovalTask.updateMany({ request: event._id }, { status: 'CANCELLED' });

    // Promote any waiting-list requests that can now be accommodated
    for (const resItem of reservations) {
      await promoteWaitlistedReservations(resItem.resource, resItem.startDate, resItem.endDate);
    }

    await logAuditEvent({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'EVENT_CANCELLED',
      entityType: 'EventRequest',
      entityId: event._id.toString(),
      details: { reason },
    });

    res.status(200).json({
      success: true,
      message: 'Event request cancelled and capacity released',
      event,
    });
  } catch (error) {
    next(error);
  }
}
