import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/course-card";
import { ProductRowLink } from "@/components/product-row-link";
import { HomeCatalogError } from "@/components/home-catalog-error";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { HomeHeroCoursePreview } from "@/components/home-hero-course-preview";
import { getPublishedCourses } from "@/lib/courses";
import { getPublishedProducts } from "@/lib/products";
import {
  getLearnerCourseProgressList,
  getMostRecentInProgress,
} from "@/lib/learner-progress";
import { getCurrentUser } from "@/lib/session";

const HOW_IT_WORKS = [
  {
    title: "Start with Arcium foundations",
    body: "Learn what Arcium is and why it matters — no wallet required.",
    href: "/start" as const,
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
  "font-medium leading-snug underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm";

const sectionHeadingClassName = "text-2xl font-semibold tracking-tight";
const sectionLeadClassName =
  "mt-2 text-pretty text-sm leading-relaxed text-muted-foreground";

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
    products = await getPublishedProducts({ role: "ecosystem" });
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

  const foundationalCourses = courses.filter(
    (c) =>
      c.courseType === "foundational" && c.product.role === "foundation"
  );
  const otherCourses = courses.filter(
    (c) =>
      !(
        c.courseType === "foundational" && c.product.role === "foundation"
      )
  );
  const featured = [...foundationalCourses, ...otherCourses].slice(0, 3);
  const heroCourse = foundationalCourses[0] ?? featured[0] ?? null;
  const ecosystemProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-ambient">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
            <div className="max-w-xl">
              <Badge variant="official" className="mb-5">
                Official Arcium learning platform
              </Badge>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
                Learn Arcium step by step
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                Short courses that explain Arcium in plain language. Read
                lessons, pass a quiz, and earn a badge in your profile.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" asChild>
                  <Link href="/start">
                    Start with Arcium
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/products">Browse ecosystem projects</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                You can read courses without a wallet.
              </p>
            </div>

            {!coursesLoadError && heroCourse ? (
              <HomeHeroCoursePreview
                course={{
                  slug: heroCourse.slug,
                  productSlug: heroCourse.product.slug,
                  productName: heroCourse.product.name,
                  title: heroCourse.title,
                  summary: heroCourse.summary,
                  level: heroCourse.level,
                  courseType: heroCourse.courseType,
                  thumbnailUrl: heroCourse.thumbnailUrl,
                  estimatedDuration: heroCourse.estimatedDuration,
                  lessonCount: heroCourse._count.lessons,
                  hasBadge: Boolean(heroCourse.badge),
                }}
              />
            ) : null}
          </div>
        </div>
      </section>

      {continueCourse && <ContinueLearningCard course={continueCourse} />}

      {/* How it works */}
      <section aria-labelledby="how-it-works-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="how-it-works-heading" className={sectionHeadingClassName}>
          How it works
        </h2>
        <p className={sectionLeadClassName}>
          Three steps from your first lesson to a badge in your profile.
        </p>
        <ol className="how-it-works-steps mt-10 grid list-none gap-8 pl-0 md:grid-cols-3 md:gap-6">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 md:flex-col md:gap-3">
              <span
                aria-hidden
                className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-sm font-semibold text-foreground"
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
      </section>

      {catalogFullyFailed ? (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <HomeCatalogError />
        </section>
      ) : (
        <>
          {/* Featured courses — primary catalog */}
          <section
            aria-labelledby="featured-courses-heading"
            className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="featured-courses-heading"
                  className={sectionHeadingClassName}
                >
                  Featured courses
                </h2>
                <p className={sectionLeadClassName}>
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
              <EmptyState
                icon={BookOpen}
                title="No published courses yet"
                description="The Arcademy team is preparing the first courses. Check back soon."
                ambient
              />
            )}
          </section>

          {/* Projects — secondary browse path */}
          <section
            aria-labelledby="projects-heading"
            className="border-t border-border-subtle"
          >
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="projects-heading" className={sectionHeadingClassName}>
                    Ecosystem projects
                  </h2>
                  <p className={sectionLeadClassName}>
                    Apps and tools built on Arcium, each with its own course
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
                      View all ecosystem projects
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
              ) : ecosystemProducts.length > 0 ? (
                <div className="catalog-row divide-y">
                  {ecosystemProducts.map((product) => (
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
                <EmptyState
                  icon={BookOpen}
                  title="No published projects yet"
                  description="Project pages appear here as Arcium apps and tools are added to Arcademy."
                  ambient
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
