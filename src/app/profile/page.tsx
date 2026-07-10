import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BadgeMedallion } from "@/components/badge-medallion";
import { DisplayNameForm } from "@/components/display-name-form";
import { DiscordProfileSection } from "@/components/discord-profile-section";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { ProfileConnectPrompt } from "@/components/profile-connect-prompt";
import { PageHeader } from "@/components/page-header";
import { TrackView } from "@/components/analytics/track-view";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getInProgressCourses,
  getLearnerCourseProgressList,
} from "@/lib/learner-progress";
import { badgeVerificationPath } from "@/lib/paths";
import { shortWallet, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My learning",
  description: "Track course progress and badges you earn on Arcademy.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto min-w-0 max-w-5xl px-4 pb-10 sm:px-6">
        <PageHeader
          headingId="profile-heading"
          title="My learning"
          description="Connect your wallet to save lesson progress, quiz scores, and badges in one place."
        />
        <section aria-labelledby="profile-heading">
          <ProfileConnectPrompt />
        </section>
      </div>
    );
  }

  const { discord: discordStatus } = await searchParams;

  let profileLoadError = false;
  let awards: Awaited<
    ReturnType<
      typeof prisma.badgeAward.findMany<{
        include: {
          badge: true;
          course: {
            select: {
              slug: true;
              title: true;
              product: { select: { slug: true } };
            };
          };
        };
      }>
    >
  > = [];
  let courses: Awaited<ReturnType<typeof getLearnerCourseProgressList>> = [];
  let discordAccount: Awaited<
    ReturnType<typeof prisma.discordAccount.findUnique>
  > = null;
  let grantFailures: Awaited<
    ReturnType<
      typeof prisma.discordRoleGrant.findMany<{
        include: {
          discordRoleRule: {
            select: {
              discordRoleName: true;
              unlockLabel: true;
              integration: { select: { guildName: true } };
            };
          };
        };
      }>
    >
  > = [];

  try {
    [awards, courses, discordAccount, grantFailures] = await Promise.all([
        prisma.badgeAward.findMany({
          where: { userId: user.id },
          orderBy: { awardedAt: "desc" },
          include: {
            badge: true,
            course: {
              select: {
                slug: true,
                title: true,
                product: { select: { slug: true } },
              },
            },
          },
        }),
        getLearnerCourseProgressList(user.id),
        prisma.discordAccount.findUnique({ where: { userId: user.id } }),
        prisma.discordRoleGrant.findMany({
          where: {
            userId: user.id,
            status: {
              in: [
                "failed_user_not_in_server",
                "failed_missing_bot_permission",
                "failed_role_hierarchy",
                "failed_rate_limited",
                "failed_unknown",
                "skipped_discord_not_linked",
              ],
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: {
            discordRoleRule: {
              select: {
                discordRoleName: true,
                unlockLabel: true,
                integration: { select: { guildName: true } },
              },
            },
          },
        }),
      ]);
  } catch {
    profileLoadError = true;
  }

  const inProgress = getInProgressCourses(courses);
  const completed = courses.filter((c) => c.completed);

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 pb-10 sm:px-6">
      {!profileLoadError && (
        <TrackView
          eventName="profile_viewed"
          path="/profile"
          metadata={{
            inProgressCourseCount: inProgress.length,
            completedCourseCount: completed.length,
            badgeCount: awards.length,
          }}
        />
      )}

      <PageHeader innerClassName="min-w-0 max-w-none">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-text-secondary">
            <GraduationCap className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <DisplayNameForm initialName={user.displayName} />
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {shortWallet(user.walletAddress, 6)}
            </p>
          </div>
        </div>
      </PageHeader>

      {profileLoadError ? (
        <HomeSectionLoadError
          title="My learning did not load"
          description="Your progress and badges are unavailable right now. Refresh the page, or try again in a few minutes."
        />
      ) : (
        <>
          <section aria-labelledby="badges-heading">
            <h2
              id="badges-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Badges earned
              {awards.length > 0 ? ` (${awards.length})` : ""}
            </h2>
            {awards.length > 0 ? (
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
                {awards.map((award) => (
                  <Card key={award.id} className="min-w-0 overflow-hidden">
                    <CardContent className="flex min-w-0 flex-col gap-4 py-5">
                      <div className="flex min-w-0 items-start gap-4">
                        <BadgeMedallion
                          name={award.badge.name}
                          imageUrl={award.badge.imageUrl}
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 break-words font-medium">
                            {award.badge.name}
                          </p>
                          <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                            {award.course.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Earned {formatDate(award.awardedAt)}
                          </p>
                        </div>
                      </div>
                      {award.verificationSlug && (
                        <Link
                          href={badgeVerificationPath(award.verificationSlug)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          View verification
                          <ExternalLink className="size-3.5" aria-hidden />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-dashed bg-muted/30 p-10 text-center">
                <div className="bg-ambient pointer-events-none absolute inset-0" aria-hidden />
                <Award
                  className="relative z-10 mx-auto size-7 text-muted-foreground"
                  aria-hidden
                />
                <p className="relative z-10 mt-3 font-medium">No badges yet</p>
                <p className="relative z-10 mt-1 text-pretty text-sm text-muted-foreground">
                  Complete a course and pass the final quiz to earn your first
                  badge.
                </p>
                <Button variant="outline" className="relative z-10 mt-4" asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            )}
          </section>

          {inProgress.length > 0 && (
            <section className="mt-10" aria-labelledby="in-progress-heading">
              <h2
                id="in-progress-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Continue learning ({inProgress.length})
              </h2>
              <div className="mt-4 space-y-3">
                {inProgress.map((c) => (
                  <CourseProgressRow
                    key={`${c.productSlug}/${c.slug}`}
                    {...c}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="mt-10" aria-labelledby="completed-heading">
              <h2
                id="completed-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Completed courses ({completed.length})
              </h2>
              <div className="mt-4 space-y-3">
                {completed.map((c) => (
                  <CourseProgressRow
                    key={`${c.productSlug}/${c.slug}`}
                    {...c}
                  />
                ))}
              </div>
            </section>
          )}

          {courses.length === 0 && (
            <section
              className="relative mt-10 overflow-hidden rounded-xl border border-dashed bg-muted/30 p-10 text-center"
              aria-labelledby="empty-courses-heading"
            >
              <div className="bg-ambient pointer-events-none absolute inset-0" aria-hidden />
              <BookOpen
                className="relative z-10 mx-auto size-8 text-muted-foreground"
                aria-hidden
              />
              <h2 id="empty-courses-heading" className="relative z-10 mt-3 font-medium">
                You haven&apos;t started a course yet
              </h2>
              <p className="relative z-10 mt-1 text-pretty text-sm text-muted-foreground">
                Browse the catalog and start learning.
              </p>
              <Button className="relative z-10 mt-4" asChild>
                <Link href="/courses">
                  Browse courses
                  <ArrowRight />
                </Link>
              </Button>
            </section>
          )}

          <DiscordProfileSection
            className="mt-10"
            discordStatus={discordStatus ?? null}
            linked={
              discordAccount
                ? {
                    username: discordAccount.username,
                    globalName: discordAccount.globalName,
                    linkedAt: discordAccount.linkedAt.toISOString(),
                  }
                : null
            }
            recentFailures={grantFailures.map((g) => ({
              id: g.id,
              status: g.status,
              lastErrorMessage: g.lastErrorMessage,
              ruleName:
                g.discordRoleRule.unlockLabel ||
                g.discordRoleRule.discordRoleName,
              guildName: g.discordRoleRule.integration.guildName,
            }))}
          />
        </>
      )}
    </div>
  );
}

function CourseProgressRow({
  title,
  pct,
  completed,
  resumeHref,
}: {
  title: string;
  pct: number;
  completed: boolean;
  resumeHref: string;
}) {
  return (
    <Link href={resumeHref} className="block min-w-0">
      <Card className="min-w-0 overflow-hidden transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-medium">{title}</p>
              {completed && (
                <Badge variant="milestone" className="shrink-0">
                  <Award />
                  Complete
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Progress value={pct} className="w-full sm:max-w-xs" />
              <span className="shrink-0 text-xs font-medium text-xp">{pct}%</span>
            </div>
          </div>
          <ArrowRight
            className="hidden size-4 shrink-0 text-muted-foreground sm:block"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
