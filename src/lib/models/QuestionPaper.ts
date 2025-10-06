// src/lib/models/QuestionPaper.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

const PaperItemSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "TF", "FIB"], required: true },
    q: { type: String, required: true },
    options: { type: [String], required: false },       // MCQ/TF
    correctIndex: { type: Number, required: false },     // MCQ/TF
    correctText: { type: String, required: false },      // FIB
    hint: { type: String, required: false },
    sl: { type: Number, required: false },               // uploader SL (for reference)
  },
  { _id: false, strict: true }
);

const DepartmentRefSchema = new Schema(
  {
    slug: { type: String, required: true, lowercase: true, trim: true },
    // (optional) pointsPerCorrect could be kept if you re-enable per-dept marks
    pointsPerCorrect: { type: Number, required: false },
  },
  { _id: false, strict: true }
);

const FileMetaSchema = new Schema(
  {
    originalName: { type: String },
    mime: { type: String },
    size: { type: Number },
    path: { type: String }, // local backup path
  },
  { _id: false, strict: true }
);

const QuestionPaperSchema = new Schema(
  {
    title: { type: String, required: true },

    ownerName: { type: String, required: true },
    ownerInitial: { type: String, required: true },

    // 🔁 CHANGED: store subjects as slugs (and labels) instead of ObjectIds
    subjects: { type: [String], default: [] },          // e.g., ["physics","gk","ict"]
    subjectLabels: { type: [String], default: [] },      // e.g., ["Physics","General Knowledge","ICT"]

    // Departments the paper is applicable for
    departments: { type: [DepartmentRefSchema], default: [] },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    items: { type: [PaperItemSchema], default: [] },
    itemCount: { type: Number, default: 0 },

    // who uploaded
    createdBy: { type: String }, // staff id
    publishedAt: { type: Date },

    // local backup files
    file: { type: FileMetaSchema, default: undefined },
    parsedFilePath: { type: String },
  },
  { timestamps: true, strict: true }
);

// Helpful indexes
QuestionPaperSchema.index({ status: 1, "departments.slug": 1 }, { name: "by_status_dept" });
QuestionPaperSchema.index({ status: 1, createdAt: -1 }, { name: "by_status_created" });
// query by subjects quickly
QuestionPaperSchema.index({ subjects: 1 }, { name: "by_subjects" });

export type QuestionPaperDoc = InferSchemaType<typeof QuestionPaperSchema>;
export const QuestionPaper =
  models.QuestionPaper || model("QuestionPaper", QuestionPaperSchema);
