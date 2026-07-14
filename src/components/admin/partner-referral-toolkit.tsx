"use client";

import { Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/copy-link-button";
import { absoluteUrl } from "@/lib/site";
import { coursePath, productPath } from "@/lib/paths";

type CourseLink = {
  title: string;
  slug: string;
};

type Props = {
  productName: string;
  productSlug: string;
  partnerName: string | null;
  courses: CourseLink[];
};

export function PartnerReferralToolkit({
  productName,
  productSlug,
  partnerName,
  courses,
}: Props) {
  const projectUrl = absoluteUrl(productPath(productSlug));
  const suggestedCopy = `Learn ${productName} on Arcademy, a curated learning destination for the Arcium ecosystem. Start here: ${projectUrl}`;
  const partnerLine = partnerName
    ? `Arcademy learning for ${productName}, maintained in partnership with ${partnerName}.`
    : `Arcademy learning for ${productName}.`;

  return (
    <Card>
      <CardContent className="space-y-5 py-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-primary" />
          Referral toolkit
        </div>
        <p className="text-sm text-muted-foreground">
          Stable URLs and copy for partners to link from docs, onboarding, or
          campaigns.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Project page
          </p>
          <p className="break-all rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">
            {projectUrl}
          </p>
          <CopyLinkButton text={projectUrl} label="Copy URL" />
        </div>

        {courses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Published course links
            </p>
            {courses.map((course) => {
              const url = absoluteUrl(coursePath(productSlug, course.slug));
              return (
                <div key={course.slug} className="rounded-md border bg-muted/20 p-3">
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {url}
                  </p>
                  <div className="mt-2">
                    <CopyLinkButton text={url} label="Copy course URL" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Suggested referral copy
          </p>
          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {suggestedCopy}
          </p>
          <CopyLinkButton text={suggestedCopy} label="Copy suggested copy" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Short positioning line
          </p>
          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {partnerLine}
          </p>
          <CopyLinkButton text={partnerLine} label="Copy positioning line" />
        </div>
      </CardContent>
    </Card>
  );
}
