import { z } from "zod";

export const QuestionItemUpload = z.object({
  i: z.number().int().min(0).max(49),
  id: z.string().min(1),
  type: z.enum(["MCQ", "TF", "FIB"]),
  q: z.string().min(1),
  options: z.array(z.string()).optional(),            // MCQ/TF
  answerKey: z.union([z.number().int(), z.string()]), // index for MCQ/TF, string for FIB
  hint: z.string().nullable().optional(),
  category: z.string().optional(),
  points: z.number().min(0).max(5).optional(),
});

export const QuestionPaperUpload = z.object({
  title: z.string().min(3),
  categories: z.array(z.string()).default([]),
  applicableDepartments: z.array(z.string().min(1)).min(1),
  items: z.array(QuestionItemUpload).length(50),
});
export type QuestionPaperUpload = z.infer<typeof QuestionPaperUpload>;
