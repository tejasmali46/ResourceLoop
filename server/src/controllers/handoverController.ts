import { Request, Response, NextFunction } from 'express';
import { HandoverRecord } from '../models/HandoverRecord.js';
import { Reservation } from '../models/Reservation.js';
import { EventRequest } from '../models/EventRequest.js';
import { AuthRequest } from '../middleware/auth.js';
import { processCheckout, processReturn } from '../services/handoverService.js';

export async function getHandoverQueue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Ready for checkout: Confirmed reservations where status is CONFIRMED and event is CONFIRMED or IN_PROGRESS
    const readyForCheckout = await Reservation.find({
      status: 'CONFIRMED',
    })
      .populate('resource', 'name code category location accessories conditionStatus')
      .populate({
        path: 'event',
        select: 'title requestNumber organizer status startDate endDate expectedAttendance',
        populate: { path: 'organizer', select: 'name email phone studentOrEmpId' },
      })
      .sort({ startDate: 1 });

    // 2. Currently checked out: HandoverRecords with status CHECKED_OUT
    const activeCheckedOut = await HandoverRecord.find({
      status: 'CHECKED_OUT',
    })
      .populate('resource', 'name code category location accessories')
      .populate('borrower', 'name email phone studentOrEmpId')
      .populate('manager', 'name email')
      .populate('event', 'title requestNumber startDate endDate')
      .sort({ checkoutTime: -1 });

    res.status(200).json({
      success: true,
      readyForCheckout,
      activeCheckedOut,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkoutResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      eventId,
      reservationId,
      resourceId,
      initialCondition = 'EXCELLENT',
      initialNotes,
      initialAccessoriesConfirmed = true,
      quantityHandedOver = 1,
    } = req.body;

    if (!eventId || !resourceId) {
      res.status(400).json({ success: false, message: 'eventId and resourceId are required' });
      return;
    }

    const handover = await processCheckout({
      eventId,
      reservationId,
      resourceId,
      manager: req.user!,
      initialCondition,
      initialNotes,
      initialAccessoriesConfirmed,
      quantityHandedOver: Number(quantityHandedOver),
    });

    res.status(201).json({
      success: true,
      message: 'Resource handover & initial condition recorded successfully',
      handover,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Checkout failed' });
  }
}

export async function returnResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      handoverId,
      finalCondition = 'GOOD',
      finalNotes,
      finalAccessoriesConfirmed = true,
      reportedDiscrepancy = false,
    } = req.body;

    if (!handoverId) {
      res.status(400).json({ success: false, message: 'handoverId is required' });
      return;
    }

    const handover = await processReturn({
      handoverId,
      manager: req.user!,
      finalCondition,
      finalNotes,
      finalAccessoriesConfirmed,
      reportedDiscrepancy,
    });

    res.status(200).json({
      success: true,
      message: 'Resource return and final condition report recorded successfully',
      handover,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Return failed' });
  }
}

export async function getHandoverRecords(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eventId, resourceId, borrowerId } = req.query;
    const query: any = {};
    if (eventId) query.event = eventId;
    if (resourceId) query.resource = resourceId;
    if (borrowerId) query.borrower = borrowerId;

    const handovers = await HandoverRecord.find(query)
      .populate('resource', 'name code category')
      .populate('borrower', 'name email phone')
      .populate('manager', 'name email')
      .populate('event', 'title requestNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: handovers.length,
      handovers,
    });
  } catch (error) {
    next(error);
  }
}
