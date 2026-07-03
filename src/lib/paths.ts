export function productPath(productSlug: string) {
  return `/products/${productSlug}`;
}

export function learningPathPath(productSlug: string, pathSlug: string) {
  return `${productPath(productSlug)}/paths/${pathSlug}`;
}

export function coursePath(productSlug: string, courseSlug: string) {
  return `${productPath(productSlug)}/courses/${courseSlug}`;
}

export function lessonPath(
  productSlug: string,
  courseSlug: string,
  lessonId: string
) {
  return `${coursePath(productSlug, courseSlug)}/lessons/${lessonId}`;
}

export function quizPath(productSlug: string, courseSlug: string) {
  return `${coursePath(productSlug, courseSlug)}/quiz`;
}

export function startPath() {
  return "/start";
}

export function badgeVerificationPath(verificationSlug: string) {
  return `/badges/${verificationSlug}`;
}
