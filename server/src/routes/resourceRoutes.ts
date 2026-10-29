import { Router } from 'express';
import {
  getResources,
  getResourceById,
  checkAvailability,
  createResource,
  updateResource,
  scheduleMaintenance,
} from '../controllers/resourceController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

// Public / Authenticated read routes
router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/check-availability', checkAvailability);

// Protected mutation routes
router.post('/', authenticate, requireRoles('RESOURCE_MANAGER', 'ADMIN'), createResource);
router.put('/:id', authenticate, requireRoles('RESOURCE_MANAGER', 'ADMIN'), updateResource);
router.post('/:id/maintenance', authenticate, requireRoles('RESOURCE_MANAGER', 'ADMIN'), scheduleMaintenance);

export default router;
