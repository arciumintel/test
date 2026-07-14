"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_TAB_ICONS,
  type AnalyticsTabId,
} from "@/components/partner-console/analytics/analytics-icons";
import { cn } from "@/lib/utils";

const items = (productId: string) =>
  [
    {
      id: "overview" as const,
      label: "Overview",
      href: `/partner-console/${productId}/analytics`,
      match: (pathname: string) =>
        pathname === `/partner-console/${productId}/analytics`,
    },
    {
      id: "courses" as const,
      label: "Courses",
      href: `/partner-console/${productId}/analytics/courses`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/courses`
        ),
    },
    {
      id: "concepts" as const,
      label: "Concepts",
      href: `/partner-console/${productId}/analytics/concepts`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/concepts`
        ),
    },
    {
      id: "assessments" as const,
      label: "Assessments",
      href: `/partner-console/${productId}/analytics/assessments`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/assessments`
        ),
    },
    {
      id: "readiness" as const,
      label: "Readiness",
      href: `/partner-console/${productId}/analytics/readiness`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/readiness`
        ),
    },
    {
      id: "certifications" as const,
      label: "Certifications",
      href: `/partner-console/${productId}/analytics/certifications`,
      match: (pathname: string) =>
        pathname.startsWith(
          `/partner-console/${productId}/analytics/certifications`
        ),
    },
    {
      id: "recommendations" as const,
      label: "Recommendations",
      href: `/partner-console/${productId}/analytics/recommendations`,
      match: (pathname: string) =>
        pathname ===
        `/partner-console/${productId}/analytics/recommendations`,
    },
  ] satisfies Array<{
    id: AnalyticsTabId;
    label: string;
    href: string;
    match: (pathname: string) => boolean;
  }>;

export function AnalyticsSubnav({ productId }: { productId: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Analytics sections"
      className="mt-4 flex flex-wrap gap-1 border-b border-border"
    >
      {items(productId).map((item) => {
        const active = item.match(pathname);
        const Icon = ANALYTICS_TAB_ICONS[item.id];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-primary" : "opacity-70"
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
