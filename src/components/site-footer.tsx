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
    <footer className="relative overflow-hidden border-t bg-muted/30 bg-ambient">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <span className="text-lg tracking-tight">Arcademy</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Official learning platform for Arcium. Browse courses for free;
              connect a wallet when you want progress saved.
            </p>
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
