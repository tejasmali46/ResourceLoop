import { Request, Response, NextFunction } from 'express';
import { Incident, IIncident } from '../models/Incident.js';
import { AuthRequest } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getIncidents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, category } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const incidents = await Incident.find(query)
      .populate('reporter', 'name email role')
      .populate('resource', 'name code location category')
      .populate('event', 'title requestNumber organizer')
      .populate('assignedReviewer', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getIncidentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id)
      .populate('reporter', 'name email role phone')
      .populate('resource', 'name code location category')
      .populate('event', 'title requestNumber organizer')
      .populate('assignedReviewer', 'name email role');

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    next(error);
  }
}

export async function createIncident(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eventId, resourceId, category, description, evidence = [] } = req.body;

    if (!category || !description) {
      res.status(400).json({ success: false, message: 'Category and description are required' });
      return;
    }

    const count = await Incident.countDocuments();
    const incidentNumber = `INC-2026-${String(count + 1).padStart(4, '0')}`;

    const incident = new Incident({
      incidentNumber,
      event: eventId || undefined,
      resource: resourceId || undefined,
      reporter: req.user!._id,
      category,
      description,
      evidence,
      status: 'OPEN',
    });

    await incident.save();

    await logAuditEvent({
      actor: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'INCIDENT_REPORTED',
      entityType: 'Incident',
      entityId: incident._id.toString(),
      details: { incidentNumber, category },
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      incident,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateIncident(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assignedReviewerId, reviewNotes, findings, resolution } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    if (status) incident.status = status;
    if (assignedReviewerId) incident.assignedReviewer = assignedReviewerId;
    if (reviewNotes !== undefined) incident.reviewNotes = reviewNotes;
    if (findings !== undefined) incident.findings = findings;
    if (resolution !== undefined) {
      incident.resolution = resolution;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        incident.resolvedAt = new Date();
      }
    }

    await incident.save();

    // If resolved, notify the reporter
    if (status === 'RESOLVED') {
      await createNotification({
        recipient: incident.reporter,
        title: 'Incident Resolved',
        message: `Incident ${incident.incidentNumber} has been resolved. Resolution: ${resolution || 'Investigation completed.'}`,
        type: 'INCIDENT_RESOLVED',
        relatedEntityId: incident._id.toString(),
        relatedEntityType: 'Incident',
        actionLink: `/incidents/${incident._id}`,
      });
    }

    await logAuditEvent({
      actor: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'INCIDENT_UPDATED',
      entityType: 'Incident',
      entityId: incident._id.toString(),
      details: { status, resolution },
    });

    res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      incident,
    });
  } catch (error) {
    next(error);
  }
}
