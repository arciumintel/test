import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { QuizRunner } from "@/components/quiz-runner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCourseBySlugs, getFinalQuiz } from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { coursePath, productPath } from "@/lib/paths";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ productSlug: string; courseSlug: string }>;
}) {
  const { productSlug, courseSlug } = await params;
  const courseHref = coursePath(productSlug, courseSlug);

  const user = await getCurrentUser();
  if (!user) redirect(courseHref);

  const course = await getCourseBySlugs(productSlug, courseSlug);
  if (!course) notFound();

  const finalQuizMeta = getFinalQuiz(course.quizzes);
  if (!finalQuizMeta) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: finalQuizMeta.id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, answerOptions: true },
      },
    },
  });
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Products", href: "/products" },
          { label: course.product.name, href: productPath(course.product.slug) },
          { label: course.title, href: courseHref },
          { label: "Final quiz" },
        ]}
      />
      <Link
        href={courseHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {course.title}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pass at {quiz.passThreshold}% to complete the course.
          </p>
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <Alert variant="info">
          <HelpCircle />
          <AlertTitle>Quiz coming soon</AlertTitle>
          <AlertDescription>
            This quiz doesn&apos;t have any questions yet. Check back later.
          </AlertDescription>
        </Alert>
      ) : (
        <QuizRunner
          quizId={quiz.id}
          passThreshold={quiz.passThreshold}
          questions={quiz.questions}
          productSlug={productSlug}
          courseSlug={courseSlug}
        />
      )}
    </div>
  );
}
