import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { ProductRowLink } from "@/components/product-row-link";
import { HomeCatalogError } from "@/components/home-catalog-error";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { getPublishedCourses } from "@/lib/courses";
import { getPublishedProducts } from "@/lib/products";
import {
  getLearnerCourseProgressList,
  getMostRecentInProgress,
} from "@/lib/learner-progress";
import { getCurrentUser } from "@/lib/session";

const HOW_IT_WORKS = [
  {
    title: "Open a course and read the lessons",
    body: "Pick any course and start reading. No wallet required.",
    href: "/courses" as const,
  },
  {
    title: "Connect a wallet to save progress",
    body: "When you want tracked lessons and quiz scores, connect your wallet once.",
  },
  {
    title: "Pass the quiz and earn a badge",
    body: "Complete the lessons, pass the final quiz, and find the badge in your profile.",
  },
] as const;

const stepTitleClassName =
  "font-medium leading-snug underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm";

export default async function HomePage() {
  const user = await getCurrentUser();
  let continueCourse: Awaited<
    ReturnType<typeof getMostRecentInProgress>
  > = null;

  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  let coursesLoadError = false;
  let productsLoadError = false;

  try {
    courses = await getPublishedCourses();
  } catch {
    coursesLoadError = true;
  }

  try {
    products = await getPublishedProducts();
  } catch {
    productsLoadError = true;
  }

  if (user) {
    try {
      const progress = await getLearnerCourseProgressList(user.id);
      continueCourse = getMostRecentInProgress(progress);
    } catch {
      // Home catalog still works if progress fails to load.
    }
  }

  const catalogFullyFailed = coursesLoadError && productsLoadError;
  const featured = courses.slice(0, 3);
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" className="mx-auto mb-6">
              Official Arcium learning platform
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Learn Arcium step by step
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              Short courses that explain Arcium in plain language. Read lessons,
              pass a quiz, and earn a badge in your profile.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Browse courses
                  <ArrowRight />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                You can read courses without a wallet.
              </span>
            </div>
          </div>
        </div>
      </section>

      {continueCourse && <ContinueLearningCard course={continueCourse} />}

      {/* How it works */}
      <section
        aria-labelledby="how-it-works-heading"
        className="border-b bg-muted/20"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <h2
            id="how-it-works-heading"
            className="text-lg font-semibold tracking-tight"
          >
            How it works
          </h2>
          <ol className="mt-8 grid list-none gap-8 pl-0 md:grid-cols-3 md:gap-6">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="flex gap-4 md:flex-col md:gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div>
                  {"href" in step ? (
                    <Link href={step.href} className={stepTitleClassName}>
                      {step.title}
                    </Link>
                  ) : (
                    <p className="font-medium leading-snug">{step.title}</p>
                  )}
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {catalogFullyFailed ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <HomeCatalogError />
        </section>
      ) : (
        <>
          {/* Featured courses — primary catalog */}
          <section
            aria-labelledby="featured-courses-heading"
            className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="featured-courses-heading"
                  className="text-2xl font-semibold tracking-tight"
                >
                  Featured courses
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  New here? These courses are a good place to start.
                </p>
              </div>
              {!coursesLoadError && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">
                    View all courses
                    <ArrowRight />
                  </Link>
                </Button>
              )}
            </div>

            {coursesLoadError ? (
              <HomeSectionLoadError
                title="Courses did not load"
                description="Featured courses are unavailable right now. Refresh the page, or try again in a few minutes."
              />
            ) : featured.length > 0 ? (
              <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
                {featured.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={{
                      slug: c.slug,
                      productSlug: c.product.slug,
                      productName: c.product.name,
                      title: c.title,
                      summary: c.summary,
                      level: c.level,
                      courseType: c.courseType,
                      thumbnailUrl: c.thumbnailUrl,
                      estimatedDuration: c.estimatedDuration,
                      lessonCount: c._count.lessons,
                      hasBadge: Boolean(c.badge),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
                <BookOpen
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 font-medium">No published courses yet</p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  The Arcademy team is preparing the first courses. Check back
                  soon.
                </p>
              </div>
            )}
          </section>

          {/* Projects — secondary browse path */}
          <section
            aria-labelledby="projects-heading"
            className="border-t bg-muted/10"
          >
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:pb-16">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id="projects-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    Browse by project
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Each project is an app or tool in Arcium with its own course
                    list.
                  </p>
                </div>
                {!productsLoadError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="self-start sm:self-auto"
                  >
                    <Link href="/products">
                      View all projects
                      <ArrowRight />
                    </Link>
                  </Button>
                )}
              </div>

              {productsLoadError ? (
                <HomeSectionLoadError
                  title="Projects did not load"
                  description="The project list is unavailable right now. Refresh the page, or browse courses above if they loaded."
                />
              ) : featuredProducts.length > 0 ? (
                <div className="overflow-hidden rounded-xl border bg-card divide-y">
                  {featuredProducts.map((product) => (
                    <ProductRowLink
                      key={product.id}
                      product={{
                        slug: product.slug,
                        name: product.name,
                        description: product.description,
                        logoUrl: product.logoUrl,
                        category: product.category,
                        courseCount: product._count.courses,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
                  <BookOpen
                    className="mx-auto size-8 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="mt-3 font-medium">No published projects yet</p>
                  <p className="mt-1 text-pretty text-sm text-muted-foreground">
                    Project pages appear here as Arcium apps and tools are added
                    to Arcademy.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
