import mongoose, { Schema, Document } from 'mongoose';
import { ApprovalStageName } from './EventRequest.js';

export type TaskStatus =
  | 'ACTIONABLE'
  | 'STAGED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'CANCELLED';

export interface IApprovalTask extends Document {
  request: mongoose.Types.ObjectId;
  stage: ApprovalStageName;
  assignedReviewer?: mongoose.Types.ObjectId;
  assignedReviewerRole: 'FACULTY' | 'HOD' | 'RESOURCE_MANAGER' | 'ADMIN';
  department?: mongoose.Types.ObjectId;
  status: TaskStatus;
  decisionReason?: string;
  decisionTimestamp?: Date;
  reassignmentHistory: {
    fromReviewer?: mongoose.Types.ObjectId;
    toReviewer: mongoose.Types.ObjectId;
    reassignedAt: Date;
    reason: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalTaskSchema = new Schema<IApprovalTask>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'EventRequest', required: true, index: true },
    stage: {
      type: String,
      enum: ['FACULTY_REVIEW', 'HOD_REVIEW', 'RESOURCE_MANAGER_REVIEW', 'COMPLETED', 'REJECTED'],
      required: true,
      index: true,
    },
    assignedReviewer: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedReviewerRole: {
      type: String,
      enum: ['FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'],
      required: true,
      index: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    status: {
      type: String,
      enum: ['ACTIONABLE', 'STAGED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'CANCELLED'],
      default: 'ACTIONABLE',
      index: true,
    },
    decisionReason: { type: String },
    decisionTimestamp: { type: Date },
    reassignmentHistory: [
      {
        fromReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
        toReviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reassignedAt: { type: Date, default: Date.now },
        reason: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const ApprovalTask = mongoose.model<IApprovalTask>('ApprovalTask', ApprovalTaskSchema);
