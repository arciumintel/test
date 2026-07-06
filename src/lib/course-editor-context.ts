/** Who is editing — staff or partner for a specific ecosystem project. */
export type CourseEditorContext =
  | { role: "staff" }
  | { role: "partner"; productId: string };

export function courseEditorContext(
  variant: "admin" | "partner",
  partnerProductId?: string
): CourseEditorContext {
  if (variant === "partner" && partnerProductId) {
    return { role: "partner", productId: partnerProductId };
  }
  return { role: "staff" };
}
