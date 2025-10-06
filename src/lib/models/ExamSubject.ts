import { Schema, model, models, type InferSchemaType } from "mongoose";

const ExamSubjectSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, strict: true }
);

ExamSubjectSchema.index({ slug: 1 }, { unique: true });

export type ExamSubjectDoc = InferSchemaType<typeof ExamSubjectSchema>;
export const ExamSubject =
  models.ExamSubject || model("ExamSubject", ExamSubjectSchema);
