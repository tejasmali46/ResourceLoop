import mongoose, { Schema, Document } from 'mongoose';

export type IncidentCategory =
  | 'DAMAGED_EQUIPMENT'
  | 'MISSING_COMPONENT'
  | 'LATE_RETURN'
  | 'UNAUTHORIZED_USE'
  | 'VENUE_DAMAGE'
  | 'SCHEDULING_DISPUTE'
  | 'EQUIPMENT_MALFUNCTION'
  | 'OTHER';

export type IncidentStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'AWAITING_INFORMATION'
  | 'RESOLVED'
  | 'CLOSED';

export interface IIncident extends Document {
  incidentNumber: string; // e.g. "INC-2026-0001"
  event?: mongoose.Types.ObjectId;
  resource?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  category: IncidentCategory;
  description: string;
  evidence: string[];
  status: IncidentStatus;
  assignedReviewer?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  findings?: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentNumber: { type: String, required: true, unique: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: 'EventRequest', index: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', index: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: [
        'DAMAGED_EQUIPMENT',
        'MISSING_COMPONENT',
        'LATE_RETURN',
        'UNAUTHORIZED_USE',
        'VENUE_DAMAGE',
        'SCHEDULING_DISPUTE',
        'EQUIPMENT_MALFUNCTION',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    evidence: [{ type: String }],
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
    findings: { type: String },
    resolution: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
