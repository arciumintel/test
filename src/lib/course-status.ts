import type { CourseStatus } from "@prisma/client";

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  partner_draft: "Partner draft",
  submitted_for_review: "Submitted for review",
  staff_changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export function formatCourseStatus(status: CourseStatus): string {
  return COURSE_STATUS_LABELS[status] ?? status;
}
