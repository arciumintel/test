"use client";

import * as React from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function PartnerReferralToolkit({
  productName,
  productSlug,
  partnerName,
  courses,
}: Props) {
  const projectUrl = absoluteUrl(productPath(productSlug));
  const suggestedCopy = `Learn ${productName} on Arcademy, the official learning destination for the Arcium ecosystem. Start here: ${projectUrl}`;
  const partnerLine = partnerName
    ? `Official Arcademy learning for ${productName}, maintained in partnership with ${partnerName}.`
    : `Official Arcademy learning for ${productName}.`;

  return (
    <Card>
      <CardContent className="space-y-5 py-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-primary" />
          Referral toolkit
        </div>
        <p className="text-sm text-muted-foreground">
          Stable URLs and copy for partners to link from docs, onboarding, or
          campaigns. Share manually. There is no partner dashboard in V1.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Project page
          </p>
          <p className="break-all rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">
            {projectUrl}
          </p>
          <CopyButton text={projectUrl} label="Copy URL" />
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
                    <CopyButton text={url} label="Copy course URL" />
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
          <CopyButton text={suggestedCopy} label="Copy suggested copy" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Short positioning line
          </p>
          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {partnerLine}
          </p>
          <CopyButton text={partnerLine} label="Copy positioning line" />
        </div>
      </CardContent>
    </Card>
  );
}
