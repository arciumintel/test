"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { trackClientEvent } from "@/app/actions/tracking";
import {
  getBrowserReferrer,
  getTrackingAnonymousId,
  getTrackingSessionId,
  getUtmParams,
} from "@/lib/tracking-client";

type Props = {
  href: string;
  label: string;
  ecosystemProjectId: string;
  ecosystemProjectSlug: string;
  path: string;
  className?: string;
  children: React.ReactNode;
};

export function ReferralLink({
  href,
  label,
  ecosystemProjectId,
  ecosystemProjectSlug,
  path,
  className,
  children,
}: Props) {
  function handleClick() {
    void trackClientEvent({
      eventName: "ecosystem_project_referral_clicked",
      path,
      sessionId: getTrackingSessionId(),
      anonymousId: getTrackingAnonymousId(),
      referrer: getBrowserReferrer(),
      ...getUtmParams(),
      ecosystemProjectId,
      ecosystemProjectSlug,
      metadata: {
        linkLabel: label,
        destinationUrl: href,
        placement: "ecosystem_project_page",
      },
    });
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
      <ExternalLink />
    </Link>
  );
}
