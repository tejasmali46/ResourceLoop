import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  location?: string;
  hod?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    hod: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
