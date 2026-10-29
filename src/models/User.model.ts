/**
 * @file User.model.ts
 * @description Mongoose model for User (customers, employees, admins).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { hashPassword } from '../shared/helpers/password.helper';
import { isValidIndianPhone, normalizeIndianPhone } from '../shared/helpers/indian.helper';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  passwordHash?: string;
  role: 'USER' | 'EMPLOYEE' | 'ADMIN';
  isActive: boolean;
  profileImage?: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      index: true,
      validate: {
        validator: (v: string) => !v || isValidIndianPhone(v),
        message: 'Phone must be a valid 10-digit Indian mobile number',
      },
      set: (v: string) => (v ? normalizeIndianPhone(v) : v),
    },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['USER', 'EMPLOYEE', 'ADMIN'],
      default: 'USER',
    },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Pre-save hook: hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  this.passwordHash = await hashPassword(this.passwordHash);
  next();
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
