/** Maps draft/published content status to learner-facing visibility language. */

export function isVisibleToLearners(status: string): boolean {
  return status === "published";
}

export function visibilityToStatus(visible: boolean): "draft" | "published" {
  return visible ? "published" : "draft";
}

export function formatLearnerVisibility(status: string): string {
  if (status === "published") return "Visible to learners";
  if (status === "archived") return "Archived";
  return "Hidden";
}

export function formatPathVisibility(status: string): string {
  return status === "published" ? "Visible on product page" : "Hidden";
}
