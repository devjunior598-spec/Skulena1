import { z } from "zod";

export const childSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the child's first name").max(80),
  lastName: z.string().trim().max(80),
  dateOfBirth: z.union([z.literal(""), z.iso.date()]),
  currentLevel: z.string().trim().max(80),
  targetLevel: z.string().trim().max(80),
  notes: z.string().trim().max(1000),
});

export type ChildValues = z.infer<typeof childSchema>;
