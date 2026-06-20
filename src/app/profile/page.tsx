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
import { TrackView } from "@/components/analytics/track-view";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { coursePath, badgeVerificationPath } from "@/lib/paths";
import { shortWallet, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My learning",
  description: "Track course progress and badges you earn on Arcademy.",
};

type CourseAgg = {
  slug: string;
  productSlug: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  finalQuizId: string | null;
  completed: boolean;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8 max-w-2xl">
          <h1
            id="profile-heading"
            className="text-balance text-3xl font-semibold tracking-tight"
          >
            My learning
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Connect your wallet to save lesson progress, quiz scores, and badges
            in one place.
          </p>
        </header>
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
  let progressRows: Awaited<
    ReturnType<
      typeof prisma.progress.findMany<{
        include: {
          course: {
            select: {
              id: true;
              slug: true;
              title: true;
              status: true;
              product: { select: { slug: true } };
              _count: {
                select: { lessons: { where: { status: "published" } } };
              };
              quizzes: { where: { lessonId: null }; select: { id: true } };
            };
          };
        };
      }>
    >
  > = [];
  let passedAttempts: { quizId: string }[] = [];
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
    [awards, progressRows, passedAttempts, discordAccount, grantFailures] =
      await Promise.all([
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
        prisma.progress.findMany({
          where: { userId: user.id },
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                status: true,
                product: { select: { slug: true } },
                _count: {
                  select: { lessons: { where: { status: "published" } } },
                },
                quizzes: { where: { lessonId: null }, select: { id: true } },
              },
            },
          },
        }),
        prisma.quizAttempt.findMany({
          where: { userId: user.id, passed: true },
          select: { quizId: true },
        }),
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

  const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
  const awardedCourseIds = new Set(awards.map((a) => a.courseId));

  const byCourse = new Map<string, CourseAgg>();
  for (const row of progressRows) {
    const c = row.course;
    if (c.status !== "published") continue;
    let agg = byCourse.get(c.id);
    if (!agg) {
      agg = {
        slug: c.slug,
        productSlug: c.product.slug,
        title: c.title,
        totalLessons: c._count.lessons,
        completedLessons: 0,
        finalQuizId: c.quizzes[0]?.id ?? null,
        completed: awardedCourseIds.has(c.id),
      };
      byCourse.set(c.id, agg);
    }
    if (row.completed) agg.completedLessons += 1;
  }

  const courses = [...byCourse.values()].map((c) => {
    const quizDone = c.finalQuizId ? passedQuizIds.has(c.finalQuizId) : true;
    const totalSteps = c.totalLessons + (c.finalQuizId ? 1 : 0);
    const doneSteps = c.completedLessons + (quizDone && c.finalQuizId ? 1 : 0);
    const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
    return { ...c, pct };
  });

  const inProgress = courses.filter((c) => !c.completed && c.pct < 100);
  const completed = courses.filter((c) => c.completed || c.pct >= 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
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

      <header className="mb-8">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-7" aria-hidden />
          </span>
          <div>
            <DisplayNameForm initialName={user.displayName} />
            <p className="mt-1 text-sm text-muted-foreground">
              {shortWallet(user.walletAddress, 6)}
            </p>
          </div>
        </div>
      </header>

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
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {awards.map((award) => (
                  <Card key={award.id}>
                    <CardContent className="flex flex-col gap-4 py-5">
                      <div className="flex items-center gap-4">
                        <BadgeMedallion
                          name={award.badge.name}
                          imageUrl={award.badge.imageUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{award.badge.name}</p>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
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
              <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
                <Award
                  className="mx-auto size-7 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 font-medium">No badges yet</p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  Complete a course and pass the final quiz to earn your first
                  badge.
                </p>
                <Button variant="outline" className="mt-4" asChild>
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
              className="mt-10 rounded-xl border border-dashed bg-muted/30 p-10 text-center"
              aria-labelledby="empty-courses-heading"
            >
              <BookOpen
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden
              />
              <h2 id="empty-courses-heading" className="mt-3 font-medium">
                You haven&apos;t started a course yet
              </h2>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Browse the catalog and start learning.
              </p>
              <Button className="mt-4" asChild>
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
  slug,
  productSlug,
  title,
  pct,
  completed,
}: {
  slug: string;
  productSlug: string;
  title: string;
  pct: number;
  completed: boolean;
}) {
  return (
    <Link href={coursePath(productSlug, slug)} className="block">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{title}</p>
              {completed && (
                <Badge variant="success">
                  <Award />
                  Complete
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={pct} className="max-w-xs" />
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
          </div>
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
