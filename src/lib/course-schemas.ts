import { z } from "zod";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import { slugify } from "@/lib/slugify";

export { slugify };

export const courseSchema = z.object({
  title: z.string().min(2, "Title is required").max(L.courseTitle),
  productId: z.string().min(1, "Product is required"),
  summary: z.string().min(2, "Summary is required").max(L.courseSummary),
  description: z.string().max(L.courseDescription).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  courseType: z.enum(["foundational", "product_onboarding", "builder_intro"]),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  learningOutcomes: z.array(z.string().max(L.learningOutcome)).max(20).optional(),
  prerequisiteCourseIds: z.array(z.string()).max(10).optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(2, "Title is required").max(L.lessonTitle),
  content: z.string().min(1, "Lesson content is required").max(L.lessonContent),
  mediaUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  required: z.boolean(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  moduleId: z.string().optional().nullable(),
});

export const questionSchema = z.object({
  prompt: z.string().min(2, "Prompt is required").max(L.questionPrompt),
  answerOptions: z
    .array(z.string().min(1).max(L.questionOption))
    .min(2, "Add at least two options")
    .max(6),
  correctAnswer: z.coerce.number().int().min(0),
  explanation: z.string().max(L.questionExplanation).optional().nullable(),
});

export const badgeSchema = z.object({
  name: z
    .string()
    .min(2, "Badge name is required")
    .max(L.badgeName, `Badge name must be ${L.badgeName} characters or fewer`),
  description: z.string().min(2, "Description is required").max(L.badgeDescription),
  imageUrl: z.string().optional().nullable(),
  criteria: z.string().max(L.badgeCriteria).optional().nullable(),
  issuer: z.string().max(L.badgeIssuer).optional().nullable(),
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
