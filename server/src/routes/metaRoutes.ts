import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  getClubs,
  createClub,
  verifyClub,
  getFacultyList,
  getSettings,
  updateSettings,
} from '../controllers/departmentClubController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

// Public / Authenticated read
router.get('/departments', getDepartments);
router.get('/clubs', getClubs);
router.get('/faculty', getFacultyList);
router.get('/settings', getSettings);

// Admin-only management routes
router.post('/departments', authenticate, requireRoles('ADMIN'), createDepartment);
router.post('/clubs', authenticate, requireRoles('ADMIN'), createClub);
router.put('/clubs/:id/verify', authenticate, requireRoles('ADMIN'), verifyClub);
router.put('/settings', authenticate, requireRoles('ADMIN'), updateSettings);

export default router;
