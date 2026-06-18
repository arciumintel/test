import { z } from "zod";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

export const courseSchema = z.object({
  title: z.string().min(2, "Title is required").max(140),
  productId: z.string().min(1, "Product is required"),
  summary: z.string().min(2, "Summary is required").max(400),
  description: z.string().max(8000).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  courseType: z.enum(["foundational", "product_onboarding", "builder_intro"]),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  learningOutcomes: z.array(z.string().max(280)).max(20).optional(),
  prerequisiteCourseIds: z.array(z.string()).max(10).optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  content: z.string().min(1, "Lesson content is required").max(40000),
  mediaUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  required: z.boolean(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
});

export const questionSchema = z.object({
  prompt: z.string().min(2, "Prompt is required").max(600),
  answerOptions: z
    .array(z.string().min(1).max(300))
    .min(2, "Add at least two options")
    .max(6),
  correctAnswer: z.coerce.number().int().min(0),
  explanation: z.string().max(800).optional().nullable(),
});

export const badgeSchema = z.object({
  name: z.string().min(2, "Badge name is required").max(120),
  description: z.string().min(2, "Description is required").max(400),
  imageUrl: z.string().optional().nullable(),
  criteria: z.string().max(600).optional().nullable(),
  issuer: z.string().max(120).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

export const PARTNER_EDITABLE_STATUSES = [
  "partner_draft",
  "staff_changes_requested",
] as const;

export const PARTNER_WORKFLOW_STATUSES = [
  "partner_draft",
  "submitted_for_review",
  "staff_changes_requested",
  "approved",
  "published",
] as const;
