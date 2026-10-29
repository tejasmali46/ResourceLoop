import mongoose, { Schema, Document } from 'mongoose';
import { ConditionGrade } from './Resource.js';

export type HandoverStatus = 'CHECKED_OUT' | 'RETURNED' | 'COMPLETED' | 'DISCREPANCY_FLAGGED';

export interface IHandoverRecord extends Document {
  event: mongoose.Types.ObjectId;
  reservation?: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  manager: mongoose.Types.ObjectId;
  quantityHandedOver: number;
  checkoutTime: Date;
  initialCondition: ConditionGrade;
  initialNotes?: string;
  initialAccessoriesConfirmed: boolean;
  initialEvidence?: string[];
  returnTime?: Date;
  finalCondition?: ConditionGrade;
  finalNotes?: string;
  finalAccessoriesConfirmed?: boolean;
  finalEvidence?: string[];
  discrepancyFlagged: boolean;
  status: HandoverStatus;
  createdAt: Date;
  updatedAt: Date;
}

const HandoverRecordSchema = new Schema<IHandoverRecord>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'EventRequest', required: true, index: true },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quantityHandedOver: { type: Number, required: true, default: 1 },
    checkoutTime: { type: Date, required: true, default: Date.now },
    initialCondition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED', 'OTHER'],
      default: 'EXCELLENT',
    },
    initialNotes: { type: String },
    initialAccessoriesConfirmed: { type: Boolean, default: true },
    initialEvidence: [{ type: String }],
    returnTime: { type: Date },
    finalCondition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED', 'OTHER'],
    },
    finalNotes: { type: String },
    finalAccessoriesConfirmed: { type: Boolean },
    finalEvidence: [{ type: String }],
    discrepancyFlagged: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['CHECKED_OUT', 'RETURNED', 'COMPLETED', 'DISCREPANCY_FLAGGED'],
      default: 'CHECKED_OUT',
      index: true,
    },
  },
  { timestamps: true }
);

export const HandoverRecord = mongoose.model<IHandoverRecord>(
  'HandoverRecord',
  HandoverRecordSchema
);
