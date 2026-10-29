import mongoose, { Schema, Document } from 'mongoose';

export interface IInstitutionSettings extends Document {
  institutionName: string;
  institutionTimezone: string;
  defaultBufferMinutes: number;
  maxClubMonthlyBookings: number;
  requireHodAboveAttendance: number;
  autoCancelHoldMinutes: number;
  allowWeekendBookings: boolean;
  termsAndConditions: string;
  aiEnabled: boolean;
  aiProvider: 'GEMINI' | 'OPENAI' | 'RULE_BASED';
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSettingsSchema = new Schema<IInstitutionSettings>(
  {
    institutionName: { type: String, default: 'Apex University of Technology & Sciences' },
    institutionTimezone: { type: String, default: 'Asia/Kolkata' },
    defaultBufferMinutes: { type: Number, default: 30 },
    maxClubMonthlyBookings: { type: Number, default: 10 },
    requireHodAboveAttendance: { type: Number, default: 100 },
    autoCancelHoldMinutes: { type: Number, default: 60 },
    allowWeekendBookings: { type: Boolean, default: true },
    termsAndConditions: {
      type: String,
      default: 'Resources must be used responsibly for educational and extracurricular university activities.',
    },
    aiEnabled: { type: Boolean, default: true },
    aiProvider: {
      type: String,
      enum: ['GEMINI', 'OPENAI', 'RULE_BASED'],
      default: 'RULE_BASED',
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const InstitutionSettings = mongoose.model<IInstitutionSettings>(
  'InstitutionSettings',
  InstitutionSettingsSchema
);
