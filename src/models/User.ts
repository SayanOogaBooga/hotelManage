import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "STAFF"],
      default: "STAFF",
    },
    permissions: {
      canEdit: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canViewRevenue: { type: Boolean, default: false },
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
