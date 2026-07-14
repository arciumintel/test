/**
 * Seeds mock CipherLend learners + ~150 course completions / quiz attempts
 * spread across the past 30 days with realistic funnel drop-off.
 *
 * Mock wallets use prefix `CLmock` (base58-safe) for idempotent cleanup.
 */
import { randomBytes } from "crypto";
import type { Prisma, PrismaClient, QuestionType } from "@prisma/client";
import {
  isSingleSelectFamily,
  type QuizSubmissionAnswer,
} from "../src/lib/question-types";

const MOCK_WALLET_PREFIX = "CLmock";
const MOCK_USER_COUNT = 100;
const TARGET_COURSE_COMPLETIONS = 150;
const PRODUCT_SLUG = "cipherlend";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const UTM_SOURCES = [
  { utmSource: "twitter", utmMedium: "social", utmCampaign: "cipherlend-launch" },
  { utmSource: "discord", utmMedium: "community", utmCampaign: "partner-push" },
  { utmSource: "google", utmMedium: "cpc", utmCampaign: "defi-education" },
  { utmSource: "newsletter", utmMedium: "email", utmCampaign: "weekly" },
  { utmSource: null, utmMedium: null, utmCampaign: null },
] as const;

type LoadedQuestion = {
  id: string;
  type: QuestionType;
  answerOptions: string[];
  leftItems: string[];
  correctAnswer: number;
  correctAnswers: number[];
  correctOrder: number[];
  correctMatches: number[];
  acceptableAnswers: string[];
};

type LoadedCourse = {
  id: string;
  slug: string;
  title: string;
  lessons: { id: string; order: number }[];
  finalQuiz: {
    id: string;
    passThreshold: number;
    questions: LoadedQuestion[];
  } | null;
  knowledgeChecks: {
    id: string;
    lessonId: string | null;
    passThreshold: number;
    questions: LoadedQuestion[];
  }[];
  badge: { id: string } | null;
};

function mockWallet(index: number): string {
  let s = MOCK_WALLET_PREFIX;
  let n = (index + 1) * 1_000_003;
  while (s.length < 44) {
    s += B58[n % 58];
    n = (n * 1103515245 + 12345 + s.length) >>> 0;
  }
  return s.slice(0, 44);
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgo(rng: () => number, maxDays = 29): Date {
  const dayOffset = Math.floor(rng() * (maxDays + 1));
  // Weekday bias: prefer Tue–Thu slightly, still cover weekends
  const hourBias = rng();
  const hour =
    hourBias < 0.55
      ? 12 + Math.floor(rng() * 8)
      : hourBias < 0.8
        ? 8 + Math.floor(rng() * 4)
        : Math.floor(rng() * 24);
  const minute = Math.floor(rng() * 60);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dayOffset);
  d.setUTCHours(hour, minute, Math.floor(rng() * 60), 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function verificationSlug(seed: string): string {
  return randomBytes(8).toString("base64url") + seed.slice(0, 4);
}

function correctAnswerFor(q: LoadedQuestion): QuizSubmissionAnswer {
  if (isSingleSelectFamily(q.type)) return q.correctAnswer;
  if (q.type === "multi_select") return [...q.correctAnswers];
  if (q.type === "ordering") return [...q.correctOrder];
  if (q.type === "matching") return [...q.correctMatches];
  if (q.type === "fill_blank") {
    return q.acceptableAnswers[0] ?? "wallet";
  }
  return q.correctAnswer;
}

function wrongAnswerFor(
  q: LoadedQuestion,
  rng: () => number
): QuizSubmissionAnswer {
  if (isSingleSelectFamily(q.type)) {
    const n = Math.max(q.answerOptions.length, 2);
    let pick = Math.floor(rng() * n);
    if (pick === q.correctAnswer) pick = (pick + 1) % n;
    return pick;
  }
  if (q.type === "multi_select") {
    if (q.answerOptions.length === 0) return [];
    return [Math.floor(rng() * q.answerOptions.length)];
  }
  if (q.type === "ordering") {
    const order = q.correctOrder.length
      ? [...q.correctOrder]
      : q.answerOptions.map((_, i) => i);
    if (order.length >= 2) {
      const a = 0;
      const b = order.length - 1;
      [order[a], order[b]] = [order[b], order[a]];
    }
    return order;
  }
  if (q.type === "matching") {
    const matches = q.correctMatches.length
      ? [...q.correctMatches]
      : q.leftItems.map((_, i) => i % Math.max(q.answerOptions.length, 1));
    if (matches.length >= 2) {
      [matches[0], matches[1]] = [matches[1], matches[0]];
    }
    return matches;
  }
  if (q.type === "fill_blank") return "not-the-answer";
  return 0;
}

function buildAnswers(
  questions: LoadedQuestion[],
  pass: boolean,
  passThreshold: number,
  rng: () => number
): { answers: QuizSubmissionAnswer[]; score: number; correctFlags: boolean[] } {
  if (questions.length === 0) {
    return { answers: [], score: pass ? 100 : 0, correctFlags: [] };
  }

  const minCorrectForPass = Math.ceil(
    (passThreshold / 100) * questions.length
  );
  const correctNeeded = pass
    ? Math.min(questions.length, Math.max(minCorrectForPass, 1))
    : Math.max(0, Math.min(questions.length, minCorrectForPass - 1));

  const correctFlags = questions.map((_, i) => i < correctNeeded);
  for (let i = correctFlags.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [correctFlags[i], correctFlags[j]] = [correctFlags[j], correctFlags[i]];
  }

  const answers = questions.map((q, i) =>
    correctFlags[i] ? correctAnswerFor(q) : wrongAnswerFor(q, rng)
  );
  const score = Math.round(
    (correctFlags.filter(Boolean).length / questions.length) * 100
  );
  return { answers, score, correctFlags };
}

type EventRow = Prisma.AnalyticsEventCreateManyInput;

async function purgeMockActivity(prisma: PrismaClient, productId: string) {
  const mockUsers = await prisma.user.findMany({
    where: { walletAddress: { startsWith: MOCK_WALLET_PREFIX } },
    select: { id: true },
  });
  const ids = mockUsers.map((u) => u.id);
  if (ids.length === 0) {
    await prisma.analyticsEvent.deleteMany({
      where: {
        ecosystemProjectId: productId,
        sessionId: { startsWith: "cl-mock-" },
      },
    });
    return;
  }

  await prisma.questionAttempt.deleteMany({ where: { userId: { in: ids } } });
  await prisma.quizAttempt.deleteMany({ where: { userId: { in: ids } } });
  await prisma.progress.deleteMany({ where: { userId: { in: ids } } });
  await prisma.badgeAward.deleteMany({ where: { userId: { in: ids } } });
  await prisma.certificationAward.deleteMany({ where: { userId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.analyticsEvent.deleteMany({
    where: {
      OR: [
        { userId: { in: ids } },
        {
          ecosystemProjectId: productId,
          sessionId: { startsWith: "cl-mock-" },
        },
      ],
    },
  });
}

async function loadCourses(
  prisma: PrismaClient,
  productId: string
): Promise<LoadedCourse[]> {
  const courses = await prisma.course.findMany({
    where: { productId, status: "published" },
    orderBy: { createdAt: "asc" },
    include: {
      lessons: {
        where: { status: "published" },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      },
      quizzes: {
        where: { status: "published" },
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
      badge: { select: { id: true, status: true } },
    },
  });

  // Prefer funnel order matching learning path when present
  const preferred = [
    "welcome-to-cipherlend",
    "borrowing-privately-on-cipherlend",
    "managing-risk-on-cipherlend",
    "cipherlend-skills-assessment",
  ];
  courses.sort((a, b) => {
    const ai = preferred.indexOf(a.slug);
    const bi = preferred.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return courses.map((c) => {
    const finalQuiz = c.quizzes.find((q) => q.lessonId == null) ?? null;
    const knowledgeChecks = c.quizzes.filter((q) => q.lessonId != null);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      lessons: c.lessons,
      finalQuiz: finalQuiz
        ? {
            id: finalQuiz.id,
            passThreshold: finalQuiz.passThreshold,
            questions: finalQuiz.questions,
          }
        : null,
      knowledgeChecks: knowledgeChecks.map((q) => ({
        id: q.id,
        lessonId: q.lessonId,
        passThreshold: q.passThreshold,
        questions: q.questions,
      })),
      badge:
        c.badge && c.badge.status === "published" ? { id: c.badge.id } : null,
    };
  });
}

/**
 * Assign course completion targets with a realistic funnel:
 * welcome >> borrow >> risk >> skills
 */
function completionPlan(courseCount: number): number[] {
  if (courseCount <= 0) return [];
  if (courseCount === 1) return [TARGET_COURSE_COMPLETIONS];
  if (courseCount === 2) return [90, 60];
  if (courseCount === 3) return [70, 45, 35];
  // 4+
  const base = [65, 42, 28, 15];
  while (base.length < courseCount) base.push(5);
  const trimmed = base.slice(0, courseCount);
  const sum = trimmed.reduce((a, b) => a + b, 0);
  trimmed[0] += TARGET_COURSE_COMPLETIONS - sum;
  return trimmed;
}

export async function seedMockPartnerActivity(prisma: PrismaClient) {
  const product = await prisma.product.findUnique({
    where: { slug: PRODUCT_SLUG },
    select: { id: true, slug: true },
  });
  if (!product) {
    throw new Error(`Product ${PRODUCT_SLUG} not found — run partner seed first.`);
  }

  await purgeMockActivity(prisma, product.id);
  console.log("✓ Purged prior CipherLend mock learner activity");

  const courses = await loadCourses(prisma, product.id);
  if (courses.length === 0) {
    throw new Error("No published CipherLend courses to attach activity to.");
  }

  const targets = completionPlan(courses.length);
  const rng = mulberry32(20260713);

  // Create mock users
  const users: { id: string; walletAddress: string; index: number }[] = [];
  for (let i = 0; i < MOCK_USER_COUNT; i++) {
    const wallet = mockWallet(i);
    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: {
        displayName: `CL Learner #${String(i + 1).padStart(3, "0")}`,
      },
      create: {
        walletAddress: wallet,
        displayName: `CL Learner #${String(i + 1).padStart(3, "0")}`,
        role: "learner",
      },
    });
    users.push({ id: user.id, walletAddress: wallet, index: i });
  }
  console.log(`✓ Mock learners: ${users.length}`);

  // Persona buckets (index ranges)
  // 0-14: browsers / abandoners
  // 15-34: partial progress (no completion)
  // 35+: feed course completions

  const events: EventRow[] = [];
  let completionCount = 0;
  let quizAttemptCount = 0;
  let failedAttemptCount = 0;

  // Anonymous / early funnel noise
  for (let i = 0; i < 40; i++) {
    const when = daysAgo(rng);
    const utm = UTM_SOURCES[Math.floor(rng() * UTM_SOURCES.length)];
    const course = courses[Math.floor(rng() * Math.min(2, courses.length))];
    events.push({
      eventName: "course_catalog_viewed",
      occurredAt: when,
      source: "client",
      path: `/products/${product.slug}`,
      sessionId: `cl-mock-anon-${i}`,
      anonymousId: `anon-cl-${i}`,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      metadata: { mockPartnerActivity: true },
    });
    if (rng() < 0.7) {
      events.push({
        eventName: "course_detail_viewed",
        occurredAt: addMinutes(when, 1 + Math.floor(rng() * 5)),
        source: "client",
        path: `/products/${product.slug}/courses/${course.slug}`,
        sessionId: `cl-mock-anon-${i}`,
        anonymousId: `anon-cl-${i}`,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: course.id,
        courseSlug: course.slug,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        metadata: { mockPartnerActivity: true },
      });
    }
  }

  async function writeQuizAttempt(opts: {
    userId: string;
    walletAddress: string;
    course: LoadedCourse;
    quiz: {
      id: string;
      passThreshold: number;
      questions: LoadedQuestion[];
      lessonId?: string | null;
    };
    pass: boolean;
    at: Date;
    sessionId: string;
    durationSec: number;
  }) {
    const { answers, score, correctFlags } = buildAnswers(
      opts.quiz.questions,
      opts.pass,
      opts.quiz.passThreshold,
      rng
    );
    const passed = score >= opts.quiz.passThreshold;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: opts.userId,
        quizId: opts.quiz.id,
        score,
        passed,
        answers: answers as unknown as Prisma.InputJsonValue,
        durationInSeconds: opts.durationSec,
        submittedAt: opts.at,
      },
    });
    quizAttemptCount += 1;
    if (!passed) failedAttemptCount += 1;

    if (opts.quiz.questions.length > 0) {
      const perMs = Math.round((opts.durationSec * 1000) / opts.quiz.questions.length);
      await prisma.questionAttempt.createMany({
        data: opts.quiz.questions.map((q, i) => ({
          userId: opts.userId,
          quizAttemptId: attempt.id,
          questionId: q.id,
          correct: correctFlags[i] ?? false,
          answerPayload: answers[i] as unknown as Prisma.InputJsonValue,
          durationMs: perMs,
          hintUsed: rng() < 0.08,
          submittedAt: opts.at,
        })),
      });
    }

    const isLessonCheck = Boolean(opts.quiz.lessonId);
    const basePath = isLessonCheck
      ? `/products/${product.slug}/courses/${opts.course.slug}/lessons/${opts.quiz.lessonId}`
      : `/products/${product.slug}/courses/${opts.course.slug}/quiz`;

    events.push({
      eventName: "quiz_started",
      occurredAt: addMinutes(opts.at, -Math.max(1, Math.floor(opts.durationSec / 60))),
      source: "client",
      path: basePath,
      userId: opts.userId,
      walletAddress: opts.walletAddress,
      sessionId: opts.sessionId,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      courseId: opts.course.id,
      courseSlug: opts.course.slug,
      quizId: opts.quiz.id,
      lessonId: opts.quiz.lessonId ?? null,
      metadata: { mockPartnerActivity: true },
    });

    for (let i = 0; i < opts.quiz.questions.length; i++) {
      events.push({
        eventName: "question_answered",
        occurredAt: addMinutes(opts.at, -1),
        source: "server_action",
        path: basePath,
        userId: opts.userId,
        walletAddress: opts.walletAddress,
        sessionId: opts.sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: opts.course.id,
        courseSlug: opts.course.slug,
        quizId: opts.quiz.id,
        lessonId: opts.quiz.lessonId ?? null,
        metadata: {
          mockPartnerActivity: true,
          questionId: opts.quiz.questions[i].id,
          correct: correctFlags[i] ?? false,
        },
      });
    }

    events.push({
      eventName: isLessonCheck
        ? "lesson_knowledge_check_submitted"
        : "quiz_submitted",
      occurredAt: opts.at,
      source: "server_action",
      path: basePath,
      userId: opts.userId,
      walletAddress: opts.walletAddress,
      sessionId: opts.sessionId,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      courseId: opts.course.id,
      courseSlug: opts.course.slug,
      quizId: opts.quiz.id,
      lessonId: opts.quiz.lessonId ?? null,
      metadata: {
        mockPartnerActivity: true,
        score,
        passed,
        durationInSeconds: opts.durationSec,
      },
    });

    if (passed) {
      events.push({
        eventName: isLessonCheck
          ? "lesson_knowledge_check_passed"
          : "quiz_passed",
        occurredAt: opts.at,
        source: "server_action",
        path: basePath,
        userId: opts.userId,
        walletAddress: opts.walletAddress,
        sessionId: opts.sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: opts.course.id,
        courseSlug: opts.course.slug,
        quizId: opts.quiz.id,
        lessonId: opts.quiz.lessonId ?? null,
        metadata: { mockPartnerActivity: true, score },
      });
    } else if (!isLessonCheck) {
      events.push({
        eventName: "quiz_failed",
        occurredAt: opts.at,
        source: "server_action",
        path: basePath,
        userId: opts.userId,
        walletAddress: opts.walletAddress,
        sessionId: opts.sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: opts.course.id,
        courseSlug: opts.course.slug,
        quizId: opts.quiz.id,
        metadata: { mockPartnerActivity: true, score },
      });
    }

    return { passed, score, attemptId: attempt.id };
  }

  async function completeCourseForUser(opts: {
    user: { id: string; walletAddress: string; index: number };
    course: LoadedCourse;
    startedAt: Date;
    failFirstQuiz?: boolean;
  }) {
    const utm = UTM_SOURCES[opts.user.index % UTM_SOURCES.length];
    const sessionId = `cl-mock-${opts.user.index}-${opts.course.slug}`;
    let cursor = opts.startedAt;

    const push = (
      eventName: string,
      at: Date,
      extra: Partial<EventRow> = {}
    ) => {
      events.push({
        eventName,
        occurredAt: at,
        source: "client",
        path:
          extra.path ??
          `/products/${product.slug}/courses/${opts.course.slug}`,
        userId: opts.user.id,
        walletAddress: opts.user.walletAddress,
        sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: opts.course.id,
        courseSlug: opts.course.slug,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        metadata: { mockPartnerActivity: true },
        ...extra,
      });
    };

    push("ecosystem_project_viewed", cursor, {
      path: `/ecosystem/${product.slug}`,
    });
    cursor = addMinutes(cursor, 1);
    push("course_detail_viewed", cursor);
    cursor = addMinutes(cursor, 1);
    push("start_course_clicked", cursor);
    cursor = addMinutes(cursor, 1);
    if (rng() < 0.35) {
      push("wallet_connect_started", cursor);
      cursor = addMinutes(cursor, 1);
    }
    push("wallet_connected", cursor, { source: "client" });
    cursor = addMinutes(cursor, 2);
    push("course_started", cursor, { source: "server_action" });

    for (let li = 0; li < opts.course.lessons.length; li++) {
      const lesson = opts.course.lessons[li];
      cursor = addMinutes(cursor, 3 + Math.floor(rng() * 8));
      push("lesson_viewed", cursor, {
        lessonId: lesson.id,
        path: `/products/${product.slug}/courses/${opts.course.slug}/lessons/${lesson.id}`,
      });
      cursor = addMinutes(cursor, 4 + Math.floor(rng() * 12));
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId: opts.user.id,
            lessonId: lesson.id,
          },
        },
        create: {
          userId: opts.user.id,
          courseId: opts.course.id,
          lessonId: lesson.id,
          completed: true,
          completedAt: cursor,
          createdAt: cursor,
          updatedAt: cursor,
        },
        update: {
          completed: true,
          completedAt: cursor,
          updatedAt: cursor,
        },
      });
      push("lesson_completed", cursor, {
        lessonId: lesson.id,
        source: "server_action",
        path: `/products/${product.slug}/courses/${opts.course.slug}/lessons/${lesson.id}`,
      });

      const kc = opts.course.knowledgeChecks.find(
        (q) => q.lessonId === lesson.id
      );
      if (kc && rng() < 0.85) {
        cursor = addMinutes(cursor, 2 + Math.floor(rng() * 5));
        await writeQuizAttempt({
          userId: opts.user.id,
          walletAddress: opts.user.walletAddress,
          course: opts.course,
          quiz: {
            id: kc.id,
            passThreshold: kc.passThreshold,
            questions: kc.questions,
            lessonId: kc.lessonId,
          },
          pass: rng() < 0.9,
          at: cursor,
          sessionId,
          durationSec: 40 + Math.floor(rng() * 90),
        });
      }
    }

    if (!opts.course.finalQuiz) return;

    if (opts.failFirstQuiz) {
      cursor = addMinutes(cursor, 5);
      await writeQuizAttempt({
        userId: opts.user.id,
        walletAddress: opts.user.walletAddress,
        course: opts.course,
        quiz: opts.course.finalQuiz,
        pass: false,
        at: cursor,
        sessionId,
        durationSec: 90 + Math.floor(rng() * 120),
      });
      cursor = addMinutes(cursor, 30 + Math.floor(rng() * 180));
    }

    cursor = addMinutes(cursor, 5 + Math.floor(rng() * 20));
    const result = await writeQuizAttempt({
      userId: opts.user.id,
      walletAddress: opts.user.walletAddress,
      course: opts.course,
      quiz: opts.course.finalQuiz,
      pass: true,
      at: cursor,
      sessionId,
      durationSec: 120 + Math.floor(rng() * 240),
    });

    if (!result.passed) return;

    completionCount += 1;
    push("course_completed", cursor, { source: "server_action" });

    if (opts.course.badge) {
      const slug = verificationSlug(`${opts.user.index}${opts.course.slug}`);
      try {
        await prisma.badgeAward.create({
          data: {
            userId: opts.user.id,
            badgeId: opts.course.badge.id,
            courseId: opts.course.id,
            walletAddress: opts.user.walletAddress,
            verificationSlug: slug,
            awardedAt: cursor,
          },
        });
        push("badge_awarded", cursor, {
          source: "server_action",
          badgeId: opts.course.badge.id,
          verificationSlug: slug,
        });
      } catch {
        // unique user+badge — ignore if already awarded
      }
    }

    // Partner conversion mix for deeper courses
    if (
      opts.course.slug !== "welcome-to-cipherlend" &&
      rng() < 0.35
    ) {
      events.push({
        eventName: "partner.cipherlend.markets_viewed",
        occurredAt: addMinutes(cursor, 5),
        source: "client",
        path: "/markets",
        userId: opts.user.id,
        walletAddress: opts.user.walletAddress,
        sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: opts.course.id,
        courseSlug: opts.course.slug,
        metadata: { mockPartnerActivity: true, conversionKey: "markets_viewed" },
      });
    }
    if (
      (opts.course.slug === "borrowing-privately-on-cipherlend" ||
        opts.course.slug === "cipherlend-skills-assessment") &&
      rng() < 0.25
    ) {
      events.push({
        eventName: "partner.cipherlend.first_borrow",
        occurredAt: addMinutes(cursor, 15),
        source: "client",
        path: "/borrow",
        userId: opts.user.id,
        walletAddress: opts.user.walletAddress,
        sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        metadata: { mockPartnerActivity: true, conversionKey: "first_borrow" },
      });
    }
  }

  // Browsers / abandoners (0-14)
  for (let i = 0; i < 15 && i < users.length; i++) {
    const user = users[i];
    const course = courses[0];
    const when = daysAgo(rng);
    const sessionId = `cl-mock-${i}-browse`;
    const utm = UTM_SOURCES[i % UTM_SOURCES.length];
    events.push({
      eventName: "course_detail_viewed",
      occurredAt: when,
      source: "client",
      path: `/products/${product.slug}/courses/${course.slug}`,
      userId: user.id,
      walletAddress: user.walletAddress,
      sessionId,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      courseId: course.id,
      courseSlug: course.slug,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      metadata: { mockPartnerActivity: true },
    });
    if (rng() < 0.5) {
      events.push({
        eventName: "start_course_clicked",
        occurredAt: addMinutes(when, 2),
        source: "client",
        path: `/products/${product.slug}/courses/${course.slug}`,
        userId: user.id,
        walletAddress: user.walletAddress,
        sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: course.id,
        courseSlug: course.slug,
        metadata: { mockPartnerActivity: true },
      });
    }
  }

  // Partial progress (15-34): start + some lessons, no final pass
  for (let i = 15; i < 35 && i < users.length; i++) {
    const user = users[i];
    const course = courses[Math.min(1, courses.length - 1)];
    let cursor = daysAgo(rng);
    const sessionId = `cl-mock-${i}-partial`;
    events.push({
      eventName: "course_started",
      occurredAt: cursor,
      source: "server_action",
      path: `/products/${product.slug}/courses/${course.slug}`,
      userId: user.id,
      walletAddress: user.walletAddress,
      sessionId,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      courseId: course.id,
      courseSlug: course.slug,
      metadata: { mockPartnerActivity: true },
    });
    const lessonLimit = Math.max(
      1,
      Math.floor(course.lessons.length * (0.25 + rng() * 0.5))
    );
    for (let li = 0; li < lessonLimit; li++) {
      const lesson = course.lessons[li];
      cursor = addMinutes(cursor, 5 + Math.floor(rng() * 10));
      await prisma.progress.upsert({
        where: {
          userId_lessonId: { userId: user.id, lessonId: lesson.id },
        },
        create: {
          userId: user.id,
          courseId: course.id,
          lessonId: lesson.id,
          completed: true,
          completedAt: cursor,
        },
        update: { completed: true, completedAt: cursor },
      });
      events.push({
        eventName: "lesson_completed",
        occurredAt: cursor,
        source: "server_action",
        path: `/products/${product.slug}/courses/${course.slug}/lessons/${lesson.id}`,
        userId: user.id,
        walletAddress: user.walletAddress,
        sessionId,
        ecosystemProjectId: product.id,
        ecosystemProjectSlug: product.slug,
        courseId: course.id,
        courseSlug: course.slug,
        lessonId: lesson.id,
        metadata: { mockPartnerActivity: true },
      });
    }
  }

  // Completions: assign from users 20+ across courses to hit targets
  const completerPool = users.slice(20);
  let poolIdx = 0;
  const completedPairs = new Set<string>();

  for (let ci = 0; ci < courses.length; ci++) {
    const course = courses[ci];
    const target = targets[ci] ?? 0;
    let made = 0;
    let attempts = 0;
    while (made < target && attempts < target * 4) {
      attempts += 1;
      if (completerPool.length === 0) break;
      const user = completerPool[poolIdx % completerPool.length];
      poolIdx += 1;
      const key = `${user.id}:${course.id}`;
      if (completedPairs.has(key)) continue;
      completedPairs.add(key);
      const startedAt = daysAgo(rng);
      await completeCourseForUser({
        user,
        course,
        startedAt,
        failFirstQuiz: rng() < 0.18,
      });
      made += 1;
    }
  }

  // Flush events in batches
  const batchSize = 200;
  for (let i = 0; i < events.length; i += batchSize) {
    await prisma.analyticsEvent.createMany({
      data: events.slice(i, i + batchSize),
    });
  }

  console.log(
    `✓ Activity: ${completionCount} course completions, ${quizAttemptCount} quiz attempts (${failedAttemptCount} failed), ${events.length} analytics events`
  );

  return {
    learners: users.length,
    courseCompletions: completionCount,
    quizAttempts: quizAttemptCount,
    analyticsEvents: events.length,
  };
}

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { PrismaClient } = await import("@prisma/client");

  neonConfig.webSocketConstructor = ws;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  const connectionString = url.includes("connect_timeout=")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}connect_timeout=30`;

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const result = await seedMockPartnerActivity(prisma);
    console.log("\nMock partner activity seed complete:");
    console.log(result);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = /seed-mock-partner-activity\.(ts|js|mjs|cjs)$/.test(
  (process.argv[1] ?? "").replace(/\\/g, "/")
);

if (isDirectRun) {
  import("dotenv/config")
    .then(() => main())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
