import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive || !user.isVerified) {
      res.status(401).json({ success: false, message: 'User not found, account deactivated, or pending verification' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles?.length ? req.user.roles : [req.user.role];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole && !userRoles.includes('ADMIN')) {
      res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}] role`,
      });
      return;
    }

    next();
  };
}
