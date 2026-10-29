import mongoose, { Schema, Document } from 'mongoose';

export type ResourceCategory =
  | 'AUDIO_VISUAL'
  | 'COMPUTING'
  | 'PHOTOGRAPHY'
  | 'MAKER_FABRICATION'
  | 'LABORATORY'
  | 'CLASSROOM'
  | 'SEMINAR_HALL'
  | 'AUDITORIUM'
  | 'CONFERENCE_ROOM'
  | 'WORKSHOP'
  | 'OTHER';

export type ResourceType = 'INDIVIDUAL' | 'POOLED';

export type OperationalStatus = 'AVAILABLE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export type ConditionGrade = 'EXCELLENT' | 'GOOD' | 'MINOR_ISSUES' | 'DAMAGED' | 'OTHER';

export interface IResource extends Document {
  name: string;
  code: string;
  category: ResourceCategory;
  description: string;
  image?: string;
  department: mongoose.Types.ObjectId;
  location: string;
  manager: mongoose.Types.ObjectId;
  resourceType: ResourceType;
  capacity?: number; // seating capacity for venues
  totalQuantity: number;
  availableQuantity: number;
  operationalStatus: OperationalStatus;
  operatingHours: {
    start: string; // e.g. "08:00"
    end: string;   // e.g. "20:00"
  };
  maxBookingHours: number;
  minAdvanceHours: number;
  usageInstructions?: string;
  eligibilityNotes?: string;
  requiresTraining: boolean;
  requiresSupervision: boolean;
  requiresHodApproval: boolean;
  accessories: string[];
  conditionStatus: ConditionGrade;
  maintenancePeriods: {
    startDate: Date;
    endDate: Date;
    reason: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    category: {
      type: String,
      enum: [
        'AUDIO_VISUAL',
        'COMPUTING',
        'PHOTOGRAPHY',
        'MAKER_FABRICATION',
        'LABORATORY',
        'CLASSROOM',
        'SEMINAR_HALL',
        'AUDITORIUM',
        'CONFERENCE_ROOM',
        'WORKSHOP',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    image: { type: String },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    location: { type: String, required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resourceType: {
      type: String,
      enum: ['INDIVIDUAL', 'POOLED'],
      default: 'INDIVIDUAL',
      required: true,
    },
    capacity: { type: Number, default: 0 },
    totalQuantity: { type: Number, required: true, default: 1, min: 1 },
    availableQuantity: { type: Number, required: true, default: 1, min: 0 },
    operationalStatus: {
      type: String,
      enum: ['AVAILABLE', 'MAINTENANCE', 'DECOMMISSIONED'],
      default: 'AVAILABLE',
      index: true,
    },
    operatingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '20:00' },
    },
    maxBookingHours: { type: Number, default: 12 },
    minAdvanceHours: { type: Number, default: 4 },
    usageInstructions: { type: String },
    eligibilityNotes: { type: String },
    requiresTraining: { type: Boolean, default: false },
    requiresSupervision: { type: Boolean, default: false },
    requiresHodApproval: { type: Boolean, default: false },
    accessories: [{ type: String }],
    conditionStatus: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED', 'OTHER'],
      default: 'EXCELLENT',
    },
    maintenancePeriods: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
