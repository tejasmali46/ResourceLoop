import { Router } from 'express';
import {
  createEventRequest,
  resubmitEventRequest,
  getEvents,
  getEventById,
  cancelEventRequest,
} from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createEventRequest);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/:id/resubmit', resubmitEventRequest);
router.post('/:id/cancel', cancelEventRequest);

export default router;
