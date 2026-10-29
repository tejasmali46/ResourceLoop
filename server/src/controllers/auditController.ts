import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, entityType, limit = 50, page = 1 } = req.query;
    const query: any = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
}
