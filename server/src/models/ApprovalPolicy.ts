import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalPolicy extends Document {
  name: string;
  description?: string;
  eventType?: string;
  department?: mongoose.Types.ObjectId;
  stages: {
    stageName: 'FACULTY_REVIEW' | 'HOD_REVIEW' | 'RESOURCE_MANAGER_REVIEW';
    roleRequired: 'FACULTY' | 'HOD' | 'RESOURCE_MANAGER' | 'ADMIN';
    isMandatory: boolean;
    order: number;
  }[];
  minAttendanceForHod: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalPolicySchema = new Schema<IApprovalPolicy>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    eventType: { type: String },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    stages: [
      {
        stageName: {
          type: String,
          enum: ['FACULTY_REVIEW', 'HOD_REVIEW', 'RESOURCE_MANAGER_REVIEW'],
          required: true,
        },
        roleRequired: {
          type: String,
          enum: ['FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'],
          required: true,
        },
        isMandatory: { type: Boolean, default: true },
        order: { type: Number, required: true },
      },
    ],
    minAttendanceForHod: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ApprovalPolicy = mongoose.model<IApprovalPolicy>(
  'ApprovalPolicy',
  ApprovalPolicySchema
);
