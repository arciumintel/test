"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = (productId: string) =>
  [
    {
      label: "Overview",
      href: `/partner-console/${productId}/analytics`,
      match: (pathname: string) =>
        pathname === `/partner-console/${productId}/analytics`,
    },
    {
      label: "Courses",
      href: `/partner-console/${productId}/analytics/courses`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/courses`
        ),
    },
    {
      label: "Concepts",
      href: `/partner-console/${productId}/analytics/concepts`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/concepts`
        ),
    },
    {
      label: "Assessments",
      href: `/partner-console/${productId}/analytics/assessments`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/assessments`
        ),
    },
    {
      label: "Readiness",
      href: `/partner-console/${productId}/analytics/readiness`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/readiness`
        ),
    },
    {
      label: "Certifications",
      href: `/partner-console/${productId}/analytics/certifications`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/certifications`
        ),
    },
    {
      label: "Recommendations",
      href: `/partner-console/${productId}/analytics/recommendations`,
      match: (pathname: string) =>
        pathname ===
        `/partner-console/${productId}/analytics/recommendations`,
    },
  ] as const;

export function AnalyticsSubnav({ productId }: { productId: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Analytics sections"
      className="mt-4 flex flex-wrap gap-1 border-b border-border"
    >
      {items(productId).map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
