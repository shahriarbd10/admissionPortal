import { z } from "zod";

export const phoneLoginSchema = z.object({
  afid: z.string().trim().min(3, "Enter your AFID"),
  phone: z.string().trim().regex(/^\+\d{10,15}$/, "Use E.164 (e.g., +8801XXXXXXXXX)"),
});

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
