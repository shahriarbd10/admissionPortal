import { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true },
    phone: { type: String, required: true },       // E.164
    admissionFormId: { type: String, required: false },

    // Profile fields
    name: { type: String, required: false },
    fatherName: { type: String, required: false },
    motherName: { type: String, required: false },
    sscGPA: { type: Number, required: false, min: 0, max: 5 },
    hscGPA: { type: Number, required: false, min: 0, max: 5 },

    // Department selection
    selectedDepartmentSlug: { type: String, required: false },
    selectedDepartmentAt:   { type: Date, required: false },

    // audit
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    strict: true,
  }
);

// Indexes (single source of truth)
UserSchema.index({ firebaseUid: 1 }, { unique: true, name: "uniq_firebaseUid" });
UserSchema.index({ phone: 1 }, { unique: true, name: "uniq_phone" });
UserSchema.index({ admissionFormId: 1 }, { unique: true, sparse: true, name: "uniq_admissionFormId" });
UserSchema.index({ selectedDepartmentSlug: 1 }, { name: "idx_selectedDepartmentSlug" });

if (process.env.NODE_ENV !== "production") {
  UserSchema.set("autoIndex", true);
}

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = models.User || model("User", UserSchema);
