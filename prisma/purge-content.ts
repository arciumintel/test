import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

neonConfig.webSocketConstructor = ws;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  if (url.includes("connect_timeout=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=30`;
}

const adapter = new PrismaNeon({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const counts = await prisma.$transaction(async (tx) => {
    const results: Record<string, number> = {};

    results.discordRoleGrant = (await tx.discordRoleGrant.deleteMany()).count;
    results.discordRoleRule = (await tx.discordRoleRule.deleteMany()).count;
    results.badgeAward = (await tx.badgeAward.deleteMany()).count;
    results.badge = (await tx.badge.deleteMany()).count;
    results.progress = (await tx.progress.deleteMany()).count;
    results.quizAttempt = (await tx.quizAttempt.deleteMany()).count;
    results.question = (await tx.question.deleteMany()).count;
    results.quiz = (await tx.quiz.deleteMany()).count;
    results.lesson = (await tx.lesson.deleteMany()).count;
    results.module = (await tx.module.deleteMany()).count;
    results.learningPathCourse = (await tx.learningPathCourse.deleteMany()).count;
    results.course = (await tx.course.deleteMany()).count;
    results.learningPath = (await tx.learningPath.deleteMany()).count;
    results.partnerIntake = (await tx.partnerIntake.deleteMany()).count;
    results.projectDiscordIntegration = (
      await tx.projectDiscordIntegration.deleteMany()
    ).count;
    results.projectAdmin = (await tx.projectAdmin.deleteMany()).count;
    results.product = (await tx.product.deleteMany()).count;
    results.analyticsEvent = (await tx.analyticsEvent.deleteMany()).count;

    return results;
  });

  console.log("Purged content records:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
