import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'REQUEST_SUBMITTED'
  | 'REVIEW_ASSIGNED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'CHANGES_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'HANDOVER_COMPLETED'
  | 'RETURN_COMPLETED'
  | 'INCIDENT_FLAGGED'
  | 'INCIDENT_RESOLVED'
  | 'WAITLIST_PROMOTED';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'REQUEST_SUBMITTED',
        'REVIEW_ASSIGNED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'CHANGES_REQUESTED',
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'HANDOVER_COMPLETED',
        'RETURN_COMPLETED',
        'INCIDENT_FLAGGED',
        'INCIDENT_RESOLVED',
        'WAITLIST_PROMOTED',
      ],
      required: true,
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    relatedEntityId: { type: String },
    relatedEntityType: { type: String },
    actionLink: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
