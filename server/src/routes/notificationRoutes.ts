import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);

export default router;
