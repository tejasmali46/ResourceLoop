import { Router } from 'express';
import {
  getPendingApprovals,
  submitApprovalDecision,
  forwardOrReassignTask,
  getFacultyDashboard,
  getHodDashboard,
  getApprovalPolicies,
  updateApprovalPolicy,
} from '../controllers/approvalController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/pending', requireRoles('FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'), getPendingApprovals);
router.post('/decision', requireRoles('FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'), submitApprovalDecision);
router.post('/reassign', requireRoles('FACULTY', 'HOD', 'ADMIN'), forwardOrReassignTask);
router.get('/faculty-dashboard', requireRoles('FACULTY', 'ADMIN'), getFacultyDashboard);
router.get('/hod-dashboard', requireRoles('HOD', 'ADMIN'), getHodDashboard);
router.get('/policies', getApprovalPolicies);
router.put('/policies/:id', requireRoles('ADMIN'), updateApprovalPolicy);

export default router;
