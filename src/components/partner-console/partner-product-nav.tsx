"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PartnerProductNavProps = {
  productId: string;
};

const sections = (productId: string) =>
  [
    {
      label: "Course drafts",
      href: `/partner-console/${productId}/courses`,
      match: (pathname: string) =>
        pathname.startsWith(`/partner-console/${productId}/courses`),
    },
    {
      label: "Self-service",
      href: `/partner-console/${productId}/self-service`,
      match: (pathname: string) =>
        pathname === `/partner-console/${productId}/self-service`,
    },
    {
      label: "Discord",
      href: `/partner-console/${productId}/discord`,
      match: (pathname: string) =>
        pathname === `/partner-console/${productId}/discord`,
    },
    {
      label: "Analytics",
      href: `/partner-console/${productId}/analytics`,
      match: (pathname: string) =>
        pathname.startsWith(`/partner-console/${productId}/analytics`),
    },
    {
      label: "Settings",
      href: `/partner-console/${productId}/project`,
      match: (pathname: string) =>
        pathname === `/partner-console/${productId}/project`,
    },
  ] as const;

export function PartnerProductNav({ productId }: PartnerProductNavProps) {
  const pathname = usePathname();
  const items = sections(productId);

  return (
    <nav
      aria-label="Project sections"
      className="mt-6 border-b border-border"
    >
      <ul className="-mb-px flex flex-wrap gap-1">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  active
                    ? "border-b-2 border-[color:var(--featured)] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
