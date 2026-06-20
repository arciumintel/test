"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Dashboard",
    href: "/admin",
    match: (pathname: string) =>
      pathname === "/admin" ||
      (pathname.startsWith("/admin/courses") &&
        !pathname.startsWith("/admin/products")),
  },
  {
    label: "Projects",
    href: "/admin/products",
    match: (pathname: string) => pathname.startsWith("/admin/products"),
  },
  {
    label: "Partner intake",
    href: "/admin/partner-intake",
    match: (pathname: string) => pathname.startsWith("/admin/partner-intake"),
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-1">
        {sections.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  active
                    ? "border-b-2 border-primary text-foreground"
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
