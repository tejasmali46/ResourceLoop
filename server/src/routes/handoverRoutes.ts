import { Router } from 'express';
import {
  getHandoverQueue,
  checkoutResource,
  returnResource,
  getHandoverRecords,
} from '../controllers/handoverController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/queue', requireRoles('RESOURCE_MANAGER', 'ADMIN'), getHandoverQueue);
router.post('/checkout', requireRoles('RESOURCE_MANAGER', 'ADMIN'), checkoutResource);
router.post('/return', requireRoles('RESOURCE_MANAGER', 'ADMIN'), returnResource);
router.get('/history', getHandoverRecords);

export default router;
