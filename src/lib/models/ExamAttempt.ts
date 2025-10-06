import { Schema, model, models, type InferSchemaType } from "mongoose";

const PaperItemSchema = new Schema(
  {
    i: { type: Number, required: true }, // 0..49
    id: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "TF", "FIB"], required: true },
    q: { type: String, required: true },
    options: { type: [String], required: false },     // MCQ/TF
    correctIndex: { type: Number, required: false },  // MCQ/TF
    correctText: { type: String, required: false },   // FIB
    hint: { type: String, required: false },          // optional hint for FIB
  },
  { _id: false, strict: true }
);

const ResultItemSchema = new Schema(
  {
    i: { type: Number, required: true },
    id: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "TF", "FIB"], required: true },
    answer: { type: Schema.Types.Mixed, required: false },        // number | string | null
    correctAnswer: { type: Schema.Types.Mixed, required: false }, // number | string
    correct: { type: Boolean, required: true },
  },
  { _id: false, strict: true }
);

const ExamAttemptSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    status: {
      type: String,
      enum: ["active", "submitted"],
      default: "active",
      index: true,
    },

    // Stored full paper (includes correct answers, NOT exposed to student API)
    paper: { type: [PaperItemSchema], required: true },

    // Answers before submission: responses["0"] = 2 or "text"
    responses: { type: Map, of: Schema.Types.Mixed, default: {} },

    // After submission: per-question correctness with correct answers
    results: { type: [ResultItemSchema], default: [] },

    // points for each correct answer (per-department)
    pointsPerCorrect: { type: Number, default: 1 },

    // Computed
    examScore: { type: Number, default: 0 },
    gpaWeighted: { type: Number, default: 0 },

    submittedAt: { type: Date },

    // applicant snapshot
    applicantName: { type: String },
    applicantAfid: { type: String },
    applicantPhone: { type: String },
  },
  { timestamps: true, strict: true }
);

ExamAttemptSchema.index({ firebaseUid: 1, status: 1 }, { name: "by_student_status" });

if (process.env.NODE_ENV !== "production") {
  ExamAttemptSchema.set("autoIndex", true);
}

export type ExamAttemptDoc = InferSchemaType<typeof ExamAttemptSchema>;
export const ExamAttempt =
  models.ExamAttempt || model("ExamAttempt", ExamAttemptSchema);
