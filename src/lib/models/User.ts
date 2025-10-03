// src/models/User.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Unified User model for BOTH applicants and staff.
 *
 * Applicants:
 *  - firebaseUid, phone, admissionFormId, profile fields, department selection
 *
 * Staff (ADMIN/MODERATOR):
 *  - username/email + passwordHash
 *
 * Notes:
 *  - firebaseUid/phone/admissionFormId are sparse+unique so staff rows can exist without them.
 *  - username/email are sparse+unique so applicants can exist without them.
 *  - Role defaults to "APPLICANT".
 */

const UserSchema = new Schema(
  {
    // ---------- Identity (applicant via Firebase) ----------
    firebaseUid: { type: String, required: false }, // sparse unique below
    phone: { type: String, required: false },       // E.164; sparse unique below
    admissionFormId: { type: String, required: false }, // sparse unique below

    // ---------- Identity (staff credentials) ----------
    username: { type: String, required: false, trim: true },                 // sparse unique below
    email:    { type: String, required: false, lowercase: true, trim: true },// sparse unique below
    passwordHash: { type: String, required: false },                         // bcrypt hash for staff

    // ---------- Role / RBAC ----------
    role: {
      type: String,
      enum: ["APPLICANT", "MODERATOR", "ADMIN"],
      default: "APPLICANT",
      index: true,
    },

    // ---------- Profile (applicant) ----------
    name: { type: String, required: false },
    fatherName: { type: String, required: false },
    motherName: { type: String, required: false },
    sscGPA: { type: Number, required: false, min: 0, max: 5 },
    hscGPA: { type: Number, required: false, min: 0, max: 5 },

    // ---------- Department selection (applicant) ----------
    selectedDepartmentSlug: { type: String, required: false },
    selectedDepartmentAt:   { type: Date, required: false },

    // ---------- Auditing ----------
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    strict: true,
  }
);

// -------------------- Indexes (single source of truth) --------------------
// Applicants
UserSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true, name: "uniq_firebaseUid" });
UserSchema.index({ phone: 1 },       { unique: true, sparse: true, name: "uniq_phone" });
UserSchema.index({ admissionFormId: 1 }, { unique: true, sparse: true, name: "uniq_admissionFormId" });
UserSchema.index({ selectedDepartmentSlug: 1 }, { name: "idx_selectedDepartmentSlug" });

// Staff
UserSchema.index({ username: 1 }, { unique: true, sparse: true, name: "uniq_username" });
UserSchema.index({ email: 1 },    { unique: true, sparse: true, name: "uniq_email" });

// Optional compound example:
// UserSchema.index({ role: 1, username: 1 }, { unique: true, sparse: true, name: "uniq_role_username" });

// Dev-only: let Mongoose build indexes automatically
if (process.env.NODE_ENV !== "production") {
  UserSchema.set("autoIndex", true);
}

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = models.User || model("User", UserSchema);
