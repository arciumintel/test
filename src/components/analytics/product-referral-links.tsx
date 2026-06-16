"use client";

import { Button } from "@/components/ui/button";
import { ReferralLink } from "@/components/analytics/referral-link";

type LinkItem = { label: string; url: string };

export function ProductReferralLinks({
  links,
  ecosystemProjectId,
  ecosystemProjectSlug,
  path,
}: {
  links: LinkItem[];
  ecosystemProjectId: string;
  ecosystemProjectSlug: string;
  path: string;
}) {
  if (links.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {links.map((link) => (
        <Button key={link.url} variant="outline" size="sm" asChild>
          <ReferralLink
            href={link.url}
            label={link.label}
            ecosystemProjectId={ecosystemProjectId}
            ecosystemProjectSlug={ecosystemProjectSlug}
            path={path}
            className="inline-flex items-center gap-2"
          >
            {link.label}
          </ReferralLink>
        </Button>
      ))}
    </div>
  );
}
