import mongoose from 'mongoose';
import { HandoverRecord, IHandoverRecord } from '../models/HandoverRecord.js';
import { EventRequest } from '../models/EventRequest.js';
import { Reservation } from '../models/Reservation.js';
import { Incident } from '../models/Incident.js';
import { ConditionGrade } from '../models/Resource.js';
import { IUser } from '../models/User.js';
import { createNotification } from './notificationService.js';
import { logAuditEvent } from './auditService.js';

export interface CheckoutParams {
  eventId: string;
  reservationId?: string;
  resourceId: string;
  manager: IUser;
  initialCondition: ConditionGrade;
  initialNotes?: string;
  initialAccessoriesConfirmed: boolean;
  quantityHandedOver?: number;
}

export interface ReturnParams {
  handoverId: string;
  manager: IUser;
  finalCondition: ConditionGrade;
  finalNotes?: string;
  finalAccessoriesConfirmed: boolean;
  reportedDiscrepancy?: boolean;
}

export async function processCheckout(params: CheckoutParams): Promise<IHandoverRecord> {
  const {
    eventId,
    reservationId,
    resourceId,
    manager,
    initialCondition,
    initialNotes,
    initialAccessoriesConfirmed,
    quantityHandedOver = 1,
  } = params;

  const event = await EventRequest.findById(eventId).populate('organizer', 'name email');
  if (!event) throw new Error('Event request not found');

  if (event.status !== 'CONFIRMED' && event.status !== 'IN_PROGRESS') {
    throw new Error(`Cannot checkout resource. Event is in status: ${event.status}`);
  }

  // Create HandoverRecord
  const handover = await HandoverRecord.create({
    event: event._id,
    reservation: reservationId,
    resource: resourceId,
    borrower: event.organizer._id,
    manager: manager._id,
    quantityHandedOver,
    checkoutTime: new Date(),
    initialCondition,
    initialNotes,
    initialAccessoriesConfirmed,
    status: 'CHECKED_OUT',
  });

  // Update reservation
  if (reservationId) {
    await Reservation.findByIdAndUpdate(reservationId, {
      status: 'CHECKED_OUT',
      initialCondition,
      handoverRecord: handover._id,
    });
  }

  // Update event status to IN_PROGRESS if not already
  if (event.status !== 'IN_PROGRESS') {
    event.status = 'IN_PROGRESS';
    await event.save();
  }

  await createNotification({
    recipient: (event.organizer as any)._id,
    title: 'Equipment Checked Out',
    message: `Resource checkout recorded for "${event.title}". Initial condition: ${initialCondition}.`,
    type: 'HANDOVER_COMPLETED',
    relatedEntityId: handover._id.toString(),
    relatedEntityType: 'HandoverRecord',
    actionLink: `/student/handover`,
  });

  await logAuditEvent({
    actor: manager._id,
    actorName: manager.name,
    actorRole: manager.role,
    action: 'RESOURCE_CHECKOUT',
    entityType: 'HandoverRecord',
    entityId: handover._id.toString(),
    details: { initialCondition, initialAccessoriesConfirmed, quantityHandedOver },
  });

  return handover;
}

export async function processReturn(params: ReturnParams): Promise<IHandoverRecord> {
  const {
    handoverId,
    manager,
    finalCondition,
    finalNotes,
    finalAccessoriesConfirmed,
    reportedDiscrepancy = false,
  } = params;

  const handover = await HandoverRecord.findById(handoverId)
    .populate('event')
    .populate('resource')
    .populate('borrower', 'name email');

  if (!handover) throw new Error('Handover record not found');
  if (handover.status === 'RETURNED' || handover.status === 'COMPLETED') {
    throw new Error('This handover record is already returned and completed.');
  }

  // Detect discrepancy between initial and final condition
  const conditionDegraded =
    (handover.initialCondition === 'EXCELLENT' || handover.initialCondition === 'GOOD') &&
    (finalCondition === 'DAMAGED' || finalCondition === 'MINOR_ISSUES');

  const discrepancy = reportedDiscrepancy || conditionDegraded || !finalAccessoriesConfirmed;

  handover.returnTime = new Date();
  handover.finalCondition = finalCondition;
  handover.finalNotes = finalNotes;
  handover.finalAccessoriesConfirmed = finalAccessoriesConfirmed;
  handover.discrepancyFlagged = discrepancy;
  handover.status = discrepancy ? 'DISCREPANCY_FLAGGED' : 'RETURNED';
  await handover.save();

  // Update reservation
  if (handover.reservation) {
    await Reservation.findByIdAndUpdate(handover.reservation, {
      status: 'RETURNED',
      finalCondition,
    });
  }

  // If discrepancy flagged, automatically create an incident for investigation
  if (discrepancy) {
    const incCount = await Incident.countDocuments();
    const incNumber = `INC-2026-${String(incCount + 1).padStart(4, '0')}`;

    let category: any = 'DAMAGED_EQUIPMENT';
    if (!finalAccessoriesConfirmed) category = 'MISSING_COMPONENT';

    await Incident.create({
      incidentNumber: incNumber,
      event: handover.event._id,
      resource: handover.resource._id,
      reporter: manager._id,
      category,
      description: `Condition degradation or missing accessories reported during check-in return. Initial condition: ${handover.initialCondition}, Final condition: ${finalCondition}. Notes: ${finalNotes || 'None'}`,
      status: 'OPEN',
    });

    await createNotification({
      recipient: (handover.borrower as any)._id,
      title: 'Incident Notice: Condition Discrepancy Flagged',
      message: `A discrepancy was recorded during the return of ${(handover.resource as any)?.name}. An institutional review has been logged.`,
      type: 'INCIDENT_FLAGGED',
      relatedEntityId: handover.event._id.toString(),
      relatedEntityType: 'Incident',
      actionLink: `/student/incidents`,
    });
  }

  // Check if all active handovers for this event are returned
  const pendingHandovers = await HandoverRecord.countDocuments({
    event: handover.event._id,
    status: 'CHECKED_OUT',
  });

  if (pendingHandovers === 0) {
    await EventRequest.findByIdAndUpdate(handover.event._id, {
      status: 'COMPLETED',
    });
  }

  await createNotification({
    recipient: (handover.borrower as any)._id,
    title: 'Resource Return Recorded',
    message: `Return recorded for ${(handover.resource as any)?.name}. Status: ${handover.status}.`,
    type: 'RETURN_COMPLETED',
    relatedEntityId: handover._id.toString(),
    relatedEntityType: 'HandoverRecord',
    actionLink: `/student/handover`,
  });

  await logAuditEvent({
    actor: manager._id,
    actorName: manager.name,
    actorRole: manager.role,
    action: 'RESOURCE_RETURN',
    entityType: 'HandoverRecord',
    entityId: handover._id.toString(),
    details: { finalCondition, discrepancyFlagged: discrepancy },
  });

  return handover;
}
