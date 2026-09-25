import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url("Enter a complete URL")]);
const optionalEmail = z.union([z.literal(""), z.string().email("Enter a valid email")]);

export const onboardingSchema = z.object({
  schoolId: z.string().uuid().optional(),
  step: z.number().int().min(1).max(10),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  schoolType: z.enum(["private", "public", "faith_based", "international", "other"]),
  yearEstablished: z.union([z.literal(""), z.coerce.number().int().min(1800).max(2100)]),
  description: z.string().trim().max(4000),
  contactEmail: optionalEmail,
  contactPhone: z.string().trim().max(30),
  websiteUrl: optionalUrl,
  country: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80),
  city: z.string().trim().max(80),
  area: z.string().trim().max(120),
  addressLine: z.string().trim().max(300),
  latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]),
  longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]),
  levels: z.array(z.string()).max(5),
  structure: z.enum(["day", "boarding", "day_and_boarding"]),
  gender: z.enum(["mixed", "boys", "girls"]),
  curricula: z.array(z.string()).max(7),
  facilities: z.array(z.string()).max(15),
  feeAmount: z.union([z.literal(""), z.coerce.number().nonnegative().max(100000000)]),
  feeCategory: z.enum(["tuition", "registration", "books", "uniform", "transport", "boarding", "other"]),
  feeTerm: z.string().trim().max(40),
  academicYear: z.string().trim().refine((value) => value === "" || /^\d{4}\/\d{4}$/.test(value), "Use YYYY/YYYY"),
  admissionStatus: z.enum(["open", "closed", "opening_soon"]),
  admissionDescription: z.string().trim().max(3000),
  requirements: z.string().trim().max(4000),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const mediaUploadSchema = z.object({
  schoolId: z.string().uuid(), category: z.string().trim().min(2).max(80),
  caption: z.string().max(300), mediaType: z.enum(["image", "video"]),
  storagePath: z.string().min(10).max(500), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]),
  byteSize: z.number().int().positive().max(104857600),
});

export const documentUploadSchema = z.object({
  schoolId: z.string().uuid(), documentType: z.enum(["registration", "government_approval", "proof_of_address", "accreditation", "other"]),
  title: z.string().trim().min(2).max(160), storagePath: z.string().min(10).max(500),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]), byteSize: z.number().int().positive().max(20971520),
});
