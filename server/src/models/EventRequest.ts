import mongoose, { Schema, Document } from 'mongoose';

export type EventType =
  | 'HACKATHON'
  | 'WORKSHOP'
  | 'ORIENTATION'
  | 'GUEST_LECTURE'
  | 'COMPETITION'
  | 'CULTURAL'
  | 'CLUB_MEETING'
  | 'PROJECT_DEMO'
  | 'RESEARCH'
  | 'OTHER';

export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED_PENDING_CONFIRMATION'
  | 'APPROVED_PENDING_RESOURCE_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WAITLISTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type ApprovalStageName =
  | 'FACULTY_REVIEW'
  | 'HOD_REVIEW'
  | 'RESOURCE_MANAGER_REVIEW'
  | 'COMPLETED'
  | 'REJECTED';

export interface IEventRequest extends Document {
  requestNumber: string; // e.g. "REQ-2026-0001"
  title: string;
  description: string;
  eventType: EventType;
  organizingClub: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  facultyCoordinator: mongoose.Types.ObjectId;
  venue?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  setupMinutes: number;
  cleanupMinutes: number;
  expectedAttendance: number;
  purpose?: string;
  supportingDocs: {
    name: string;
    url?: string;
    fileType?: string;
    uploadedAt: Date;
  }[];
  status: EventStatus;
  currentApprovalStage: ApprovalStageName;
  requiresHodApproval: boolean;
  changeNotes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventRequestSchema = new Schema<IEventRequest>(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    eventType: {
      type: String,
      enum: [
        'HACKATHON',
        'WORKSHOP',
        'ORIENTATION',
        'GUEST_LECTURE',
        'COMPETITION',
        'CULTURAL',
        'CLUB_MEETING',
        'PROJECT_DEMO',
        'RESEARCH',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    organizingClub: { type: Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    facultyCoordinator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Resource' },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    setupMinutes: { type: Number, default: 30 },
    cleanupMinutes: { type: Number, default: 30 },
    expectedAttendance: { type: Number, required: true, min: 1 },
    purpose: { type: String },
    supportingDocs: [
      {
        name: { type: String, required: true },
        url: { type: String },
        fileType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'RESUBMITTED',
        'APPROVED_PENDING_CONFIRMATION',
        'APPROVED_PENDING_RESOURCE_CONFIRMATION',
        'CONFIRMED',
        'REJECTED',
        'CANCELLED',
        'WAITLISTED',
        'IN_PROGRESS',
        'COMPLETED',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    currentApprovalStage: {
      type: String,
      enum: [
        'FACULTY_REVIEW',
        'HOD_REVIEW',
        'RESOURCE_MANAGER_REVIEW',
        'COMPLETED',
        'REJECTED',
      ],
      default: 'FACULTY_REVIEW',
    },
    requiresHodApproval: { type: Boolean, default: false },
    changeNotes: { type: String },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export const EventRequest = mongoose.model<IEventRequest>('EventRequest', EventRequestSchema);
