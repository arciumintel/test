import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type CourseLevel } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

type SeedQuestion = {
  prompt: string;
  answerOptions: string[];
  correctAnswer: number;
  explanation?: string;
};

type SeedCourse = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevel;
  estimatedDuration: number;
  learningOutcomes: string[];
  lessons: { title: string; content: string }[];
  passThreshold: number;
  questions: SeedQuestion[];
  badge: { name: string; description: string };
};

const COURSES: SeedCourse[] = [
  {
    slug: "welcome-to-arcium",
    title: "Welcome to Arcium",
    summary:
      "A friendly introduction to Arcium and why privacy-preserving computation matters — no prior crypto knowledge needed.",
    description:
      "This short course explains what Arcium is, why private computation is useful, and how the ecosystem fits together. It's written for newcomers, so we keep the jargon to a minimum and focus on clear ideas you can build on.",
    level: "beginner",
    estimatedDuration: 25,
    learningOutcomes: [
      "Understand what Arcium is in plain language",
      "Explain why privacy-preserving computation matters",
      "Recognize the main pieces of the ecosystem",
      "Know what you can explore next",
    ],
    lessons: [
      {
        title: "What is Arcium?",
        content:
          "# What is Arcium?\n\nArcium is a network for **private computation**. That means programs can use sensitive data to produce results *without exposing the underlying data itself*.\n\nThink of it like a sealed calculator: you can put numbers in and get an answer out, but no one — not even the people running the calculator — can peek at the numbers inside.\n\n## Why this is hard\n\nMost computers need to *see* data to work with it. Arcium uses techniques from cryptography so that computation can happen on data that stays encrypted the whole time.\n\nThat unlocks use cases that were previously impossible to do safely on a shared, public network.",
      },
      {
        title: "Why privacy-preserving computation matters",
        content:
          "## The problem with \"just trust us\"\n\nToday, when you share data with an app, you usually have to trust that the app will handle it responsibly. Sometimes that trust is misplaced.\n\nPrivacy-preserving computation removes the need to trust a middleman with your raw data.\n\n## Real examples\n\n- **Healthcare**: hospitals can compute shared statistics without revealing individual patient records.\n- **Finance**: firms can detect fraud across institutions without exposing customer details.\n- **Voting and governance**: tally results without revealing how each person voted.\n\nThe common thread: **useful results, without giving up the private inputs.**",
      },
      {
        title: "How the ecosystem works",
        content:
          "## The moving pieces\n\nAt a high level, the Arcium ecosystem has three roles:\n\n- **Builders** write programs that run on encrypted data.\n- **The network** runs those programs across many participants so no single party sees everything.\n- **Users** interact with the resulting apps, getting privacy by default.\n\n## Where Solana fits\n\nArcium works closely with the Solana ecosystem. Your **Solana wallet** is your identity here on Arcademy — it's how your learning progress and badges are tied to you, without needing an email or password.",
      },
      {
        title: "What you can do next",
        content:
          "## You've got the big picture\n\nYou now know:\n\n- What Arcium is\n- Why private computation matters\n- How the pieces fit together\n\n## Next steps\n\n- Take the short quiz to earn your first badge.\n- Explore the other courses in the catalog.\n- Connect your Solana wallet (if you haven't already) so your progress is saved.\n\nWelcome aboard — this is just the beginning.",
      },
    ],
    passThreshold: 67,
    questions: [
      {
        prompt: "In one sentence, what does Arcium enable?",
        answerOptions: [
          "Faster internet connections",
          "Computation on data that stays private",
          "Free cryptocurrency for everyone",
          "A new social media network",
        ],
        correctAnswer: 1,
        explanation:
          "Arcium enables computation on data that remains encrypted and private throughout.",
      },
      {
        prompt: "Why is privacy-preserving computation valuable?",
        answerOptions: [
          "It makes data permanently public",
          "It removes the need to trust a middleman with raw data",
          "It deletes all data after use",
          "It only works for video games",
        ],
        correctAnswer: 1,
        explanation:
          "You can get useful results without handing your private inputs to a third party.",
      },
      {
        prompt: "On Arcademy, what serves as your identity?",
        answerOptions: [
          "An email and password",
          "A phone number",
          "Your Solana wallet",
          "A username only",
        ],
        correctAnswer: 2,
        explanation:
          "Your Solana wallet anchors your account, progress, and badges.",
      },
    ],
    badge: {
      name: "Arcium Foundations",
      description: "Awarded for completing Welcome to Arcium.",
    },
  },
  {
    slug: "getting-started-with-private-apps",
    title: "Getting Started with Private Apps",
    summary:
      "A practical, beginner-friendly walkthrough of using a privacy-first app in the Arcium ecosystem.",
    description:
      "This onboarding course is written for new users, not developers. It walks through what a private app does, why it matters to you, how to use one step by step, and the common mistakes beginners make.",
    level: "beginner",
    estimatedDuration: 30,
    learningOutcomes: [
      "Describe what a private app does for you",
      "Connect and use a privacy-first app safely",
      "Avoid common beginner mistakes",
      "Know what a successful outcome looks like",
    ],
    lessons: [
      {
        title: "What the product does",
        content:
          "# What a private app does\n\nA privacy-first app in the Arcium ecosystem lets you do something useful — like sharing data for an analysis or participating in a group decision — **without revealing your private information** to the app or other users.\n\nYou get the benefit of the result while keeping your inputs to yourself.",
      },
      {
        title: "Why it matters to you",
        content:
          "## Why you'd use it\n\n- **You stay in control** of your own data.\n- **No middleman** gets a copy of your sensitive information.\n- **Results are trustworthy** because the computation is verifiable.\n\nThis is the difference between *\"trust me\"* and *\"you don't have to trust me.\"*",
      },
      {
        title: "How to use it, step by step",
        content:
          "## Step by step\n\n1. **Connect your Solana wallet.** This is your identity — no email needed.\n2. **Review what you're sharing.** A good app tells you exactly what stays private.\n3. **Confirm the action.** You'll sign a message to prove it's you. Signing a message is free and does not move any funds.\n4. **Get your result.** The output is computed without exposing your inputs.\n\nThat's the whole loop.",
      },
      {
        title: "Common beginner mistakes",
        content:
          "## Avoid these pitfalls\n\n- **Confusing signing with paying.** Signing a message proves identity and is free. It is not a transaction.\n- **Skipping the review step.** Always read what an app says it will keep private.\n- **Using the wrong wallet.** Make sure you're connected with the wallet you intend to use.\n\n## What success looks like\n\nYou completed an action, got a useful result, and your private data never left your control. That's a win.",
      },
    ],
    passThreshold: 67,
    questions: [
      {
        prompt: "What is the first step to using a private app here?",
        answerOptions: [
          "Create an email account",
          "Connect your Solana wallet",
          "Pay a subscription fee",
          "Download a mobile app",
        ],
        correctAnswer: 1,
        explanation: "Your wallet is your identity — connect it first.",
      },
      {
        prompt: "Is signing a message the same as making a payment?",
        answerOptions: [
          "Yes, it always costs money",
          "No, signing proves identity and is free",
          "Only on weekends",
          "Only for developers",
        ],
        correctAnswer: 1,
        explanation:
          "Signing a message proves you control the wallet and does not move funds.",
      },
      {
        prompt: "What does a successful outcome look like?",
        answerOptions: [
          "Your private data was published publicly",
          "You got a useful result while your private inputs stayed in your control",
          "You gave your password to the app",
          "Nothing happened at all",
        ],
        correctAnswer: 1,
        explanation:
          "The goal is a useful result without giving up your private inputs.",
      },
    ],
    badge: {
      name: "Private Apps Explorer",
      description: "Awarded for completing Getting Started with Private Apps.",
    },
  },
];

const ARCIUM_PRODUCT = {
  id: "product_arcium",
  name: "Arcium",
  slug: "arcium",
  description:
    "Arcium is a network for private computation. Programs can use sensitive data to produce results without exposing the underlying data itself.",
  category: "Privacy Infrastructure",
  partnerName: "Arcium",
  links: [
    { label: "Website", url: "https://arcium.com" },
    { label: "Docs", url: "https://docs.arcium.com" },
    { label: "X", url: "https://x.com/arciumhq" },
  ],
};

async function seedCourse(productId: string, c: SeedCourse) {
  // Reset the course so seeding stays idempotent.
  const existing = await prisma.course.findUnique({
    where: { productId_slug: { productId, slug: c.slug } },
  });
  if (existing) {
    await prisma.lesson.deleteMany({ where: { courseId: existing.id } });
    await prisma.quiz.deleteMany({ where: { courseId: existing.id } });
  }

  const course = await prisma.course.upsert({
    where: { productId_slug: { productId, slug: c.slug } },
    update: {
      title: c.title,
      summary: c.summary,
      description: c.description,
      level: c.level,
      status: "published",
      estimatedDuration: c.estimatedDuration,
      learningOutcomes: c.learningOutcomes,
    },
    create: {
      productId,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      description: c.description,
      level: c.level,
      status: "published",
      estimatedDuration: c.estimatedDuration,
      learningOutcomes: c.learningOutcomes,
    },
  });

  await prisma.lesson.createMany({
    data: c.lessons.map((lesson, i) => ({
      courseId: course.id,
      title: lesson.title,
      content: lesson.content,
      order: i,
      status: "published" as const,
    })),
  });

  const quiz = await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: `${c.title} — Final Quiz`,
      passThreshold: c.passThreshold,
    },
  });

  await prisma.question.createMany({
    data: c.questions.map((q, i) => ({
      quizId: quiz.id,
      prompt: q.prompt,
      answerOptions: q.answerOptions,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? null,
      order: i,
    })),
  });

  await prisma.badge.upsert({
    where: { courseId: course.id },
    update: {
      name: c.badge.name,
      description: c.badge.description,
      criteria: "Complete all required lessons and pass the final quiz.",
      issuer: "Arcademy",
      status: "published",
    },
    create: {
      courseId: course.id,
      name: c.badge.name,
      description: c.badge.description,
      criteria: "Complete all required lessons and pass the final quiz.",
      issuer: "Arcademy",
      status: "published",
    },
  });

  console.log(`✓ Seeded course: ${c.title}`);
}

async function main() {
  const product = await prisma.product.upsert({
    where: { slug: ARCIUM_PRODUCT.slug },
    update: {
      name: ARCIUM_PRODUCT.name,
      description: ARCIUM_PRODUCT.description,
      category: ARCIUM_PRODUCT.category,
      partnerName: ARCIUM_PRODUCT.partnerName,
      links: ARCIUM_PRODUCT.links,
      status: "published",
    },
    create: {
      ...ARCIUM_PRODUCT,
      status: "published",
    },
  });
  console.log(`✓ Seeded product: ${product.name}`);

  for (const c of COURSES) {
    await seedCourse(product.id, c);
  }

  const staffWallets = (process.env.STAFF_ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  for (const wallet of staffWallets) {
    await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: { role: "staff_admin" },
      create: { walletAddress: wallet, role: "staff_admin" },
    });
    console.log(`✓ Staff admin: ${wallet}`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
