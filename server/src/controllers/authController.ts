import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Club } from '../models/Club.js';
import { Notification } from '../models/Notification.js';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, roles: user.roles },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, department, phone, studentOrEmpId, clubId } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    // Role safety: Public registration only allows STUDENT role. Privileged roles require Admin creation.
    const role: UserRole = 'STUDENT';
    const roles: UserRole[] = ['STUDENT'];

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      roles,
      department: department || undefined,
      phone: phone || undefined,
      studentOrEmpId: studentOrEmpId || undefined,
      clubMemberships: clubId ? [clubId] : [],
      isVerified: true,
      isActive: true,
    });

    await user.save();

    const token = generateToken(user);

    await logAuditEvent({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account successfully registered',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
        department: user.department,
        clubMemberships: user.clubMemberships,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('department', 'name code')
      .populate('clubMemberships', 'name code category isVerified');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact Administrator.' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ success: false, message: 'This account is pending institutional verification. Please contact Administrator.' });
      return;
    }

    const token = generateToken(user);

    await logAuditEvent({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
        department: user.department,
        clubMemberships: user.clubMemberships,
        studentOrEmpId: user.studentOrEmpId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department', 'name code')
      .populate('clubMemberships', 'name code category isVerified');

    const unreadNotificationsCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      user,
      unreadNotificationsCount,
    });
  } catch (error) {
    next(error);
  }
}
