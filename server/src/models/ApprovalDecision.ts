import mongoose, { Schema, Document } from 'mongoose';
import { ApprovalStageName } from './EventRequest.js';

export type DecisionType = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface IApprovalDecision extends Document {
  event: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  stage: ApprovalStageName;
  reviewer: mongoose.Types.ObjectId;
  reviewerRole: string;
  decision: DecisionType;
  reason: string;
  previousState: string;
  resultingState: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalDecisionSchema = new Schema<IApprovalDecision>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'EventRequest', required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'ApprovalTask' },
    stage: {
      type: String,
      enum: ['FACULTY_REVIEW', 'HOD_REVIEW', 'RESOURCE_MANAGER_REVIEW', 'COMPLETED', 'REJECTED'],
      required: true,
    },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerRole: { type: String, required: true },
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
      required: true,
    },
    reason: { type: String, required: true },
    previousState: { type: String, required: true },
    resultingState: { type: String, required: true },
  },
  { timestamps: true }
);

export const ApprovalDecision = mongoose.model<IApprovalDecision>(
  'ApprovalDecision',
  ApprovalDecisionSchema
);
