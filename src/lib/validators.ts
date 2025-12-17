import { z } from "zod";

// Job validation schemas
export const JobCreateSchema = z.object({
  company: z.string().min(1, "Company is required").max(160),
  role: z.string().min(1, "Role is required").max(160),
  location: z.string().max(160).optional(),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum([
    "SAVED",
    "APPLIED",
    "RECRUITER_SCREEN",
    "TECHNICAL",
    "ONSITE",
    "OFFER",
    "REJECTED",
    "GHOSTED",
  ]),
  appliedDate: z.string().optional(), // ISO date string
  salary: z.string().max(100).optional(),
  notes: z.string().optional(),
  resumeVersionId: z.string().uuid().optional(),
});

export const JobUpdateSchema = JobCreateSchema.extend({
  id: z.string().uuid(),
});

// Resume version validation schemas
export const ResumeVersionCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Invalid URL"),
});

export const ResumeVersionUpdateSchema = ResumeVersionCreateSchema.extend({
  id: z.string().uuid(),
});

export type JobCreate = z.infer<typeof JobCreateSchema>;
export type JobUpdate = z.infer<typeof JobUpdateSchema>;
export type ResumeVersionCreate = z.infer<typeof ResumeVersionCreateSchema>;
export type ResumeVersionUpdate = z.infer<typeof ResumeVersionUpdateSchema>;

// User validation schemas (admin only)
export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  isAdmin: z.boolean().optional(),
});

export const UserUpdateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Invalid email address"),
  isAdmin: z.boolean(),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
