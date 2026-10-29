import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export async function logAuditEvent(params: {
  actor?: mongoose.Types.ObjectId | string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      actor: params.actor,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress: params.ipAddress,
    });
  } catch (error) {
    console.error('[AuditService] Error logging audit event:', error);
  }
}
