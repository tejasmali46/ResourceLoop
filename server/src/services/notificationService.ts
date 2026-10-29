import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification.js';

export async function createNotification(params: {
  recipient: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionLink?: string;
}): Promise<void> {
  try {
    await Notification.create({
      recipient: params.recipient,
      title: params.title,
      message: params.message,
      type: params.type,
      relatedEntityId: params.relatedEntityId,
      relatedEntityType: params.relatedEntityType,
      actionLink: params.actionLink,
    });
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
  }
}
