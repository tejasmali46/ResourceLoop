import { Router } from 'express';
import { getInstitutionAnalytics, getUserDashboardStats } from '../controllers/analyticsController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getUserDashboardStats);
router.get('/institution', requireRoles('ADMIN', 'HOD', 'RESOURCE_MANAGER'), getInstitutionAnalytics);

export default router;
