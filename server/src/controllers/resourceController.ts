import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Resource, IResource } from '../models/Resource.js';
import { Reservation } from '../models/Reservation.js';
import { checkResourceAvailability } from '../services/schedulingEngine.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getResources(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      category,
      department,
      operationalStatus,
      search,
      resourceType,
      minCapacity,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const query: any = {};

    if (category) query.category = category;
    if (department) query.department = department;
    if (operationalStatus) query.operationalStatus = operationalStatus;
    if (resourceType) query.resourceType = resourceType;
    if (minCapacity) query.capacity = { $gte: Number(minCapacity) };

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { description: searchRegex }, { location: searchRegex }];
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    const resources = await Resource.find(query)
      .populate('department', 'name code location')
      .populate('manager', 'name email')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { startDate, endDate, quantity } = req.query;

    const resource = await Resource.findById(id)
      .populate('department', 'name code location')
      .populate('manager', 'name email phone');

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    let availabilityInfo = null;
    const clientTimezone = (req.query.timezone || req.headers['x-timezone']) as string | undefined;
    if (startDate && endDate) {
      availabilityInfo = await checkResourceAvailability(
        resource._id,
        new Date(String(startDate)),
        new Date(String(endDate)),
        quantity ? Number(quantity) : 1,
        undefined,
        clientTimezone
      );
    }

    // Recent reservations for calendar display
    const upcomingReservations = await Reservation.find({
      resource: resource._id,
      status: { $in: ['CONFIRMED', 'CHECKED_OUT'] },
      endDate: { $gte: new Date() },
    })
      .populate('event', 'title requestNumber expectedAttendance')
      .sort({ startDate: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      resource,
      availabilityInfo,
      upcomingReservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resourceId, startDate, endDate, quantity = 1, excludeEventId } = req.body;

    if (!resourceId || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'resourceId, startDate, and endDate are required' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid start or end date format' });
      return;
    }

    if (end <= start) {
      res.status(400).json({ success: false, message: 'End time must be after start time' });
      return;
    }

    const clientTimezone = (req.body.clientTimezone || req.headers['x-timezone']) as string | undefined;

    const result = await checkResourceAvailability(
      resourceId,
      start,
      end,
      Number(quantity),
      excludeEventId,
      clientTimezone
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      code,
      category,
      description,
      image,
      department,
      location,
      resourceType,
      capacity,
      totalQuantity = 1,
      operatingHours,
      maxBookingHours,
      minAdvanceHours,
      usageInstructions,
      eligibilityNotes,
      requiresTraining,
      requiresSupervision,
      requiresHodApproval,
      accessories,
    } = req.body;

    const existing = await Resource.findOne({ code: code?.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: `Resource with code ${code} already exists.` });
      return;
    }

    const resource = new Resource({
      name,
      code: code.toUpperCase(),
      category,
      description,
      image,
      department,
      location,
      manager: req.user!._id,
      resourceType: resourceType || 'INDIVIDUAL',
      capacity: capacity || 0,
      totalQuantity,
      availableQuantity: totalQuantity,
      operationalStatus: 'AVAILABLE',
      operatingHours: operatingHours || { start: '08:00', end: '20:00' },
      maxBookingHours: maxBookingHours || 12,
      minAdvanceHours: minAdvanceHours || 4,
      usageInstructions,
      eligibilityNotes,
      requiresTraining: Boolean(requiresTraining),
      requiresSupervision: Boolean(requiresSupervision),
      requiresHodApproval: Boolean(requiresHodApproval),
      accessories: accessories || [],
      conditionStatus: 'EXCELLENT',
    });

    await resource.save();

    await logAuditEvent({
      actor: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'RESOURCE_CREATED',
      entityType: 'Resource',
      entityId: resource._id.toString(),
      details: { name: resource.name, code: resource.code },
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const resource = await Resource.findByIdAndUpdate(id, updates, { new: true });
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    await logAuditEvent({
      actor: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'RESOURCE_UPDATED',
      entityType: 'Resource',
      entityId: resource._id.toString(),
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
}

export async function scheduleMaintenance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      res.status(400).json({ success: false, message: 'startDate, endDate, and reason are required' });
      return;
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    resource.maintenancePeriods.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });
    await resource.save();

    await logAuditEvent({
      actor: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'MAINTENANCE_SCHEDULED',
      entityType: 'Resource',
      entityId: resource._id.toString(),
      details: { startDate, endDate, reason },
    });

    res.status(200).json({
      success: true,
      message: 'Maintenance period added',
      resource,
    });
  } catch (error) {
    next(error);
  }
}
