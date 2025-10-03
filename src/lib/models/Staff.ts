// src/lib/models/Staff.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Staff users (ADMIN/MODERATOR) authenticate with username/email + password.
 * No applicant fields exist here.
 */
const StaffSchema = new Schema(
  {
    username: { type: String, required: false, trim: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MODERATOR"], required: true, index: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Unique when present, allow many missing
StaffSchema.index({ username: 1 }, { unique: true, sparse: true, name: "uniq_staff_username" });
StaffSchema.index({ email: 1 }, { unique: true, sparse: true, name: "uniq_staff_email" });

if (process.env.NODE_ENV !== "production") {
  StaffSchema.set("autoIndex", true);
}

export type StaffDoc = InferSchemaType<typeof StaffSchema>;
export const Staff = models.Staff || model("Staff", StaffSchema);
