import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'STUDENT' | 'FACULTY' | 'HOD' | 'RESOURCE_MANAGER' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roles: UserRole[];
  department?: mongoose.Types.ObjectId;
  phone?: string;
  studentOrEmpId?: string;
  clubMemberships: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'],
      default: 'STUDENT',
      required: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: ['STUDENT', 'FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN'],
      default: ['STUDENT'],
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    phone: { type: String, trim: true },
    studentOrEmpId: { type: String, trim: true },
    clubMemberships: [{ type: Schema.Types.ObjectId, ref: 'Club' }],
    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.roles || this.roles.length === 0) {
      this.roles = [this.role];
    } else if (!this.roles.includes(this.role)) {
      this.roles.push(this.role);
    }
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
