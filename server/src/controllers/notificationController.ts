import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user!._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await Notification.updateMany({ recipient: req.user!._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}
