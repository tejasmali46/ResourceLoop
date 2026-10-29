import { Request, Response, NextFunction } from 'express';
import { EventRequest } from '../models/EventRequest.js';
import { ApprovalPolicy } from '../models/ApprovalPolicy.js';
import { ApprovalDecision } from '../models/ApprovalDecision.js';
import { ApprovalTask } from '../models/ApprovalTask.js';
import { Reservation } from '../models/Reservation.js';
import { AuthRequest } from '../middleware/auth.js';
import { processApprovalDecision, reassignTask } from '../services/approvalService.js';

export async function getPendingApprovals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const userRoles = user.roles?.length ? user.roles : [user.role];
    const isAdmin = userRoles.includes('ADMIN');

    // Query active approval tasks where status is ACTIONABLE
    const taskConditions: any[] = [];

    if (isAdmin) {
      taskConditions.push({ status: 'ACTIONABLE' });
    } else {
      if (userRoles.includes('FACULTY')) {
        taskConditions.push({
          stage: 'FACULTY_REVIEW',
          status: 'ACTIONABLE',
          $or: [
            { assignedReviewer: user._id },
            { assignedReviewer: null },
            { department: user.department },
          ],
        });
      }

      if (userRoles.includes('HOD')) {
        taskConditions.push({
          stage: 'HOD_REVIEW',
          status: 'ACTIONABLE',
          $or: [
            { assignedReviewer: user._id },
            { department: user.department },
          ],
        });
      }

      if (userRoles.includes('RESOURCE_MANAGER')) {
        taskConditions.push({
          stage: 'RESOURCE_MANAGER_REVIEW',
          status: 'ACTIONABLE',
        });
      }
    }

    let tasks: any[] = [];
    if (taskConditions.length > 0) {
      tasks = await ApprovalTask.find(isAdmin ? taskConditions[0] : { $or: taskConditions })
        .populate({
          path: 'request',
          populate: [
            { path: 'organizer', select: 'name email phone studentOrEmpId' },
            { path: 'organizingClub', select: 'name code category' },
            { path: 'department', select: 'name code' },
            { path: 'facultyCoordinator', select: 'name email' },
            { path: 'venue', select: 'name code location capacity' },
          ],
        })
        .sort({ createdAt: 1 });
    }

    // Extract unique event requests from actionable tasks
    const pendingRequestsMap = new Map<string, any>();
    for (const t of tasks) {
      if (t.request && t.request._id) {
        pendingRequestsMap.set(t.request._id.toString(), {
          ...t.request.toObject(),
          approvalTaskId: t._id,
          taskStatus: t.status,
        });
      }
    }

    // Fallback direct check for events that might not have task records yet (legacy/seeded)
    const directQuery: any = {
      status: { $in: ['UNDER_REVIEW', 'APPROVED_PENDING_RESOURCE_CONFIRMATION', 'RESUBMITTED'] },
    };

    if (isAdmin) {
      // Admin sees all
    } else {
      const orEvents: any[] = [];
      if (userRoles.includes('FACULTY')) {
        orEvents.push({
          currentApprovalStage: 'FACULTY_REVIEW',
          facultyCoordinator: user._id,
        });
      }
      if (userRoles.includes('HOD')) {
        orEvents.push({
          currentApprovalStage: 'HOD_REVIEW',
          department: user.department,
        });
      }
      if (userRoles.includes('RESOURCE_MANAGER')) {
        orEvents.push({
          currentApprovalStage: 'RESOURCE_MANAGER_REVIEW',
        });
      }
      if (orEvents.length > 0) {
        directQuery.$or = orEvents;
      }
    }

    const directEvents = await EventRequest.find(directQuery)
      .populate('organizer', 'name email phone studentOrEmpId')
      .populate('organizingClub', 'name code category')
      .populate('department', 'name code')
      .populate('facultyCoordinator', 'name email')
      .populate('venue', 'name code location capacity')
      .sort({ createdAt: 1 });

    for (const evt of directEvents) {
      if (!pendingRequestsMap.has(evt._id.toString())) {
        pendingRequestsMap.set(evt._id.toString(), evt.toObject());
      }
    }

    const pendingRequests = Array.from(pendingRequestsMap.values());

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      pendingRequests,
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitApprovalDecision(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eventId, decision, reason } = req.body;

    if (!eventId || !decision || !reason) {
      res.status(400).json({
        success: false,
        message: 'eventId, decision (APPROVED/REJECTED/CHANGES_REQUESTED), and reason are required.',
      });
      return;
    }

    const result = await processApprovalDecision({
      eventId,
      reviewer: req.user!,
      decision,
      reason,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error processing approval decision' });
  }
}

export async function forwardOrReassignTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId, toUserId, reason } = req.body;
    if (!taskId || !toUserId || !reason) {
      res.status(400).json({ success: false, message: 'taskId, toUserId, and reason are required' });
      return;
    }

    const result = await reassignTask({
      taskId,
      fromUser: req.user!,
      toUserId,
      reason,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error reassigning approval task' });
  }
}

export async function getFacultyDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const facultyId = user._id;

    // 1. Pending approvals assigned to this faculty
    const pendingTasks = await ApprovalTask.find({
      stage: 'FACULTY_REVIEW',
      status: 'ACTIONABLE',
      $or: [{ assignedReviewer: facultyId }, { assignedReviewer: null }, { department: user.department }],
    })
      .populate({
        path: 'request',
        populate: [
          { path: 'organizer', select: 'name email phone' },
          { path: 'organizingClub', select: 'name code category' },
          { path: 'department', select: 'name code' },
          { path: 'venue', select: 'name code location capacity' },
        ],
      })
      .sort({ createdAt: 1 });

    const pendingRequests = pendingTasks.map((t) => t.request).filter(Boolean);

    // Fallback for events with currentApprovalStage === 'FACULTY_REVIEW'
    const extraPending = await EventRequest.find({
      status: { $in: ['UNDER_REVIEW', 'RESUBMITTED'] },
      currentApprovalStage: 'FACULTY_REVIEW',
      facultyCoordinator: facultyId,
      _id: { $nin: pendingRequests.map((r: any) => r._id) },
    })
      .populate('organizer', 'name email phone')
      .populate('organizingClub', 'name code category')
      .populate('department', 'name code')
      .populate('venue', 'name code location capacity');

    const allPending = [...pendingRequests, ...extraPending];

    // 2. In Review (faculty coordinator for this event)
    const inReview = await EventRequest.find({
      facultyCoordinator: facultyId,
      status: 'UNDER_REVIEW',
    })
      .populate('organizer', 'name email')
      .populate('organizingClub', 'name code')
      .populate('venue', 'name code location')
      .sort({ updatedAt: -1 });

    // 3. Changes Requested
    const changesRequested = await EventRequest.find({
      facultyCoordinator: facultyId,
      status: 'CHANGES_REQUESTED',
    })
      .populate('organizer', 'name email')
      .populate('organizingClub', 'name code')
      .populate('venue', 'name code location')
      .sort({ updatedAt: -1 });

    // 4. Recently completed decisions
    const recentDecisions = await ApprovalDecision.find({
      reviewer: facultyId,
    })
      .populate({
        path: 'event',
        populate: [
          { path: 'organizingClub', select: 'name code' },
          { path: 'venue', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(20);

    // 5. Upcoming events mentored by this faculty
    const upcomingEvents = await EventRequest.find({
      facultyCoordinator: facultyId,
      status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
      startDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .populate('organizingClub', 'name code')
      .populate('venue', 'name code location')
      .sort({ startDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      pendingApprovals: allPending,
      pendingCount: allPending.length,
      inReview,
      changesRequested,
      recentDecisions,
      upcomingEvents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHodDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const departmentId = user.department;

    // 1. Pending Department Approvals (Actionable HOD tasks)
    const pendingTasks = await ApprovalTask.find({
      stage: 'HOD_REVIEW',
      status: 'ACTIONABLE',
      $or: [{ assignedReviewer: user._id }, { department: departmentId }],
    })
      .populate({
        path: 'request',
        populate: [
          { path: 'organizer', select: 'name email phone' },
          { path: 'organizingClub', select: 'name code category' },
          { path: 'department', select: 'name code' },
          { path: 'facultyCoordinator', select: 'name email' },
          { path: 'venue', select: 'name code location capacity' },
        ],
      })
      .sort({ createdAt: 1 });

    const pendingRequests = pendingTasks.map((t) => t.request).filter(Boolean);

    // Fallback check on EventRequest
    const extraPending = await EventRequest.find({
      department: departmentId,
      status: 'UNDER_REVIEW',
      currentApprovalStage: 'HOD_REVIEW',
      _id: { $nin: pendingRequests.map((r: any) => r._id) },
    })
      .populate('organizer', 'name email phone')
      .populate('organizingClub', 'name code category')
      .populate('department', 'name code')
      .populate('facultyCoordinator', 'name email')
      .populate('venue', 'name code location capacity');

    const allPending = [...pendingRequests, ...extraPending];

    // For each pending request, retrieve the prior Faculty review decision & notes!
    const pendingWithFacultyDecisions = await Promise.all(
      allPending.map(async (evt: any) => {
        const facultyDecision = await ApprovalDecision.findOne({
          event: evt._id,
          stage: 'FACULTY_REVIEW',
        }).populate('reviewer', 'name email role');
        return {
          ...evt.toObject ? evt.toObject() : evt,
          facultyDecision,
        };
      })
    );

    // 2. Department Schedule & Upcoming Confirmed Events
    const upcomingEvents = await EventRequest.find({
      department: departmentId,
      status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
      startDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .populate('organizer', 'name email')
      .populate('organizingClub', 'name code')
      .populate('venue', 'name code location capacity')
      .sort({ startDate: 1 })
      .limit(20);

    // 3. Staged requests (Waiting for earlier Faculty stage)
    const stagedRequests = await EventRequest.find({
      department: departmentId,
      status: 'UNDER_REVIEW',
      currentApprovalStage: 'FACULTY_REVIEW',
      requiresHodApproval: true,
    })
      .populate('organizingClub', 'name code')
      .populate('facultyCoordinator', 'name email')
      .populate('venue', 'name code location')
      .sort({ createdAt: -1 });

    // 4. Recent Decisions by this HOD or in this department
    const recentDecisions = await ApprovalDecision.find({
      $or: [{ reviewer: user._id }, { stage: 'HOD_REVIEW' }],
    })
      .populate({
        path: 'event',
        match: { department: departmentId },
        populate: [
          { path: 'organizingClub', select: 'name code' },
          { path: 'department', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(15);

    // 5. Potential Conflicts check in department venues
    const activeReservations = await Reservation.find({
      status: { $in: ['CONFIRMED', 'PENDING'] },
      startDate: { $gte: new Date() },
    })
      .populate('resource', 'name code category department')
      .populate('event', 'title requestNumber department status')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      pendingApprovals: pendingWithFacultyDecisions,
      pendingCount: pendingWithFacultyDecisions.length,
      upcomingEvents,
      stagedRequests,
      recentDecisions: recentDecisions.filter((d) => d.event),
      activeReservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovalPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const policies = await ApprovalPolicy.find().populate('department', 'name code');
    res.status(200).json({ success: true, count: policies.length, policies });
  } catch (error) {
    next(error);
  }
}

export async function updateApprovalPolicy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const policy = await ApprovalPolicy.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, policy });
  } catch (error) {
    next(error);
  }
}
