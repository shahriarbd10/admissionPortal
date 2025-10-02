import { Schema, model, models, type InferSchemaType } from "mongoose";

const DepartmentSchema = new Schema(
  {
    slug: { type: String, required: true },      // e.g., "cse"
    name: { type: String, required: true },      // e.g., "Computer Science & Engineering"
    // Application window (UTC)
    windowStart: { type: Date, required: true },
    windowEnd:   { type: Date, required: true },

    // Optional caps/metadata
    capacity: { type: Number, required: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

// Indexes
DepartmentSchema.index({ slug: 1 }, { unique: true, name: "uniq_slug" });
DepartmentSchema.index({ isActive: 1, windowStart: 1, windowEnd: 1 });

export type DepartmentDoc = InferSchemaType<typeof DepartmentSchema>;
export const Department = models.Department || model("Department", DepartmentSchema);
