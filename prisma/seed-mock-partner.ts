/**
 * Seeds a realistic partner project: owner, product, courses/lessons/quizzes,
 * and analytics suite (profile, pack, concepts, conversions, readiness, certification).
 *
 * Owner wallet: FsBdnmg8QqCm5e693YYc1G4LuceKvvMii1fq1UmZ1wmj
 *
 * Run: npx tsx prisma/seed-mock-partner.ts
 * Or via: npm run db:seed:mock-partner
 */
import {
  type PrismaClient,
  type CourseLevel,
  type CourseType,
  type Prisma,
  type QuestionType,
} from "@prisma/client";
import {
  DEVELOPER_EDUCATION_PACK,
  DEFAULT_LEARNING_READINESS,
  type AnalyticsPackManifest,
} from "../src/lib/analytics-packs";
import { TRUE_FALSE_OPTIONS } from "../src/lib/question-types";

const OWNER_WALLET =
  "FsBdnmg8QqCm5e693YYc1G4LuceKvvMii1fq1UmZ1wmj";

/** Stable product id so re-seeds stay idempotent. */
const PRODUCT_ID = "product_cipherlend";
const PRODUCT_SLUG = "cipherlend";

/**
 * Cloudinary demo assets (already allow-listed in next.config.mjs).
 * Transformed for logo / banner / course / badge use.
 */
const IMAGES = {
  logo: "https://res.cloudinary.com/demo/image/upload/w_256,h_256,c_fill,g_auto,e_colorize:40,co_rgb:0F766E/sample.jpg",
  banner:
    "https://res.cloudinary.com/demo/image/upload/w_1600,h_640,c_fill,g_auto,e_saturate:30/docs/models.jpg",
  courseWelcome:
    "https://res.cloudinary.com/demo/image/upload/w_800,h_450,c_fill,g_auto/sample.jpg",
  courseBorrow:
    "https://res.cloudinary.com/demo/image/upload/w_800,h_450,c_fill,g_south/beach_boat.jpg",
  courseRisk:
    "https://res.cloudinary.com/demo/image/upload/w_800,h_450,c_fill,g_auto,e_art:audrey/sample.jpg",
  courseSkills:
    "https://res.cloudinary.com/demo/image/upload/w_800,h_450,c_fill,g_center/docs/models.jpg",
  badgeFoundations:
    "https://res.cloudinary.com/demo/image/upload/w_256,h_256,c_fill,r_max,e_colorize:55,co_rgb:134E4A/sample.jpg",
  badgeBorrower:
    "https://res.cloudinary.com/demo/image/upload/w_256,h_256,c_fill,r_max,e_colorize:55,co_rgb:0E7490/beach_boat.jpg",
  badgeRisk:
    "https://res.cloudinary.com/demo/image/upload/w_256,h_256,c_fill,r_max,e_colorize:55,co_rgb:B45309/sample.jpg",
  badgeSkills:
    "https://res.cloudinary.com/demo/image/upload/w_256,h_256,c_fill,r_max,e_colorize:55,co_rgb:1D4ED8/docs/models.jpg",
  certification:
    "https://res.cloudinary.com/demo/image/upload/w_320,h_320,c_fill,e_colorize:50,co_rgb:115E59/docs/models.jpg",
  lessonMedia:
    "https://res.cloudinary.com/demo/image/upload/w_960,h_540,c_fill/docs/models.jpg",
  questionMedia:
    "https://res.cloudinary.com/demo/image/upload/w_640,h_360,c_fill,g_auto/sample.jpg",
};

type SeedQuestion = {
  type?: QuestionType;
  prompt: string;
  answerOptions?: string[];
  leftItems?: string[];
  correctAnswer?: number;
  correctAnswers?: number[];
  correctOrder?: number[];
  correctMatches?: number[];
  acceptableAnswers?: string[];
  mediaUrl?: string;
  explanation?: string;
  conceptSlug?: string;
};

type SeedLesson = {
  title: string;
  content: string;
  estimatedDuration?: number;
  mediaUrl?: string;
  conceptSlug?: string;
};

type SeedModule = {
  title: string;
  description?: string;
  lessons: SeedLesson[];
};

type SeedCourse = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevel;
  courseType: CourseType;
  estimatedDuration: number;
  learningOutcomes: string[];
  thumbnailUrl: string;
  modules: SeedModule[];
  passThreshold: number;
  questions: SeedQuestion[];
  badge: { name: string; description: string; imageUrl: string };
  lessonKnowledgeCheck?: {
    moduleIndex: number;
    lessonIndex: number;
    questions: SeedQuestion[];
  };
};

const COURSES: SeedCourse[] = [
  {
    slug: "welcome-to-cipherlend",
    title: "Welcome to CipherLend",
    summary:
      "Learn what confidential lending is, why privacy matters for borrow/lend flows, and how CipherLend keeps your positions protected.",
    description:
      "A beginner-friendly onboarding course for CipherLend. You will learn the product in plain language, connect your wallet safely, and understand what stays private when you lend or borrow.",
    level: "beginner",
    courseType: "product_onboarding",
    estimatedDuration: 35,
    learningOutcomes: [
      "Explain confidential lending in plain language",
      "Recognize what CipherLend keeps private",
      "Connect a wallet and start exploring markets",
      "Avoid common beginner mistakes with collateral",
    ],
    thumbnailUrl: IMAGES.courseWelcome,
    modules: [
      {
        title: "Why confidential lending",
        description: "The problem CipherLend solves.",
        lessons: [
          {
            title: "What CipherLend does",
            estimatedDuration: 6,
            mediaUrl: IMAGES.lessonMedia,
            conceptSlug: "ecosystem-basics",
            content: `# What CipherLend does

CipherLend is a **confidential lending market** built on Arcium. You can lend and borrow without exposing sensitive details like your exact collateral ratio to the public order flow.

## In plain terms

- Other users see a healthy market — not your personal balances.
- Liquidation logic can run on encrypted inputs, reducing front-running risk.
- Your Solana wallet is still your identity on Arcademy and in the product.

## What you will practice

This course walks through the ideas first, then the safe habits for your first deposit or borrow.`,
          },
          {
            title: "Why privacy matters for lending",
            estimatedDuration: 7,
            conceptSlug: "security-and-privacy",
            content: `## The public-market problem

On many on-chain lending markets, position details leak through public state. Sophisticated actors can use that information to squeeze borrowers or snipe liquidations.

## What stays private on CipherLend

- Exact collateral composition details that would reveal your strategy
- Fine-grained health ratios used only by confidential computation
- Inputs to matching and liquidation checks

## What stays public (on purpose)

Market availability, protocol rules, and the fact that you interacted — not the sensitive math behind your position.`,
          },
        ],
      },
      {
        title: "Your first session",
        description: "Wallet, markets, and safety checks.",
        lessons: [
          {
            title: "Connect and explore markets",
            estimatedDuration: 8,
            conceptSlug: "developer-workflow",
            content: `## Step by step

1. **Connect your Solana wallet.** Signing a message proves ownership and does not move funds.
2. **Open Markets.** Browse available borrow and lend pools.
3. **Read the disclosure.** CipherLend tells you which inputs stay encrypted.
4. **Start small.** Use a test size until you understand health and liquidation rules.

## Success looks like

You can describe what you are about to share, what stays private, and which action you are confirming.`,
          },
          {
            title: "Common beginner mistakes",
            estimatedDuration: 6,
            conceptSlug: "production-readiness",
            content: `## Avoid these pitfalls

- **Confusing signing with paying.** Message signatures are free identity proofs.
- **Ignoring health buffers.** Confidential markets still liquidate unsafe positions.
- **Using the wrong wallet.** Double-check the address before confirming actions.
- **Skipping the disclosure panel.** Always review what stays encrypted.

## Checklist before you leave

- [ ] Wallet connected intentionally
- [ ] You understand max borrow / lend for your size
- [ ] You know where to find market docs`,
          },
        ],
      },
    ],
    passThreshold: 70,
    questions: [
      {
        type: "single_select",
        prompt: "What is CipherLend primarily designed to do?",
        answerOptions: [
          "Mint NFTs for borrowers",
          "Enable lend/borrow flows with confidential position details",
          "Replace Solana wallets",
          "Publish every collateral ratio on a public feed",
        ],
        correctAnswer: 1,
        explanation:
          "CipherLend is a confidential lending market — useful results without exposing sensitive position math.",
        conceptSlug: "ecosystem-basics",
      },
      {
        type: "true_false",
        prompt: "Signing a connection message moves funds from your wallet.",
        correctAnswer: 1,
        explanation:
          "False — signing proves ownership and does not transfer assets.",
        conceptSlug: "developer-workflow",
      },
      {
        type: "scenario_select",
        prompt:
          "You are new and unsure what stays private. What should you do before your first action?",
        answerOptions: [
          "Skip disclosures and borrow the maximum",
          "Read the disclosure panel, then proceed with a small size",
          "Share your seed phrase with support chat",
          "Disable your wallet permanently",
        ],
        correctAnswer: 1,
        conceptSlug: "security-and-privacy",
      },
      {
        type: "fill_blank",
        prompt: "On Arcademy, your identity is anchored to your Solana ___.",
        acceptableAnswers: ["wallet", "wallet address", "solana wallet"],
        conceptSlug: "ecosystem-basics",
      },
    ],
    badge: {
      name: "CipherLend Foundations",
      description: "Completed Welcome to CipherLend.",
      imageUrl: IMAGES.badgeFoundations,
    },
    lessonKnowledgeCheck: {
      moduleIndex: 0,
      lessonIndex: 0,
      questions: [
        {
          type: "true_false",
          prompt: "CipherLend uses Arcium for confidential lending logic.",
          correctAnswer: 0,
          conceptSlug: "ecosystem-basics",
        },
        {
          type: "single_select",
          prompt:
            "What is intentionally not exposed as sensitive personal position math?",
          answerOptions: [
            "That markets exist",
            "Fine-grained health ratios used in confidential checks",
            "The product name",
            "That Solana wallets exist",
          ],
          correctAnswer: 1,
          conceptSlug: "security-and-privacy",
        },
      ],
    },
  },
  {
    slug: "borrowing-privately-on-cipherlend",
    title: "Borrowing Privately on CipherLend",
    summary:
      "A practical walkthrough of collateral, health, and taking your first private borrow without leaking strategy.",
    description:
      "Go deeper into CipherLend borrowing: how collateral works, what health means when computation is confidential, and how to confirm a borrow safely.",
    level: "intermediate",
    courseType: "product_onboarding",
    estimatedDuration: 40,
    learningOutcomes: [
      "Choose appropriate collateral for a first borrow",
      "Interpret health and liquidation risk in plain language",
      "Complete a borrow confirmation flow safely",
      "Know when to repay or top up collateral",
    ],
    thumbnailUrl: IMAGES.courseBorrow,
    modules: [
      {
        title: "Collateral and health",
        lessons: [
          {
            title: "Choosing collateral",
            estimatedDuration: 8,
            conceptSlug: "integration-patterns",
            content: `# Choosing collateral

Collateral backs your borrow. CipherLend evaluates risk with **confidential health checks** so the market can stay safe without publishing your exact ratio to everyone watching the chain.

## Practical tips

- Prefer collateral you already understand.
- Leave a buffer — do not borrow to the absolute maximum.
- Revisit health after market moves.`,
          },
          {
            title: "Reading health without leaking strategy",
            estimatedDuration: 8,
            conceptSlug: "security-and-privacy",
            content: `## What “health” means here

Health is a score of how safe your position is relative to liquidation rules. On CipherLend, sensitive inputs can stay encrypted while the network still enforces those rules.

## What you should monitor

- Buffer above the liquidation threshold
- Oracle / market volatility for your collateral
- Upcoming debt interest effects on health`,
          },
        ],
      },
      {
        title: "Confirming a borrow",
        lessons: [
          {
            title: "The borrow confirmation loop",
            estimatedDuration: 10,
            conceptSlug: "developer-workflow",
            content: `## Confirm carefully

1. Review amount, asset, and estimated health impact.
2. Confirm the disclosure — which inputs stay encrypted.
3. Sign / confirm in your wallet.
4. Wait for confirmation, then verify the position summary in-app.

## After you borrow

Set a reminder to check health after large market moves. Repay or add collateral early rather than waiting for liquidation.`,
          },
          {
            title: "Repay and exit cleanly",
            estimatedDuration: 7,
            conceptSlug: "production-readiness",
            content: `## Clean exits

- Repay debt before withdrawing all collateral when required by market rules.
- Confirm balances after each step.
- Keep a record of wallet activity for your own bookkeeping.

You are ready to practice the full lend/borrow loop with confidence.`,
          },
        ],
      },
    ],
    passThreshold: 70,
    questions: [
      {
        type: "multi_select",
        prompt:
          "Before confirming a borrow, review which of the following? (Select all.)",
        answerOptions: [
          "Amount",
          "Asset",
          "Health impact",
          "Someone else’s seed phrase",
        ],
        correctAnswers: [0, 1, 2],
        conceptSlug: "developer-workflow",
      },
      {
        type: "matching",
        prompt: "Match the action to its purpose.",
        leftItems: ["Leave a buffer", "Read disclosure", "Repay early"],
        answerOptions: [
          "Know what stays encrypted",
          "Reduce liquidation pressure",
          "Absorb market moves",
        ],
        correctMatches: [2, 0, 1],
        conceptSlug: "collateral-health",
      },
      {
        type: "image_select",
        prompt: "Which outcome best describes confidential health checks?",
        mediaUrl: IMAGES.questionMedia,
        answerOptions: [
          "Publish every ratio publicly",
          "Enforce risk rules while keeping sensitive inputs private",
          "Delete wallets after each borrow",
          "Replace interest with lottery tickets",
        ],
        correctAnswer: 1,
        conceptSlug: "security-and-privacy",
      },
      {
        type: "ordering",
        prompt: "Order the borrow confirmation loop.",
        answerOptions: [
          "Review amount, asset, health impact",
          "Confirm privacy disclosure",
          "Sign in wallet",
          "Verify in-app position summary",
        ],
        correctOrder: [0, 1, 2, 3],
        conceptSlug: "developer-workflow",
      },
    ],
    badge: {
      name: "Private Borrower",
      description: "Completed Borrowing Privately on CipherLend.",
      imageUrl: IMAGES.badgeBorrower,
    },
  },
  {
    slug: "managing-risk-on-cipherlend",
    title: "Managing Risk on CipherLend",
    summary:
      "Learn buffers, volatility, liquidation avoidance, and how confidential health checks change the way you manage borrow risk.",
    description:
      "Intermediate course for active borrowers and lenders. Covers health buffers, market moves, repayment timing, and reading risk without relying on public position leaks.",
    level: "intermediate",
    courseType: "product_onboarding",
    estimatedDuration: 45,
    learningOutcomes: [
      "Set a personal health buffer policy",
      "Respond to volatility without panic",
      "Plan repayments and top-ups",
      "Explain confidential liquidation in plain language",
    ],
    thumbnailUrl: IMAGES.courseRisk,
    modules: [
      {
        title: "Buffers and volatility",
        lessons: [
          {
            title: "Building a health buffer habit",
            estimatedDuration: 8,
            conceptSlug: "collateral-health",
            content:
              "# Building a health buffer habit\n\nBorrow less than the protocol maximum. Treat the gap as your **personal buffer** against oracle moves and interest accrual.\n\n## Rule of thumb\n\nStart with a buffer you would still be comfortable defending after a 10–20% adverse move in collateral value.",
          },
          {
            title: "What volatility does to health",
            estimatedDuration: 8,
            conceptSlug: "collateral-health",
            mediaUrl: IMAGES.lessonMedia,
            content:
              "## Volatility checklist\n\n- Collateral price drops → health falls\n- Debt asset rises vs collateral → health falls\n- Interest accrues → health slowly decays\n\nConfidential markets still obey these physics — privacy does not remove market risk.",
          },
        ],
      },
      {
        title: "Liquidation and recovery",
        lessons: [
          {
            title: "Confidential liquidation without panic",
            estimatedDuration: 9,
            conceptSlug: "confidential-liquidation",
            content:
              "# Confidential liquidation\n\nLiquidation can be enforced using encrypted inputs so the market stays solvent **without broadcasting your exact ratio** to opportunistic searchers.\n\n## Your job\n\nKeep a buffer. Top up early. Repay before you are forced.",
          },
          {
            title: "Top-up and repay playbook",
            estimatedDuration: 8,
            conceptSlug: "production-readiness",
            content:
              "## When health dips\n\n1. Pause new borrows\n2. Add collateral or repay debt\n3. Re-check the post-action summary\n4. Only then resume normal use\n\nPracticing this loop is more valuable than memorizing every parameter.",
          },
        ],
      },
    ],
    passThreshold: 70,
    questions: [
      {
        type: "true_false",
        prompt: "Privacy removes market risk for borrowers on CipherLend.",
        correctAnswer: 1,
        explanation:
          "False — confidential computation hides sensitive math; markets can still move against you.",
        conceptSlug: "security-and-privacy",
      },
      {
        type: "multi_select",
        prompt:
          "Which actions can improve a stressed position? (Select all that apply.)",
        answerOptions: [
          "Add collateral",
          "Repay part of the debt",
          "Ignore health for a week",
          "Borrow the absolute maximum immediately",
        ],
        correctAnswers: [0, 1],
        conceptSlug: "collateral-health",
      },
      {
        type: "ordering",
        prompt: "Put the recovery steps in the best order when health dips.",
        answerOptions: [
          "Pause new borrows",
          "Add collateral or repay debt",
          "Re-check the post-action summary",
          "Resume normal use",
        ],
        correctOrder: [0, 1, 2, 3],
        conceptSlug: "production-readiness",
      },
      {
        type: "fill_blank",
        prompt:
          "The gap between your position and the protocol maximum is your personal ___.",
        acceptableAnswers: ["buffer", "health buffer", "safety buffer"],
        conceptSlug: "collateral-health",
      },
    ],
    badge: {
      name: "Risk Manager",
      description: "Completed Managing Risk on CipherLend.",
      imageUrl: IMAGES.badgeRisk,
    },
    lessonKnowledgeCheck: {
      moduleIndex: 0,
      lessonIndex: 0,
      questions: [
        {
          type: "true_false",
          prompt:
            "A personal buffer is still useful even when health checks are confidential.",
          correctAnswer: 0,
          conceptSlug: "collateral-health",
        },
        {
          type: "scenario_select",
          prompt:
            "Collateral drops 15% overnight. You still have room above liquidation. Best first move?",
          answerOptions: [
            "Open a larger borrow to average down",
            "Pause new borrows and review buffer / top-up options",
            "Share your exact ratio in a public chat",
            "Disable wallet signatures forever",
          ],
          correctAnswer: 1,
          conceptSlug: "collateral-health",
        },
      ],
    },
  },
  {
    slug: "cipherlend-skills-assessment",
    title: "CipherLend Skills Assessment",
    summary:
      "A short advanced assessment covering wallet safety, privacy disclosures, health, and the end-to-end borrow loop — every quiz format included.",
    description:
      "Capstone-style course with concise lessons and a final quiz that uses every Arcademy question type. Ideal for partners validating learner readiness.",
    level: "advanced",
    courseType: "builder_intro",
    estimatedDuration: 30,
    learningOutcomes: [
      "Demonstrate CipherLend vocabulary under assessment conditions",
      "Order the safe borrow loop correctly",
      "Match privacy concepts to product behaviors",
      "Fill in key terms accurately",
    ],
    thumbnailUrl: IMAGES.courseSkills,
    modules: [
      {
        title: "Assessment prep",
        lessons: [
          {
            title: "What this assessment covers",
            estimatedDuration: 5,
            conceptSlug: "ecosystem-basics",
            content:
              "# Assessment prep\n\nYou will be tested on foundations, privacy, borrowing, and risk. Skim prior courses if anything feels fuzzy.\n\nTopics: wallet identity, disclosures, collateral health, confidential liquidation, and the confirm → monitor loop.",
          },
          {
            title: "How to take the quiz",
            estimatedDuration: 4,
            conceptSlug: "developer-workflow",
            content:
              "## Tips\n\n- Read each prompt fully — formats differ (match, order, fill-blank, multi-select).\n- Use the image where provided.\n- Passing still requires the published threshold.",
          },
        ],
      },
    ],
    passThreshold: 75,
    questions: [
      {
        type: "single_select",
        prompt:
          "On Arcademy and CipherLend, what anchors your learner identity?",
        answerOptions: [
          "Email/password",
          "Solana wallet",
          "Phone number only",
          "Discord username only",
        ],
        correctAnswer: 1,
        conceptSlug: "ecosystem-basics",
      },
      {
        type: "true_false",
        prompt: "Signing a wallet message to connect always transfers SOL.",
        correctAnswer: 1,
        explanation:
          "False — message signatures prove ownership and do not move funds.",
        conceptSlug: "developer-workflow",
      },
      {
        type: "image_select",
        prompt:
          "Which statement best matches a confidential lending product UI disclosure?",
        mediaUrl: IMAGES.questionMedia,
        answerOptions: [
          "All position math is posted to a public leaderboard",
          "Sensitive health inputs can stay encrypted while rules are still enforced",
          "Wallets are optional",
          "Liquidations never happen",
        ],
        correctAnswer: 1,
        conceptSlug: "security-and-privacy",
      },
      {
        type: "scenario_select",
        prompt:
          "Alex wants a first borrow, understands disclosures, and has a healthy buffer. What should they do next?",
        answerOptions: [
          "Confirm amount, asset, health impact, then sign",
          "Paste their seed phrase into the dapp chat",
          "Borrow max with zero buffer",
          "Skip the wallet connection forever",
        ],
        correctAnswer: 0,
        conceptSlug: "developer-workflow",
      },
      {
        type: "multi_select",
        prompt: "Select all accurate statements about CipherLend.",
        answerOptions: [
          "It is a confidential lending market",
          "It can reduce front-running via encrypted position details",
          "It eliminates all smart-contract risk",
          "Solana wallet identity is used for learning progress on Arcademy",
        ],
        correctAnswers: [0, 1, 3],
        conceptSlug: "ecosystem-basics",
      },
      {
        type: "ordering",
        prompt: "Order the safe first-borrow loop.",
        answerOptions: [
          "Connect wallet",
          "Review disclosure and size",
          "Confirm borrow",
          "Monitor health after confirmation",
        ],
        correctOrder: [0, 1, 2, 3],
        conceptSlug: "integration-patterns",
      },
      {
        type: "matching",
        prompt: "Match each concept to the best description.",
        leftItems: ["Buffer", "Disclosure", "Liquidation", "Wallet signature"],
        answerOptions: [
          "Shows what stays private vs public",
          "Safety gap under the protocol max",
          "Forced position close when unhealthy",
          "Free proof of wallet control",
        ],
        correctMatches: [1, 0, 2, 3],
        conceptSlug: "collateral-health",
      },
      {
        type: "fill_blank",
        prompt: "CipherLend is a confidential ___ market on Arcium.",
        acceptableAnswers: [
          "lending",
          "lend",
          "borrow/lend",
          "borrow and lend",
        ],
        conceptSlug: "ecosystem-basics",
      },
    ],
    badge: {
      name: "CipherLend Specialist",
      description: "Passed the CipherLend Skills Assessment.",
      imageUrl: IMAGES.badgeSkills,
    },
  },
];

function questionCreateData(q: SeedQuestion, order: number) {
  const type: QuestionType = q.type ?? "single_select";
  const answerOptions =
    type === "true_false"
      ? [...TRUE_FALSE_OPTIONS]
      : type === "fill_blank"
        ? []
        : (q.answerOptions ?? []);

  return {
    type,
    prompt: q.prompt,
    mediaUrl:
      type === "image_select" ? (q.mediaUrl ?? IMAGES.questionMedia) : null,
    answerOptions,
    leftItems: type === "matching" ? (q.leftItems ?? []) : [],
    correctAnswer: q.correctAnswer ?? 0,
    correctAnswers: type === "multi_select" ? (q.correctAnswers ?? []) : [],
    correctOrder:
      type === "ordering"
        ? (q.correctOrder ?? answerOptions.map((_, i) => i))
        : [],
    correctMatches: type === "matching" ? (q.correctMatches ?? []) : [],
    acceptableAnswers: type === "fill_blank" ? (q.acceptableAnswers ?? []) : [],
    explanation: q.explanation ?? null,
    order,
  };
}

const CONVERSIONS = [
  {
    key: "first_deposit",
    label: "First deposit",
    eventName: "partner.cipherlend.first_deposit",
    description: "Learner completes their first lend deposit in CipherLend.",
  },
  {
    key: "first_borrow",
    label: "First borrow",
    eventName: "partner.cipherlend.first_borrow",
    description: "Learner confirms their first borrow.",
  },
  {
    key: "markets_viewed",
    label: "Markets viewed",
    eventName: "partner.cipherlend.markets_viewed",
    description: "Opened the live markets screen from learning CTAs.",
  },
];

function asInputJson(
  value: Record<string, unknown> | unknown[]
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function ensureAnalyticsSuite(prisma: PrismaClient, productId: string) {
  const pack: AnalyticsPackManifest = DEVELOPER_EDUCATION_PACK;
  const existing = await prisma.analyticsProfile.findUnique({
    where: { productId },
  });

  if (!existing) {
    await prisma.$transaction(async (tx) => {
      await tx.analyticsProfile.create({
        data: {
          productId,
          schemaVersion: 1,
          terminology: asInputJson({
            learnerLabel: "Borrower",
            readinessLabel: "Lending Readiness",
            certificationLabel: "CipherLend Certification",
            badgeLabel: "Badge",
          }),
          kpiSet: pack.kpiSet,
          funnelStages: pack.funnelStages,
          sectionVisibility: pack.sectionVisibility,
          recommendationPolicy: asInputJson(
            (pack.recommendationThresholds ??
              {}) as unknown as Record<string, unknown>
          ),
          enabledProviderIds: pack.enabledProviderIds,
          featureFlags: asInputJson({
            mockPartnerSeed: true,
            showPartnerConversions: true,
          }),
        },
      });

      await tx.analyticsPackInstall.create({
        data: {
          productId,
          packId: pack.id,
          packVersion: pack.version,
        },
      });

      for (const cat of pack.skillCategories) {
        await tx.skillCategory.create({
          data: {
            productId,
            slug: cat.slug,
            name: cat.name,
            sortOrder: cat.order,
          },
        });
      }

      const categories = await tx.skillCategory.findMany({ where: { productId } });
      const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

      for (const concept of pack.starterConcepts) {
        await tx.concept.create({
          data: {
            productId,
            slug: concept.slug,
            name: concept.name,
            description: concept.description ?? null,
            category: concept.category ?? null,
            skillCategoryId: concept.category
              ? (categoryBySlug.get(concept.category) ?? null)
              : null,
            importance: concept.importance ?? "core",
          },
        });
      }

      // Partner-specific concepts beyond the default pack.
      const fundamentalsId = categoryBySlug.get("fundamentals") ?? null;
      await tx.concept.create({
        data: {
          productId,
          slug: "collateral-health",
          name: "Collateral health",
          description:
            "Understanding buffers, liquidation risk, and confidential health checks.",
          category: "fundamentals",
          skillCategoryId: fundamentalsId,
          importance: "critical",
        },
      });
      await tx.concept.create({
        data: {
          productId,
          slug: "confidential-liquidation",
          name: "Confidential liquidation",
          description:
            "How liquidation can be enforced without leaking private position math.",
          category: "fundamentals",
          skillCategoryId: fundamentalsId,
          importance: "core",
        },
      });

      const readiness = pack.readiness ?? DEFAULT_LEARNING_READINESS;
      await tx.readinessModel.create({
        data: {
          productId,
          name: "Lending Readiness",
          description:
            "CipherLend-tuned readiness: course completion, quiz performance, concept mastery, and path progress.",
          requirements: asInputJson([
            { type: "course_completion", weight: 0.3 },
            { type: "quiz_performance", weight: 0.25 },
            { type: "concept_mastery", weight: 0.25 },
            { type: "required_path_completion", weight: 0.1 },
            { type: "partner_conversion_events", weight: 0.1 },
          ]),
          levels: asInputJson([
            { id: "exploring", label: "Exploring", minScore: 0 },
            { id: "practicing", label: "Practicing", minScore: 35 },
            { id: "ready", label: "Market ready", minScore: 70 },
          ]),
          readyThreshold: readiness.readyThreshold,
          isDefault: true,
        },
      });
    });
    console.log("✓ Analytics profile + Developer Education pack seeded");
  } else {
    await prisma.analyticsProfile.update({
      where: { productId },
      data: {
        terminology: asInputJson({
          learnerLabel: "Borrower",
          readinessLabel: "Lending Readiness",
          certificationLabel: "CipherLend Certification",
          badgeLabel: "Badge",
        }),
        featureFlags: asInputJson({
          mockPartnerSeed: true,
          showPartnerConversions: true,
        }),
      },
    });

    await prisma.analyticsPackInstall.upsert({
      where: {
        productId_packId: { productId, packId: pack.id },
      },
      create: {
        productId,
        packId: pack.id,
        packVersion: pack.version,
      },
      update: { packVersion: pack.version },
    });

    const readinessCount = await prisma.readinessModel.count({
      where: { productId },
    });
    if (readinessCount === 0) {
      await prisma.readinessModel.create({
        data: {
          productId,
          name: "Lending Readiness",
          description: DEFAULT_LEARNING_READINESS.description,
          requirements: asInputJson(DEFAULT_LEARNING_READINESS.requirements),
          levels: asInputJson(DEFAULT_LEARNING_READINESS.levels),
          readyThreshold: DEFAULT_LEARNING_READINESS.readyThreshold,
          isDefault: true,
        },
      });
    }
    console.log("✓ Analytics profile updated (already existed)");
  }

  for (const conversion of CONVERSIONS) {
    await prisma.conversionDefinition.upsert({
      where: {
        productId_key: { productId, key: conversion.key },
      },
      create: { productId, ...conversion },
      update: {
        label: conversion.label,
        eventName: conversion.eventName,
        description: conversion.description,
      },
    });
  }
  console.log(`✓ Conversion definitions: ${CONVERSIONS.length}`);

  await prisma.learningObjective.upsert({
    where: {
      productId_slug: { productId, slug: "safe-first-borrow" },
    },
    create: {
      productId,
      slug: "safe-first-borrow",
      name: "Complete a safe first borrow",
      description:
        "Learner can choose collateral, interpret health, and confirm a borrow with disclosures understood.",
    },
    update: {
      name: "Complete a safe first borrow",
      description:
        "Learner can choose collateral, interpret health, and confirm a borrow with disclosures understood.",
    },
  });
}

async function seedCourse(
  prisma: PrismaClient,
  productId: string,
  c: SeedCourse,
  conceptsBySlug: Map<string, string>
) {
  const existing = await prisma.course.findUnique({
    where: { productId_slug: { productId, slug: c.slug } },
  });
  if (existing) {
    await prisma.course.delete({ where: { id: existing.id } });
  }

  const course = await prisma.course.create({
    data: {
      productId,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      description: c.description,
      level: c.level,
      courseType: c.courseType,
      status: "published",
      estimatedDuration: c.estimatedDuration,
      learningOutcomes: c.learningOutcomes,
      thumbnailUrl: c.thumbnailUrl,
    },
  });

  let lessonOrder = 0;
  const createdLessons: { id: string; moduleIndex: number; lessonIndex: number }[] =
    [];

  for (let mi = 0; mi < c.modules.length; mi++) {
    const mod = c.modules[mi];
    const moduleRow = await prisma.module.create({
      data: {
        courseId: course.id,
        title: mod.title,
        description: mod.description ?? null,
        order: mi,
      },
    });

    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li];
      const lessonRow = await prisma.lesson.create({
        data: {
          courseId: course.id,
          moduleId: moduleRow.id,
          title: lesson.title,
          content: lesson.content,
          order: lessonOrder,
          status: "published",
          required: true,
          estimatedDuration: lesson.estimatedDuration ?? null,
          mediaUrl: lesson.mediaUrl ?? null,
        },
      });
      createdLessons.push({
        id: lessonRow.id,
        moduleIndex: mi,
        lessonIndex: li,
      });

      if (lesson.conceptSlug) {
        const conceptId = conceptsBySlug.get(lesson.conceptSlug);
        if (conceptId) {
          await prisma.contentConceptTag.create({
            data: {
              conceptId,
              lessonId: lessonRow.id,
              weight: 1,
              importance: "core",
            },
          });
        }
      }
      lessonOrder += 1;
    }
  }

  if (c.lessonKnowledgeCheck) {
    const target = createdLessons.find(
      (l) =>
        l.moduleIndex === c.lessonKnowledgeCheck!.moduleIndex &&
        l.lessonIndex === c.lessonKnowledgeCheck!.lessonIndex
    );
    if (target) {
      const checkQuiz = await prisma.quiz.create({
        data: {
          courseId: course.id,
          lessonId: target.id,
          title: "Knowledge check",
          passThreshold: 70,
          status: "published",
          type: "lesson_knowledge_check",
        },
      });
      for (let i = 0; i < c.lessonKnowledgeCheck.questions.length; i++) {
        const q = c.lessonKnowledgeCheck.questions[i];
        const question = await prisma.question.create({
          data: {
            quizId: checkQuiz.id,
            ...questionCreateData(q, i),
          },
        });
        if (q.conceptSlug) {
          const conceptId = conceptsBySlug.get(q.conceptSlug);
          if (conceptId) {
            await prisma.contentConceptTag.create({
              data: { conceptId, questionId: question.id, weight: 1 },
            });
          }
        }
      }
    }
  }

  const quiz = await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: `${c.title} — Final Quiz`,
      passThreshold: c.passThreshold,
      status: "published",
      type: "final_course_quiz",
    },
  });

  for (let i = 0; i < c.questions.length; i++) {
    const q = c.questions[i];
    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        ...questionCreateData(q, i),
      },
    });
    if (q.conceptSlug) {
      const conceptId = conceptsBySlug.get(q.conceptSlug);
      if (conceptId) {
        await prisma.contentConceptTag.create({
          data: { conceptId, questionId: question.id, weight: 1 },
        });
      }
    }
  }

  await prisma.badge.create({
    data: {
      courseId: course.id,
      name: c.badge.name,
      description: c.badge.description,
      imageUrl: c.badge.imageUrl,
      criteria: "Complete all required lessons and pass the final quiz.",
      issuer: "CipherLend",
      status: "published",
    },
  });

  console.log(`✓ Course: ${c.title}`);
  return course;
}

export async function seedMockPartner(prisma: PrismaClient) {
  const owner = await prisma.user.upsert({
    where: { walletAddress: OWNER_WALLET },
    update: {
      displayName: "Cipher Labs (Owner)",
    },
    create: {
      walletAddress: OWNER_WALLET,
      displayName: "Cipher Labs (Owner)",
      role: "learner",
    },
  });
  console.log(`✓ Owner user: ${owner.walletAddress}`);

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: {
      name: "CipherLend",
      description:
        "Peer-to-peer lending with encrypted collateral ratios and private liquidation logic, reducing MEV and front-running on borrow/lend flows.",
      logoUrl: IMAGES.logo,
      bannerUrl: IMAGES.banner,
      category: "DeFi & Trading",
      role: "ecosystem",
      partnerName: "Cipher Labs",
      referralUrl: "https://example.com/cipherlend?ref=arcademy",
      partnerAnalyticsNotes:
        "Track first deposit and first borrow as primary activations. Funnel priority: course → wallet → markets → first private action.",
      learningOutcomes: [
        "Understand confidential lending",
        "Borrow and lend without leaking strategy",
        "Monitor health with private computation",
      ],
      links: [
        { label: "Website", url: "https://example.com/cipherlend" },
        { label: "Docs", url: "https://docs.example.com/cipherlend" },
        { label: "X", url: "https://x.com/cipherlend" },
      ],
      featured: true,
      featuredOrder: 2,
      status: "published",
    },
    create: {
      id: PRODUCT_ID,
      name: "CipherLend",
      slug: PRODUCT_SLUG,
      description:
        "Peer-to-peer lending with encrypted collateral ratios and private liquidation logic, reducing MEV and front-running on borrow/lend flows.",
      logoUrl: IMAGES.logo,
      bannerUrl: IMAGES.banner,
      category: "DeFi & Trading",
      role: "ecosystem",
      partnerName: "Cipher Labs",
      referralUrl: "https://example.com/cipherlend?ref=arcademy",
      partnerAnalyticsNotes:
        "Track first deposit and first borrow as primary activations. Funnel priority: course → wallet → markets → first private action.",
      learningOutcomes: [
        "Understand confidential lending",
        "Borrow and lend without leaking strategy",
        "Monitor health with private computation",
      ],
      links: [
        { label: "Website", url: "https://example.com/cipherlend" },
        { label: "Docs", url: "https://docs.example.com/cipherlend" },
        { label: "X", url: "https://x.com/cipherlend" },
      ],
      featured: true,
      featuredOrder: 2,
      status: "published",
    },
  });
  console.log(`✓ Product / project: ${product.name} (${product.id})`);

  await prisma.projectAdmin.upsert({
    where: {
      productId_userId: { productId: product.id, userId: owner.id },
    },
    create: {
      productId: product.id,
      userId: owner.id,
      role: "owner",
    },
    update: { role: "owner" },
  });
  console.log("✓ ProjectAdmin owner assigned");

  const existingIntake = await prisma.partnerIntake.findFirst({
    where: {
      applicantUserId: owner.id,
      projectName: "CipherLend",
    },
  });
  if (existingIntake) {
    await prisma.partnerIntake.update({
      where: { id: existingIntake.id },
      data: {
        productId: product.id,
        partnerName: "Cipher Labs",
        contactName: "Cipher Labs Partner Lead",
        contactEmail: "partners@cipherlend.example",
        contactX: "@cipherlend",
        contactDiscord: "cipherlend",
        contactTelegram: "@cipherlend",
        preferredContactMethod: "email",
        projectName: "CipherLend",
        projectDescription: product.description,
        officialWebsite: "https://cipherlend.example",
        officialX: "@cipherlend",
        officialDiscord: "https://discord.gg/cipherlend",
        officialTelegram: "https://t.me/cipherlend",
        sourceMaterialUrl: "https://docs.example.com/cipherlend",
        requestedCourseTopic: "Confidential lending onboarding",
        reviewStatus: "approved",
        notes: "Mock partner intake for local/demo seeding.",
      },
    });
  } else {
    await prisma.partnerIntake.create({
      data: {
        productId: product.id,
        applicantUserId: owner.id,
        partnerName: "Cipher Labs",
        contactName: "Cipher Labs Partner Lead",
        contactEmail: "partners@cipherlend.example",
        contactX: "@cipherlend",
        contactDiscord: "cipherlend",
        contactTelegram: "@cipherlend",
        preferredContactMethod: "email",
        projectName: "CipherLend",
        projectDescription: product.description,
        officialWebsite: "https://cipherlend.example",
        officialX: "@cipherlend",
        officialDiscord: "https://discord.gg/cipherlend",
        officialTelegram: "https://t.me/cipherlend",
        sourceMaterialUrl: "https://docs.example.com/cipherlend",
        requestedCourseTopic: "Confidential lending onboarding",
        reviewStatus: "approved",
        notes: "Mock partner intake for local/demo seeding.",
      },
    });
  }
  console.log("✓ Partner intake (approved)");

  await ensureAnalyticsSuite(prisma, product.id);

  const concepts = await prisma.concept.findMany({
    where: { productId: product.id },
    select: { id: true, slug: true },
  });
  const conceptsBySlug = new Map(concepts.map((c) => [c.slug, c.id]));

  // Ensure partner-specific concepts exist even if analytics profile predated this seed.
  for (const extra of [
    {
      slug: "collateral-health",
      name: "Collateral health",
      description:
        "Understanding buffers, liquidation risk, and confidential health checks.",
      importance: "critical" as const,
    },
    {
      slug: "confidential-liquidation",
      name: "Confidential liquidation",
      description:
        "How liquidation can be enforced without leaking private position math.",
      importance: "core" as const,
    },
  ]) {
    if (!conceptsBySlug.has(extra.slug)) {
      const fundamentals = await prisma.skillCategory.findUnique({
        where: {
          productId_slug: { productId: product.id, slug: "fundamentals" },
        },
      });
      const row = await prisma.concept.create({
        data: {
          productId: product.id,
          slug: extra.slug,
          name: extra.name,
          description: extra.description,
          category: "fundamentals",
          skillCategoryId: fundamentals?.id ?? null,
          importance: extra.importance,
        },
      });
      conceptsBySlug.set(row.slug, row.id);
    }
  }

  const seededCourses = [];
  for (const course of COURSES) {
    seededCourses.push(
      await seedCourse(prisma, product.id, course, conceptsBySlug)
    );
  }

  const path = await prisma.learningPath.upsert({
    where: {
      productId_slug: { productId: product.id, slug: "cipherlend-onboarding" },
    },
    update: {
      title: "CipherLend onboarding",
      description:
        "From foundations to your first private borrow — the recommended path for new CipherLend users.",
      status: "published",
      order: 0,
    },
    create: {
      productId: product.id,
      slug: "cipherlend-onboarding",
      title: "CipherLend onboarding",
      description:
        "From foundations to your first private borrow — the recommended path for new CipherLend users.",
      status: "published",
      order: 0,
    },
  });

  await prisma.learningPathCourse.deleteMany({ where: { pathId: path.id } });
  await prisma.learningPathCourse.createMany({
    data: seededCourses.map((course, order) => ({
      pathId: path.id,
      courseId: course.id,
      order,
    })),
  });
  console.log(`✓ Learning path: ${path.title}`);

  const welcome = seededCourses.find((c) => c.slug === COURSES[0].slug);
  const borrow = seededCourses.find((c) => c.slug === COURSES[1].slug);

  await prisma.certification.upsert({
    where: {
      productId_slug: { productId: product.id, slug: "cipherlend-ready" },
    },
    update: {
      name: "CipherLend Ready",
      description:
        "Demonstrates foundations and private borrowing fluency for CipherLend.",
      imageUrl: IMAGES.certification,
      status: "published",
      readyThreshold: 70,
    },
    create: {
      productId: product.id,
      slug: "cipherlend-ready",
      name: "CipherLend Ready",
      description:
        "Demonstrates foundations and private borrowing fluency for CipherLend.",
      imageUrl: IMAGES.certification,
      status: "published",
      readyThreshold: 70,
    },
  });

  const certification = await prisma.certification.findUniqueOrThrow({
    where: {
      productId_slug: { productId: product.id, slug: "cipherlend-ready" },
    },
  });

  await prisma.certificationRequirement.deleteMany({
    where: { certificationId: certification.id },
  });

  const reqData: Prisma.CertificationRequirementCreateManyInput[] = [];
  if (welcome) {
    reqData.push({
      certificationId: certification.id,
      type: "course_completion",
      label: "Complete Welcome to CipherLend",
      config: { courseId: welcome.id },
      weight: 1,
      sortOrder: 0,
    });
  }
  if (borrow) {
    reqData.push({
      certificationId: certification.id,
      type: "course_completion",
      label: "Complete Borrowing Privately",
      config: { courseId: borrow.id },
      weight: 1,
      sortOrder: 1,
    });
  }
  reqData.push({
    certificationId: certification.id,
    type: "readiness_score",
    label: "Reach Market ready readiness",
    config: { minReadinessScore: 70 },
    weight: 1,
    sortOrder: 2,
  });
  reqData.push({
    certificationId: certification.id,
    type: "conversion_event",
    label: "Complete first borrow (partner conversion)",
    config: { conversionKey: "first_borrow" },
    weight: 1,
    sortOrder: 3,
  });

  await prisma.certificationRequirement.createMany({ data: reqData });
  console.log("✓ Certification: CipherLend Ready");

  // Link (or refresh) ecosystem directory entry → learning product.
  await prisma.ecosystemDirectoryEntry.upsert({
    where: { slug: PRODUCT_SLUG },
    create: {
      slug: PRODUCT_SLUG,
      productId: product.id,
      name: "CipherLend",
      tagline: "Confidential lending markets",
      description: product.description,
      logoUrl: IMAGES.logo,
      categoryId: "defi",
      networkStatus: "testnet",
      featured: true,
      trending: true,
      tags: ["lending", "defi", "mock-partner"],
      links: {
        website: "https://example.com/cipherlend",
        docs: "https://docs.example.com/cipherlend",
        twitter: "https://x.com/cipherlend",
      },
      relationships: [
        { targetId: "arcium-sdk", type: "sdk" },
        { targetId: "shieldswap", type: "partnership" },
      ],
      addedAt: new Date("2024-08-05"),
    },
    update: {
      productId: product.id,
      name: "CipherLend",
      tagline: "Confidential lending markets",
      description: product.description,
      logoUrl: IMAGES.logo,
      categoryId: "defi",
      featured: true,
      trending: true,
      tags: ["lending", "defi", "mock-partner"],
      links: {
        website: "https://example.com/cipherlend",
        docs: "https://docs.example.com/cipherlend",
        twitter: "https://x.com/cipherlend",
      },
    },
  });
  console.log("✓ Ecosystem directory linked to product");

  const { seedMockPartnerActivity } = await import(
    "./seed-mock-partner-activity"
  );
  const activity = await seedMockPartnerActivity(prisma);

  return {
    ownerWallet: OWNER_WALLET,
    productId: product.id,
    productSlug: product.slug,
    courseCount: seededCourses.length,
    activity,
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
    const result = await seedMockPartner(prisma);
    console.log("\nMock partner seed complete:");
    console.log(`  product: ${result.productSlug} (${result.productId})`);
    console.log(`  owner:   ${result.ownerWallet}`);
    console.log(`  courses: ${result.courseCount}`);
    if (result.activity) {
      console.log(
        `  activity: ${result.activity.courseCompletions} completions / ${result.activity.quizAttempts} quiz attempts / ${result.activity.learners} learners`
      );
    }
    console.log(`  console: /partner-console/${result.productId}`);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = /seed-mock-partner\.(ts|js|mjs|cjs)$/.test(
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
