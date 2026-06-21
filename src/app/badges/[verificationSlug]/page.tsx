import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle2, ExternalLink } from "lucide-react";
import { BadgeMedallion } from "@/components/badge-medallion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrackView } from "@/components/analytics/track-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBadgeAwardByVerificationSlug } from "@/lib/badges";
import { badgeVerificationPath, coursePath, productPath } from "@/lib/paths";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ verificationSlug: string }>;
}): Promise<Metadata> {
  const { verificationSlug } = await params;
  const award = await getBadgeAwardByVerificationSlug(verificationSlug);
  if (!award) return { title: "Badge verification" };
  return {
    title: `${award.badge.name} — Verified`,
    description: `Verification for ${award.badge.name}, awarded for completing ${award.course.title}.`,
  };
}

export default async function BadgeVerificationPage({
  params,
}: {
  params: Promise<{ verificationSlug: string }>;
}) {
  const { verificationSlug } = await params;
  const award = await getBadgeAwardByVerificationSlug(verificationSlug);
  if (!award) notFound();

  const { badge, course } = award;
  const wallet = award.walletAddress;
  const criteria = badge.criteria ?? badge.description;
  const issuer = badge.issuer ?? "Arcademy";
  const coursePublished = course.status === "published";
  const projectPublished = course.product.status === "published";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <TrackView
        eventName="badge_verification_viewed"
        path={badgeVerificationPath(verificationSlug)}
        badgeAwardId={award.id}
        badgeId={award.badgeId}
        courseId={award.courseId}
        verificationSlug={verificationSlug}
        ecosystemProjectId={course.product.id}
        ecosystemProjectSlug={course.product.slug}
        metadata={{
          verificationStatus:
            coursePublished && projectPublished ? "verified" : "unverified",
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Badge verification", href: badgeVerificationPath(verificationSlug) },
        ]}
      />

      <Card className="mt-6 overflow-hidden border-2 border-success/20 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <BadgeMedallion
              name={badge.name}
              imageUrl={badge.imageUrl}
              size="md"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Badge variant="success" className="mb-3">
                <CheckCircle2 />
                Verified
              </Badge>
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {badge.name}
              </h1>
              <p className="mt-2 break-words text-pretty text-muted-foreground">
                {badge.description}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Verification status">
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <CheckCircle2 className="size-4" />
                Verified off-chain credential
              </span>
            </Detail>
            <Detail label="Awarded on">{formatDate(award.awardedAt)}</Detail>
            <Detail label="Issuer">{issuer}</Detail>
            <Detail label="Course">
              {coursePublished && projectPublished ? (
                <Link
                  href={coursePath(course.product.slug, course.slug)}
                  className="font-medium text-primary hover:underline"
                >
                  {course.title}
                </Link>
              ) : (
                <span className="font-medium">{course.title}</span>
              )}
            </Detail>
            <Detail label="Ecosystem Project">
              {projectPublished ? (
                <Link
                  href={productPath(course.product.slug)}
                  className="font-medium text-primary hover:underline"
                >
                  {course.product.name}
                </Link>
              ) : (
                <span className="font-medium">{course.product.name}</span>
              )}
            </Detail>
            <Detail label="Wallet address">
              {wallet ? (
                <span className="break-all font-mono text-xs">{wallet}</span>
              ) : (
                <span className="text-muted-foreground">Not recorded</span>
              )}
            </Detail>
          </dl>

          {criteria && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-sm font-medium">Completion criteria</h2>
                <p className="mt-2 text-sm text-muted-foreground">{criteria}</p>
              </div>
            </>
          )}

          <Separator className="my-6" />

          <p className="text-xs text-muted-foreground">
            This badge is an off-chain recognition issued by Arcademy. It confirms
            that the wallet holder completed the associated course requirements at
            the time of award. Verification pages remain valid after award even if
            course content is later updated.
          </p>

          {coursePublished && projectPublished && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={coursePath(course.product.slug, course.slug)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View course
                <ExternalLink className="size-3.5" />
              </Link>
              <Link
                href={productPath(course.product.slug)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View ecosystem project
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <Award className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Share this page to verify completion. Only badge, course, wallet, and
          award date are shown — no private account details.
        </span>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
