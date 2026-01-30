import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true, // Cria automaticamente createdAt e updatedAt
  }
);

// Evita redefinição do modelo durante hot-reload
export const User = mongoose.models?.User || mongoose.model<IUser>('User', UserSchema);