import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, q, role, department, isActive, isVerified, page = '1', limit = '50' } = req.query;

    const filter: any = {};

    const searchQuery = search || q;
    if (searchQuery) {
      const regex = new RegExp(String(searchQuery).trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { studentOrEmpId: regex }];
    }

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (department && department !== 'ALL') {
      filter.department = department;
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      filter.isActive = String(isActive) === 'true';
    }

    if (isVerified !== undefined && isVerified !== 'ALL') {
      filter.isVerified = String(isVerified) === 'true';
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .populate('department', 'name code location')
        .populate('clubMemberships', 'name code category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      users,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate('department', 'name code location')
      .populate('clubMemberships', 'name code category');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminUser = req.user!;
    const {
      name,
      email,
      password,
      role = 'STUDENT',
      department,
      phone,
      studentOrEmpId,
      isActive = true,
      isVerified = true,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }

    const validRoles: UserRole[] = ['STUDENT', 'FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      roles: [role],
      department: department || undefined,
      phone: phone || undefined,
      studentOrEmpId: studentOrEmpId || undefined,
      isActive: Boolean(isActive),
      isVerified: Boolean(isVerified),
    });

    await newUser.save();

    await logAuditEvent({
      actor: adminUser._id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'USER_PROVISIONED_BY_ADMIN',
      entityType: 'User',
      entityId: newUser._id.toString(),
      details: { name: newUser.name, email: newUser.email, role: newUser.role },
      ipAddress: req.ip,
    });

    const populatedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'User account provisioned successfully',
      user: populatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminUser = req.user!;
    const { id } = req.params;
    const {
      name,
      role,
      department,
      phone,
      studentOrEmpId,
      isActive,
      isVerified,
      password,
    } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Safety check: Prevent removing or deactivating the final active administrator
    const isTargetAdmin = targetUser.role === 'ADMIN' || targetUser.roles?.includes('ADMIN');
    const isRevokingAdmin = role && role !== 'ADMIN';
    const isDeactivating = isActive === false;

    if (isTargetAdmin && (isRevokingAdmin || isDeactivating)) {
      const otherActiveAdminsCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        _id: { $ne: targetUser._id },
      });

      if (otherActiveAdminsCount === 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate or revoke the role of the final active administrator.',
        });
        return;
      }
    }

    if (name) targetUser.name = name.trim();
    if (phone !== undefined) targetUser.phone = phone ? phone.trim() : undefined;
    if (studentOrEmpId !== undefined) targetUser.studentOrEmpId = studentOrEmpId ? studentOrEmpId.trim() : undefined;
    if (department !== undefined) targetUser.department = department ? new mongoose.Types.ObjectId(department) : undefined;
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);
    if (isVerified !== undefined) targetUser.isVerified = Boolean(isVerified);

    if (role) {
      const validRoles: UserRole[] = ['STUDENT', 'FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
        });
        return;
      }
      targetUser.role = role;
      if (!targetUser.roles.includes(role)) {
        targetUser.roles = [role];
      }
    }

    if (password && password.trim()) {
      targetUser.password = password.trim();
    }

    await targetUser.save();

    await logAuditEvent({
      actor: adminUser._id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'USER_UPDATED_BY_ADMIN',
      entityType: 'User',
      entityId: targetUser._id.toString(),
      details: {
        updatedFields: { role, department, isActive, isVerified },
        targetEmail: targetUser.email,
      },
      ipAddress: req.ip,
    });

    const updated = await User.findById(targetUser._id)
      .select('-password')
      .populate('department', 'name code location');

    res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminUser = req.user!;
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Safety check: Prevent deleting/deactivating the final active administrator
    if (targetUser.role === 'ADMIN' || targetUser.roles?.includes('ADMIN')) {
      const otherActiveAdminsCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        _id: { $ne: targetUser._id },
      });

      if (otherActiveAdminsCount === 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate or delete the final active administrator.',
        });
        return;
      }
    }

    // Prefer safe deactivation to preserve foreign key references
    targetUser.isActive = false;
    await targetUser.save();

    await logAuditEvent({
      actor: adminUser._id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'USER_DEACTIVATED_BY_ADMIN',
      entityType: 'User',
      entityId: targetUser._id.toString(),
      details: { targetEmail: targetUser.email },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User account has been deactivated successfully to preserve audit history.',
    });
  } catch (error) {
    next(error);
  }
}
