import mongoose from 'mongoose';
import { Resource, IResource } from '../models/Resource.js';
import { Reservation, IReservation } from '../models/Reservation.js';
import { EventRequest } from '../models/EventRequest.js';
import { ENV } from '../config/env.js';
import { createNotification } from './notificationService.js';
import { logAuditEvent } from './auditService.js';

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  totalQuantity: number;
  availableQuantity: number;
  requestedQuantity: number;
  conflictReason?: string;
  conflictingReservations?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    quantity: number;
  }>;
  suggestedAlternativeSlots?: Array<{
    startDate: Date;
    endDate: Date;
    availableQuantity: number;
  }>;
}

/**
 * Extracts local hour, minute and total minutes for a given date in a specific timezone.
 */
export function getTimeInTimezone(
  date: Date,
  timeZone?: string
): { hours: number; minutes: number; totalMinutes: number } {
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      let hours = 0;
      let minutes = 0;
      for (const part of parts) {
        if (part.type === 'hour') {
          hours = parseInt(part.value, 10);
          if (hours === 24) hours = 0;
        } else if (part.type === 'minute') {
          minutes = parseInt(part.value, 10);
        }
      }
      return { hours, minutes, totalMinutes: hours * 60 + minutes };
    } catch {
      // Fall through to system local
    }
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

/**
 * Checks operating hours for a given time window against resource operating hours.
 * Uses institution timezone (e.g. Asia/Kolkata) and client timezone so cloud servers
 * running in UTC do not reject valid local bookings.
 */
export function checkOperatingHours(
  resource: IResource,
  startDate: Date,
  endDate: Date,
  clientTimezone?: string
): { valid: boolean; reason?: string } {
  if (!resource.operatingHours || !resource.operatingHours.start || !resource.operatingHours.end) {
    return { valid: true };
  }

  const [opStartH, opStartM] = resource.operatingHours.start.split(':').map(Number);
  const [opEndH, opEndM] = resource.operatingHours.end.split(':').map(Number);

  const opStartTotal = opStartH * 60 + (opStartM || 0);
  const opEndTotal = opEndH * 60 + (opEndM || 0);

  // Candidate timezones to evaluate:
  // 1. Client's reported timezone (e.g. from browser x-timezone header or payload)
  // 2. Configured institution timezone (ENV.INSTITUTION_TIMEZONE or 'Asia/Kolkata')
  // 3. 'Asia/Kolkata' (Apex University standard campus timezone)
  // 4. Host node local timezone fallback
  const candidateTimezones = [
    clientTimezone,
    ENV.INSTITUTION_TIMEZONE,
    'Asia/Kolkata',
  ].filter((tz): tz is string => Boolean(tz && typeof tz === 'string' && tz.trim().length > 0));

  const timezonesToCheck: Array<string | undefined> = [...new Set(candidateTimezones), undefined];

  let anyValid = false;

  for (const tz of timezonesToCheck) {
    const startInfo = getTimeInTimezone(startDate, tz);
    const endInfo = getTimeInTimezone(endDate, tz);

    if (startInfo.totalMinutes >= opStartTotal && endInfo.totalMinutes <= opEndTotal) {
      anyValid = true;
      break;
    }
  }

  if (!anyValid) {
    return {
      valid: false,
      reason: `Requested time is outside operating hours (${resource.operatingHours.start} - ${resource.operatingHours.end})`,
    };
  }

  return { valid: true };
}

/**
 * Checks if interval overlaps with any scheduled maintenance.
 */
export function checkMaintenance(
  resource: IResource,
  startDate: Date,
  endDate: Date
): { inMaintenance: boolean; reason?: string } {
  if (resource.operationalStatus === 'MAINTENANCE') {
    return { inMaintenance: true, reason: 'Resource is currently marked for maintenance' };
  }
  if (resource.operationalStatus === 'DECOMMISSIONED') {
    return { inMaintenance: true, reason: 'Resource has been decommissioned' };
  }

  for (const period of resource.maintenancePeriods || []) {
    if (new Date(startDate) < new Date(period.endDate) && new Date(endDate) > new Date(period.startDate)) {
      return {
        inMaintenance: true,
        reason: `Resource has scheduled maintenance: "${period.reason}" from ${new Date(period.startDate).toLocaleString()} to ${new Date(period.endDate).toLocaleString()}`,
      };
    }
  }

  return { inMaintenance: false };
}

/**
 * Checks real availability for a resource during a requested time window.
 */
export async function checkResourceAvailability(
  resourceId: mongoose.Types.ObjectId | string,
  startDate: Date,
  endDate: Date,
  requestedQuantity: number = 1,
  excludeEventId?: mongoose.Types.ObjectId | string,
  clientTimezone?: string
): Promise<AvailabilityCheckResult> {
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return {
      isAvailable: false,
      totalQuantity: 0,
      availableQuantity: 0,
      requestedQuantity,
      conflictReason: 'Resource not found',
    };
  }

  // 1. Operational status and maintenance check
  const maintCheck = checkMaintenance(resource, startDate, endDate);
  if (maintCheck.inMaintenance) {
    return {
      isAvailable: false,
      totalQuantity: resource.totalQuantity,
      availableQuantity: 0,
      requestedQuantity,
      conflictReason: maintCheck.reason,
    };
  }

  // 2. Operating hours check (timezone-aware)
  const hoursCheck = checkOperatingHours(resource, startDate, endDate, clientTimezone);
  if (!hoursCheck.valid) {
    return {
      isAvailable: false,
      totalQuantity: resource.totalQuantity,
      availableQuantity: 0,
      requestedQuantity,
      conflictReason: hoursCheck.reason,
    };
  }

  // 3. Query overlapping confirmed or checked_out reservations
  const query: any = {
    resource: resource._id,
    status: { $in: ['CONFIRMED', 'CHECKED_OUT'] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (excludeEventId) {
    query.event = { $ne: excludeEventId };
  }

  const overlappingReservations = await Reservation.find(query);

  let bookedQuantity = 0;
  const conflictingList = overlappingReservations.map((r) => {
    bookedQuantity += r.quantity;
    return {
      id: r._id.toString(),
      startDate: r.startDate,
      endDate: r.endDate,
      quantity: r.quantity,
    };
  });

  const availableQuantity = Math.max(0, resource.totalQuantity - bookedQuantity);
  const isAvailable = availableQuantity >= requestedQuantity;

  let suggestedAlternatives: Array<{ startDate: Date; endDate: Date; availableQuantity: number }> = [];

  if (!isAvailable) {
    suggestedAlternatives = await findAlternativeSlots(
      resource,
      startDate,
      endDate,
      requestedQuantity,
      excludeEventId,
      clientTimezone
    );
  }

  return {
    isAvailable,
    totalQuantity: resource.totalQuantity,
    availableQuantity,
    requestedQuantity,
    conflictReason: !isAvailable
      ? `Requested quantity (${requestedQuantity}) exceeds available quantity (${availableQuantity}) for the selected time window.`
      : undefined,
    conflictingReservations: conflictingList,
    suggestedAlternativeSlots: suggestedAlternatives,
  };
}

/**
 * Finds alternative available slots on the same day or next day.
 */
export async function findAlternativeSlots(
  resource: IResource,
  originalStart: Date,
  originalEnd: Date,
  requestedQuantity: number,
  excludeEventId?: mongoose.Types.ObjectId | string,
  clientTimezone?: string
): Promise<Array<{ startDate: Date; endDate: Date; availableQuantity: number }>> {
  const durationMs = originalEnd.getTime() - originalStart.getTime();
  const suggestions: Array<{ startDate: Date; endDate: Date; availableQuantity: number }> = [];

  // Check 3 slots: +2 hours, +4 hours, and next day at original start time
  const testOffsets = [
    2 * 60 * 60 * 1000,
    4 * 60 * 60 * 1000,
    24 * 60 * 60 * 1000,
  ];

  for (const offset of testOffsets) {
    const testStart = new Date(originalStart.getTime() + offset);
    const testEnd = new Date(testStart.getTime() + durationMs);

    // Validate operating hours for candidate slot using timezone awareness
    const hoursCheck = checkOperatingHours(resource, testStart, testEnd, clientTimezone);
    if (!hoursCheck.valid) continue;

    const query: any = {
      resource: resource._id,
      status: { $in: ['CONFIRMED', 'CHECKED_OUT'] },
      startDate: { $lt: testEnd },
      endDate: { $gt: testStart },
    };
    if (excludeEventId) query.event = { $ne: excludeEventId };

    const overlaps = await Reservation.find(query);
    const booked = overlaps.reduce((sum, r) => sum + r.quantity, 0);
    const avail = resource.totalQuantity - booked;

    if (avail >= requestedQuantity) {
      suggestions.push({
        startDate: testStart,
        endDate: testEnd,
        availableQuantity: avail,
      });
      if (suggestions.length >= 2) break;
    }
  }

  return suggestions;
}

/**
 * Handles waiting list promotion when an existing confirmed reservation or event is cancelled.
 */
export async function promoteWaitlistedReservations(
  resourceId: mongoose.Types.ObjectId | string,
  cancelledStart: Date,
  cancelledEnd: Date
): Promise<void> {
  // Find waitlisted reservations for this resource that overlap
  const waitlisted = await Reservation.find({
    resource: resourceId,
    status: 'WAITLISTED',
    startDate: { $lt: cancelledEnd },
    endDate: { $gt: cancelledStart },
  })
    .sort({ waitlistPosition: 1, createdAt: 1 })
    .populate('event');

  for (const res of waitlisted) {
    const check = await checkResourceAvailability(
      resourceId,
      res.startDate,
      res.endDate,
      res.quantity
    );

    if (check.isAvailable) {
      res.status = 'CONFIRMED';
      res.allocatedAt = new Date();
      res.waitlistPosition = 0;
      await res.save();

      // Check if all reservations for this parent event are now confirmed
      const parentEvent = await EventRequest.findById(res.event);
      if (parentEvent) {
        const remainingWaitlisted = await Reservation.countDocuments({
          event: parentEvent._id,
          status: 'WAITLISTED',
        });

        if (remainingWaitlisted === 0 && parentEvent.status === 'WAITLISTED') {
          parentEvent.status = 'CONFIRMED';
          await parentEvent.save();

          await createNotification({
            recipient: parentEvent.organizer,
            title: 'Waitlist Promoted: Reservation Confirmed!',
            message: `Great news! Resource capacity opened up and your event "${parentEvent.title}" has been confirmed.`,
            type: 'WAITLIST_PROMOTED',
            relatedEntityId: parentEvent._id.toString(),
            relatedEntityType: 'EventRequest',
            actionLink: `/student/requests/${parentEvent._id}`,
          });

          await logAuditEvent({
            actor: parentEvent.organizer,
            actorName: 'System Fair Scheduler',
            actorRole: 'SYSTEM',
            action: 'WAITLIST_PROMOTED',
            entityType: 'EventRequest',
            entityId: parentEvent._id.toString(),
            details: { resourceId: resourceId.toString(), reservationId: res._id.toString() },
          });
        }
      }
    }
  }
}
