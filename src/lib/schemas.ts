import { z } from "zod";

// ---- Login ----
export const phoneLoginSchema = z.object({
  afid: z.string().trim().min(3, "Enter your AFID"),
  phone: z
    .string()
    .trim()
    .regex(/^\+\d{10,15}$/, "Use E.164 format (e.g., +8801XXXXXXXXX)"),
});

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;

// ---- Profile ----
export const profileUpdateSchema = z.object({
  admissionFormId: z.string().trim().min(3).max(64).optional(),
  name: z.string().trim().min(2, "Enter your full name").max(120),
  fatherName: z.string().trim().min(2).max(120),
  motherName: z.string().trim().min(2).max(120),
  sscGPA: z.coerce.number().min(0).max(5),
  hscGPA: z.coerce.number().min(0).max(5),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ---- Departments (student side) ----
export const departmentsQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional(), // ?activeOnly=true
});

export const departmentSelectSchema = z.object({
  slug: z.string().trim().min(1), // department slug
});

export type DepartmentSelectInput = z.infer<typeof departmentSelectSchema>;

// ---- Departments (admin/dev side) ----
export const departmentUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/i, "Use letters, numbers, or dashes"),
  name: z.string().trim().min(3).max(150),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
  capacity: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const departmentUpdateSchema = departmentUpsertSchema.partial().extend({
  // when updating, slug comes from the URL not the body
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/i)
    .optional(),
});
