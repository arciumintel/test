import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  getFooterLearnLinks,
  getFooterPartnerLinks,
  getSiteNavContext,
} from "@/lib/site-nav";

function FooterLinkSection({
  title,
  ariaLabel,
  links,
}: {
  title: string;
  ariaLabel: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={ariaLabel}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function SiteFooter() {
  const navContext = await getSiteNavContext();
  const learnLinks = getFooterLearnLinks();
  const partnerLinks = getFooterPartnerLinks(navContext);

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4 text-primary" />
            <span>Official learning platform for Arcium</span>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12">
            <FooterLinkSection
              title="Learn"
              ariaLabel="Learning links"
              links={learnLinks}
            />
            <FooterLinkSection
              title="Partners"
              ariaLabel="Partner and staff links"
              links={partnerLinks}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
