import mongoose from 'mongoose';
import { EventRequest, IEventRequest, ApprovalStageName, EventStatus } from '../models/EventRequest.js';
import { Reservation } from '../models/Reservation.js';
import { ApprovalDecision, DecisionType } from '../models/ApprovalDecision.js';
import { ApprovalTask } from '../models/ApprovalTask.js';
import { User, IUser } from '../models/User.js';
import { Department } from '../models/Department.js';
import { createNotification } from './notificationService.js';
import { logAuditEvent } from './auditService.js';
import { checkResourceAvailability } from './schedulingEngine.js';

export interface SubmitDecisionParams {
  eventId: string;
  reviewer: IUser;
  decision: DecisionType;
  reason: string;
}

export async function processApprovalDecision(
  params: SubmitDecisionParams
): Promise<{ success: boolean; message: string; event: IEventRequest }> {
  const { eventId, reviewer, decision, reason } = params;

  const event = await EventRequest.findById(eventId)
    .populate('organizer', 'name email')
    .populate('facultyCoordinator', 'name email department')
    .populate('department', 'name code hod')
    .populate('organizingClub', 'name code');

  if (!event) {
    throw new Error('Event request not found');
  }

  // Prevent user from approving their own request
  if (event.organizer._id.toString() === reviewer._id.toString()) {
    throw new Error('Unauthorized: You cannot approve or review your own event request.');
  }

  const previousState = event.status;
  const currentStage = event.currentApprovalStage;

  // 1. Validate reviewer authorization for current stage
  const reviewerRoles = reviewer.roles?.length ? reviewer.roles : [reviewer.role];
  const isAdmin = reviewerRoles.includes('ADMIN');

  if (currentStage === 'FACULTY_REVIEW') {
    const isAssignedFaculty =
      event.facultyCoordinator &&
      event.facultyCoordinator._id.toString() === reviewer._id.toString();
    if (!isAssignedFaculty && !isAdmin) {
      throw new Error('Unauthorized: Only the assigned Faculty Coordinator or an Admin can review this stage.');
    }
  } else if (currentStage === 'HOD_REVIEW') {
    // Check if user is HOD of the event department
    const departmentHod = (event.department as any)?.hod?._id?.toString() || (event.department as any)?.hod?.toString();
    const isDeptHod = (departmentHod === reviewer._id.toString()) || (reviewerRoles.includes('HOD') && reviewer.department?.toString() === (event.department as any)?._id?.toString());

    if (!isDeptHod && !isAdmin) {
      throw new Error('Unauthorized: Only the Department HOD or an Admin can review this stage.');
    }
  } else if (currentStage === 'RESOURCE_MANAGER_REVIEW') {
    const isManager = reviewerRoles.includes('RESOURCE_MANAGER') || isAdmin;
    if (!isManager) {
      throw new Error('Unauthorized: Only an authorized Resource Manager or an Admin can review this stage.');
    }
  } else {
    throw new Error(`Current approval stage is ${currentStage}. No review action can be taken.`);
  }

  // Retrieve or identify current ApprovalTask
  let currentTask = await ApprovalTask.findOne({
    request: event._id,
    stage: currentStage,
    status: { $in: ['ACTIONABLE', 'PENDING'] },
  });

  if (!currentTask) {
    // Fallback if not yet created or staged
    currentTask = await ApprovalTask.findOne({
      request: event._id,
      stage: currentStage,
    });
  }

  let resultingState: EventStatus = event.status;
  let nextStage: ApprovalStageName = currentStage;

  if (decision === 'REJECTED') {
    resultingState = 'REJECTED';
    nextStage = 'REJECTED';

    if (currentTask) {
      currentTask.status = 'REJECTED';
      currentTask.decisionReason = reason;
      currentTask.decisionTimestamp = new Date();
      await currentTask.save();
    }

    // Cancel all remaining active or staged tasks for this request
    await ApprovalTask.updateMany(
      { request: event._id, status: { $in: ['STAGED', 'ACTIONABLE'] } },
      { status: 'CANCELLED' }
    );

    // Release any holds / cancel reservations
    await Reservation.updateMany(
      { event: event._id },
      { status: 'CANCELLED' }
    );

    await createNotification({
      recipient: (event.organizer as any)._id,
      title: 'Event Request Rejected',
      message: `Your request "${event.title}" was rejected at ${currentStage} stage by ${reviewer.name}. Reason: ${reason}`,
      type: 'REQUEST_REJECTED',
      relatedEntityId: event._id.toString(),
      relatedEntityType: 'EventRequest',
      actionLink: `/student/requests/${event._id}`,
    });
  } else if (decision === 'CHANGES_REQUESTED') {
    resultingState = 'CHANGES_REQUESTED';
    event.changeNotes = reason;

    if (currentTask) {
      currentTask.status = 'CHANGES_REQUESTED';
      currentTask.decisionReason = reason;
      currentTask.decisionTimestamp = new Date();
      await currentTask.save();
    }

    await createNotification({
      recipient: (event.organizer as any)._id,
      title: 'Changes Requested on Event Proposal',
      message: `Reviewer ${reviewer.name} requested changes for "${event.title}": ${reason}. Please update and resubmit.`,
      type: 'CHANGES_REQUESTED',
      relatedEntityId: event._id.toString(),
      relatedEntityType: 'EventRequest',
      actionLink: `/student/requests/${event._id}`,
    });
  } else if (decision === 'APPROVED') {
    if (currentTask) {
      currentTask.status = 'APPROVED';
      currentTask.decisionReason = reason;
      currentTask.decisionTimestamp = new Date();
      await currentTask.save();
    }

    if (currentStage === 'FACULTY_REVIEW') {
      if (event.requiresHodApproval) {
        nextStage = 'HOD_REVIEW';
        resultingState = 'UNDER_REVIEW';

        // Resolve Department HOD & activate HOD task
        const dept = await Department.findById(event.department).populate('hod');
        const hodId = (dept as any)?.hod?._id || (dept as any)?.hod || (event.department as any)?.hod;

        let hodTask = await ApprovalTask.findOne({ request: event._id, stage: 'HOD_REVIEW' });
        if (hodTask) {
          hodTask.status = 'ACTIONABLE';
          if (hodId) hodTask.assignedReviewer = hodId;
          await hodTask.save();
        } else {
          hodTask = await ApprovalTask.create({
            request: event._id,
            stage: 'HOD_REVIEW',
            assignedReviewer: hodId || undefined,
            assignedReviewerRole: 'HOD',
            department: event.department._id,
            status: 'ACTIONABLE',
          });
        }

        // Notify Student of Faculty progress
        await createNotification({
          recipient: (event.organizer as any)._id,
          title: 'Faculty Approval Granted',
          message: `Faculty Coordinator ${reviewer.name} approved "${event.title}". Now forwarded to Department HOD for authorization.`,
          type: 'REQUEST_APPROVED',
          relatedEntityId: event._id.toString(),
          relatedEntityType: 'EventRequest',
          actionLink: `/student/requests/${event._id}`,
        });

        // Notify HOD
        if (hodId) {
          await createNotification({
            recipient: hodId,
            title: 'HOD Departmental Approval Required',
            message: `Event "${event.title}" was approved by Faculty Coordinator ${reviewer.name}. Actionable departmental review is now in your inbox.`,
            type: 'REVIEW_ASSIGNED',
            relatedEntityId: event._id.toString(),
            relatedEntityType: 'EventRequest',
            actionLink: `/approvals/${event._id}`,
          });
        }
      } else {
        // Skip HOD, proceed straight to Resource Manager
        nextStage = 'RESOURCE_MANAGER_REVIEW';
        resultingState = 'APPROVED_PENDING_RESOURCE_CONFIRMATION';

        let mgrTask = await ApprovalTask.findOne({ request: event._id, stage: 'RESOURCE_MANAGER_REVIEW' });
        if (mgrTask) {
          mgrTask.status = 'ACTIONABLE';
          await mgrTask.save();
        } else {
          mgrTask = await ApprovalTask.create({
            request: event._id,
            stage: 'RESOURCE_MANAGER_REVIEW',
            assignedReviewerRole: 'RESOURCE_MANAGER',
            status: 'ACTIONABLE',
          });
        }

        // Notify Student
        await createNotification({
          recipient: (event.organizer as any)._id,
          title: 'Faculty Approved - Operational Check Pending',
          message: `Faculty Coordinator approved "${event.title}". Resources are now awaiting Resource Manager allocation.`,
          type: 'REQUEST_APPROVED',
          relatedEntityId: event._id.toString(),
          relatedEntityType: 'EventRequest',
          actionLink: `/student/requests/${event._id}`,
        });

        // Notify Resource Managers
        const managers = await User.find({
          $or: [{ role: 'RESOURCE_MANAGER' }, { roles: 'RESOURCE_MANAGER' }],
        });
        for (const mgr of managers) {
          await createNotification({
            recipient: mgr._id,
            title: 'Resource Allocation Confirmation Required',
            message: `Event "${event.title}" approved. Awaiting final operational resource confirmation.`,
            type: 'REVIEW_ASSIGNED',
            relatedEntityId: event._id.toString(),
            relatedEntityType: 'EventRequest',
            actionLink: `/approvals/${event._id}`,
          });
        }
      }
    } else if (currentStage === 'HOD_REVIEW') {
      nextStage = 'RESOURCE_MANAGER_REVIEW';
      resultingState = 'APPROVED_PENDING_RESOURCE_CONFIRMATION';

      let mgrTask = await ApprovalTask.findOne({ request: event._id, stage: 'RESOURCE_MANAGER_REVIEW' });
      if (mgrTask) {
        mgrTask.status = 'ACTIONABLE';
        await mgrTask.save();
      } else {
        mgrTask = await ApprovalTask.create({
          request: event._id,
          stage: 'RESOURCE_MANAGER_REVIEW',
          assignedReviewerRole: 'RESOURCE_MANAGER',
          status: 'ACTIONABLE',
        });
      }

      // Notify Student
      await createNotification({
        recipient: (event.organizer as any)._id,
        title: 'HOD Departmental Approval Granted',
        message: `HOD ${reviewer.name} authorized your event "${event.title}". Now with Resource Managers for final allocation.`,
        type: 'REQUEST_APPROVED',
        relatedEntityId: event._id.toString(),
        relatedEntityType: 'EventRequest',
        actionLink: `/student/requests/${event._id}`,
      });

      // Notify Resource Managers
      const managers = await User.find({
        $or: [{ role: 'RESOURCE_MANAGER' }, { roles: 'RESOURCE_MANAGER' }],
      });
      for (const mgr of managers) {
        await createNotification({
          recipient: mgr._id,
          title: 'Resource Allocation Confirmation Required',
          message: `Event "${event.title}" authorized by HOD. Awaiting operational resource confirmation.`,
          type: 'REVIEW_ASSIGNED',
          relatedEntityId: event._id.toString(),
          relatedEntityType: 'EventRequest',
          actionLink: `/approvals/${event._id}`,
        });
      }
    } else if (currentStage === 'RESOURCE_MANAGER_REVIEW') {
      // Final stage - atomic confirmation check for all requested resources
      nextStage = 'COMPLETED';

      const reservations = await Reservation.find({ event: event._id });
      let allAvailable = true;

      for (const res of reservations) {
        const check = await checkResourceAvailability(
          res.resource,
          res.startDate,
          res.endDate,
          res.quantity,
          event._id
        );
        if (!check.isAvailable) {
          allAvailable = false;
          res.status = 'WAITLISTED';
          await res.save();
        } else {
          res.status = 'CONFIRMED';
          res.allocatedAt = new Date();
          await res.save();
        }
      }

      if (allAvailable) {
        resultingState = 'CONFIRMED';
        await createNotification({
          recipient: (event.organizer as any)._id,
          title: 'Event Request Confirmed!',
          message: `All stages approved! Your event "${event.title}" and required resources have been successfully confirmed.`,
          type: 'BOOKING_CONFIRMED',
          relatedEntityId: event._id.toString(),
          relatedEntityType: 'EventRequest',
          actionLink: `/student/requests/${event._id}`,
        });
      } else {
        resultingState = 'WAITLISTED';
        await createNotification({
          recipient: (event.organizer as any)._id,
          title: 'Event Approved with Waitlisted Resources',
          message: `Event was approved, but one or more resources are currently at maximum capacity. You have been placed on the priority waitlist.`,
          type: 'CHANGES_REQUESTED',
          relatedEntityId: event._id.toString(),
          relatedEntityType: 'EventRequest',
          actionLink: `/student/requests/${event._id}`,
        });
      }
    }
  }

  // Record approval decision document
  await ApprovalDecision.create({
    event: event._id,
    task: currentTask?._id,
    stage: currentStage,
    reviewer: reviewer._id,
    reviewerRole: reviewer.role,
    decision,
    reason,
    previousState,
    resultingState,
  });

  // Update Event
  event.status = resultingState;
  event.currentApprovalStage = nextStage;
  await event.save();

  // Audit log
  await logAuditEvent({
    actor: reviewer._id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: `APPROVAL_${decision}_${currentStage}`,
    entityType: 'EventRequest',
    entityId: event._id.toString(),
    details: { reason, previousState, resultingState },
  });

  return {
    success: true,
    message: `Stage ${currentStage} recorded with decision: ${decision}`,
    event,
  };
}

export async function reassignTask(params: {
  taskId: string;
  fromUser: IUser;
  toUserId: string;
  reason: string;
}): Promise<{ success: boolean; task: any }> {
  const { taskId, fromUser, toUserId, reason } = params;

  const task = await ApprovalTask.findById(taskId).populate('request');
  if (!task) {
    throw new Error('Approval task not found');
  }

  const newReviewer = await User.findById(toUserId);
  if (!newReviewer) {
    throw new Error('Target reviewer user not found');
  }

  task.reassignmentHistory.push({
    fromReviewer: fromUser._id,
    toReviewer: newReviewer._id,
    reassignedAt: new Date(),
    reason,
  });

  task.assignedReviewer = newReviewer._id;
  await task.save();

  // Notify new reviewer
  await createNotification({
    recipient: newReviewer._id,
    title: 'Approval Task Reassigned to You',
    message: `${fromUser.name} reassigned an approval review to you: ${reason}`,
    type: 'REVIEW_ASSIGNED',
    relatedEntityId: (task.request as any)?._id?.toString() || task.request.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/approvals/${(task.request as any)?._id || task.request}`,
  });

  await logAuditEvent({
    actor: fromUser._id,
    actorName: fromUser.name,
    actorRole: fromUser.role,
    action: 'APPROVAL_TASK_REASSIGNED',
    entityType: 'ApprovalTask',
    entityId: task._id.toString(),
    details: { toReviewer: newReviewer.name, reason },
  });

  return { success: true, task };
}
