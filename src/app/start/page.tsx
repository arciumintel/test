import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundationStartHero } from "@/components/foundation-start-hero";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { LearningPathTimeline } from "@/components/learning-path-timeline";
import { PageHeader } from "@/components/page-header";
import { buildProductProgressMap, getLearnerCourseProgressList } from "@/lib/learner-progress";
import { getPublishedLearningPaths } from "@/lib/learning-paths";
import {
  getArciumOnboardingEntry,
  getFoundationProducts,
} from "@/lib/products";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Start with Arcium",
  description:
    "Begin your Arcium learning journey with foundations courses and guided paths on Arcademy.",
};

export default async function StartPage() {
  let foundationProducts: Awaited<ReturnType<typeof getFoundationProducts>> = [];
  let onboardingEntry: Awaited<ReturnType<typeof getArciumOnboardingEntry>> =
    null;
  let learningPaths: Awaited<ReturnType<typeof getPublishedLearningPaths>> =
    [];
  let progressBySlug: ReturnType<typeof buildProductProgressMap> = {};
  let loadError = false;

  try {
    const user = await getCurrentUser();
    const [foundations, entry, courseProgress] = await Promise.all([
      getFoundationProducts(),
      getArciumOnboardingEntry(),
      user ? getLearnerCourseProgressList(user.id) : Promise.resolve([]),
    ]);

    foundationProducts = foundations;
    onboardingEntry = entry;
    progressBySlug = buildProductProgressMap(courseProgress);

    const primary = foundations[0];
    if (primary) {
      learningPaths = await getPublishedLearningPaths(primary.slug);
    }
  } catch {
    loadError = true;
  }

  const foundation = foundationProducts[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <PageHeader
        headingId="start-heading"
        title="Start with Arcium"
        description="Learn what Arcium is, why private computation matters, and how to take your next step in the ecosystem."
      />

      {loadError ? (
        <HomeSectionLoadError
          title="Could not load start page"
          description="Refresh the page, or browse foundational courses while we try again."
        />
      ) : foundation && onboardingEntry ? (
        <div className="space-y-10">
          <FoundationStartHero
            product={foundation}
            onboardingHref={onboardingEntry.href}
            progress={progressBySlug[foundation.slug] ?? null}
          />

          {learningPaths.length > 0 ? (
            <section aria-labelledby="learning-paths-heading">
              <h2
                id="learning-paths-heading"
                className="mb-6 text-lg font-semibold tracking-tight"
              >
                Recommended path
              </h2>
              <LearningPathTimeline
                paths={learningPaths}
                productSlug={foundation.slug}
              />
            </section>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <p className="font-medium">Foundational content is coming soon</p>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            Browse foundational courses while the Arcium start path is being
            prepared.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/courses?type=foundational">
              Browse foundational courses
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
