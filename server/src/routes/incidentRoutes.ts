import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
} from '../controllers/incidentController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.post('/', createIncident);
router.put('/:id', requireRoles('RESOURCE_MANAGER', 'FACULTY', 'HOD', 'ADMIN'), updateIncident);

export default router;
