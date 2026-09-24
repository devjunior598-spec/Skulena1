import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address").max(254);
export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72, "Use no more than 72 characters");

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });
export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: emailSchema,
  password: passwordSchema,
  accountType: z.enum(["parent", "school_owner"]),
});
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(({ password, confirmPassword }) => password === confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
