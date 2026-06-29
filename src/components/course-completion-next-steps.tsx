"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/level-badge";
import { coursePath, productPath } from "@/lib/paths";
import type { PostCompletionRecommendations } from "@/lib/courses";

type CourseCompletionNextStepsProps = {
  recommendations: PostCompletionRecommendations;
};

export function CourseCompletionNextSteps({
  recommendations,
}: CourseCompletionNextStepsProps) {
  const { courses, productLinks, productName, productSlug } = recommendations;

  if (
    courses.length === 0 &&
    productLinks.length === 0 &&
    !productSlug
  ) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div>
          <h3 className="text-lg font-semibold">What&apos;s next?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep learning or explore what you can do with {productName || "this project"}.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              More courses
            </p>
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={`${course.product.slug}/${course.slug}`}>
                  <Link
                    href={coursePath(course.product.slug, course.slug)}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{course.title}</p>
                        <LevelBadge level={course.level} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {course.summary}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course.product.name}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {productSlug && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={productPath(productSlug)}>
                Explore {productName}
                <ArrowRight />
              </Link>
            </Button>
            {productLinks.map((link) => (
              <Button key={link.url} variant="outline" size="sm" asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
