import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { getDatabaseConnectionString } from "@/lib/configure-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: getDatabaseConnectionString(),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** In dev, HMR can keep a Prisma client from before a schema change. */
function isStaleDevClient(client: PrismaClient): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const c = client as {
    partnerIntake?: { create?: unknown };
    analyticsEvent?: { create?: unknown };
    projectDiscordIntegration?: { upsert?: unknown };
    ecosystemDirectoryEntry?: { upsert?: unknown };
    analyticsProfile?: { create?: unknown };
    analyticsSnapshot?: { create?: unknown };
    questionAttempt?: { create?: unknown };
    certification?: { create?: unknown };
    ecosystemBenchmarkRollup?: { create?: unknown };
  };
  return (
    !c.partnerIntake ||
    typeof c.partnerIntake.create !== "function" ||
    !c.analyticsEvent ||
    typeof c.analyticsEvent.create !== "function" ||
    !c.projectDiscordIntegration ||
    typeof c.projectDiscordIntegration.upsert !== "function" ||
    !c.ecosystemDirectoryEntry ||
    typeof c.ecosystemDirectoryEntry.upsert !== "function" ||
    !c.analyticsProfile ||
    typeof c.analyticsProfile.create !== "function" ||
    !c.analyticsSnapshot ||
    typeof c.analyticsSnapshot.create !== "function" ||
    !c.questionAttempt ||
    typeof c.questionAttempt.create !== "function" ||
    !c.certification ||
    typeof c.certification.create !== "function" ||
    !c.ecosystemBenchmarkRollup ||
    typeof c.ecosystemBenchmarkRollup.create !== "function"
  );
}

export function isPartnerIntakeAvailable(): boolean {
  const delegate = (prisma as { partnerIntake?: { create?: unknown } })
    .partnerIntake;
  return Boolean(delegate && typeof delegate.create === "function");
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStaleDevClient(cached)) return cached;

  if (cached) {
    void cached.$disconnect().catch(() => {});
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
