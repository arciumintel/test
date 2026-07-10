// One-off/maintenance utility: rebuild AnalyticsDailyRollup from historical
// AnalyticsEvent rows. Usage: pnpm analytics:backfill [--days 3650]
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

const daysFlagIndex = process.argv.indexOf("--days");
const lookbackDays =
  daysFlagIndex >= 0 ? Number.parseInt(process.argv[daysFlagIndex + 1], 10) : 3650;

if (!Number.isInteger(lookbackDays) || lookbackDays < 1) {
  console.error("Invalid --days value.");
  process.exit(1);
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: databaseUrl() });
  const prisma = new PrismaClient({ adapter });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (lookbackDays - 1));
  const toExclusive = new Date(today);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  type Row = {
    day: Date;
    eventName: string;
    ecosystemProjectId: string | null;
    courseId: string | null;
    eventCount: bigint;
    uniqueUsers: bigint;
    uniqueAnonymous: bigint;
  };

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      date_trunc('day', "occurredAt" AT TIME ZONE 'UTC')::date AS "day",
      "eventName",
      "ecosystemProjectId",
      "courseId",
      COUNT(*)::bigint AS "eventCount",
      COUNT(DISTINCT "userId")::bigint AS "uniqueUsers",
      COUNT(DISTINCT "anonymousId")::bigint AS "uniqueAnonymous"
    FROM "AnalyticsEvent"
    WHERE "occurredAt" >= ${from} AND "occurredAt" < ${toExclusive}
    GROUP BY 1, 2, 3, 4
  `;

  const data = rows.map((row) => ({
    date: row.day,
    eventName: row.eventName,
    ecosystemProjectId: row.ecosystemProjectId,
    courseId: row.courseId,
    eventCount: Number(row.eventCount),
    uniqueUsers: Number(row.uniqueUsers),
    uniqueAnonymous: Number(row.uniqueAnonymous),
  }));

  await prisma.$transaction([
    prisma.analyticsDailyRollup.deleteMany({
      where: { date: { gte: from, lt: toExclusive } },
    }),
    prisma.analyticsDailyRollup.createMany({ data }),
  ]);

  console.log(
    `Backfilled ${data.length} rollup rows from ${from.toISOString().slice(0, 10)} to ${today.toISOString().slice(0, 10)}.`
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
