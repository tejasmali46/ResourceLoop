import mongoose, { Schema, Document } from 'mongoose';
import { ConditionGrade } from './Resource.js';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'CHECKED_OUT'
  | 'RETURNED'
  | 'CANCELLED'
  | 'RELEASED';

export interface IReservation extends Document {
  event: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  quantity: number;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  waitlistPosition: number;
  allocatedAt?: Date;
  initialCondition?: ConditionGrade;
  finalCondition?: ConditionGrade;
  handoverRecord?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'EventRequest', required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'WAITLISTED', 'CHECKED_OUT', 'RETURNED', 'CANCELLED', 'RELEASED'],
      default: 'PENDING',
      index: true,
    },
    waitlistPosition: { type: Number, default: 0 },
    allocatedAt: { type: Date },
    initialCondition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED', 'OTHER'],
    },
    finalCondition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED', 'OTHER'],
    },
    handoverRecord: { type: Schema.Types.ObjectId, ref: 'HandoverRecord' },
  },
  { timestamps: true }
);

// Compound index for efficient conflict checking and range overlap queries
ReservationSchema.index({ resource: 1, status: 1, startDate: 1, endDate: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
