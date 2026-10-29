import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department.js';
import { Club } from '../models/Club.js';
import { User } from '../models/User.js';
import { InstitutionSettings } from '../models/InstitutionSettings.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await Department.find().populate('hod', 'name email role');
    res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code, description, location, hodId } = req.body;
    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      location,
      hod: hodId || undefined,
    });
    res.status(201).json({ success: true, department });
  } catch (error) {
    next(error);
  }
}

export async function getClubs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clubs = await Club.find()
      .populate('department', 'name code')
      .populate('facultyCoordinator', 'name email')
      .populate('authorizedRepresentatives', 'name email studentOrEmpId');
    res.status(200).json({ success: true, clubs });
  } catch (error) {
    next(error);
  }
}

export async function createClub(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code, description, departmentId, category, facultyCoordinatorId, monthlyBookingQuota } = req.body;
    const club = await Club.create({
      name,
      code: code.toUpperCase(),
      description,
      department: departmentId || undefined,
      category: category || 'TECHNICAL',
      facultyCoordinator: facultyCoordinatorId || undefined,
      monthlyBookingQuota: monthlyBookingQuota || 8,
      isVerified: true,
    });
    res.status(201).json({ success: true, club });
  } catch (error) {
    next(error);
  }
}

export async function verifyClub(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    const club = await Club.findByIdAndUpdate(id, { isVerified }, { new: true });
    res.status(200).json({ success: true, club });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.query;
    const filter: any = {
      role: 'FACULTY',
      isActive: true,
    };
    if (departmentId) {
      filter.department = departmentId;
    }

    const faculty = await User.find(filter)
      .select('name email role department')
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.status(200).json({ success: true, faculty });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await InstitutionSettings.findOne();
    if (!settings) {
      settings = await InstitutionSettings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await InstitutionSettings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function triggerSeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { seedDatabase } = await import('../scripts/seed.js');
    const userCount = await User.countDocuments();
    const force = req.query.force === 'true' || req.body.force === true;

    if (userCount > 0 && !force) {
      res.status(200).json({
        success: true,
        message: 'Database already initialized with existing records. Pass ?force=true to reset.',
        existingUsers: userCount,
      });
      return;
    }

    await seedDatabase(force);
    res.status(200).json({
      success: true,
      message: 'Demo accounts, departments, and resources seeded successfully into database.',
    });
  } catch (error) {
    next(error);
  }
}
