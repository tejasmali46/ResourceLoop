import mongoose, { Schema, Document } from 'mongoose';

export type ClubCategory = 'TECHNICAL' | 'CULTURAL' | 'ENTREPRENEURSHIP' | 'SPORTS' | 'SOCIAL' | 'ACADEMIC';

export interface IClub extends Document {
  name: string;
  code: string;
  description?: string;
  department?: mongoose.Types.ObjectId;
  category: ClubCategory;
  facultyCoordinator?: mongoose.Types.ObjectId;
  authorizedRepresentatives: mongoose.Types.ObjectId[];
  isVerified: boolean;
  logo?: string;
  monthlyBookingQuota: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    category: {
      type: String,
      enum: ['TECHNICAL', 'CULTURAL', 'ENTREPRENEURSHIP', 'SPORTS', 'SOCIAL', 'ACADEMIC'],
      default: 'TECHNICAL',
      required: true,
    },
    facultyCoordinator: { type: Schema.Types.ObjectId, ref: 'User' },
    authorizedRepresentatives: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: true },
    logo: { type: String },
    monthlyBookingQuota: { type: Number, default: 8 },
  },
  { timestamps: true }
);

export const Club = mongoose.model<IClub>('Club', ClubSchema);
