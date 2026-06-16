import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
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
  };
  return (
    !c.partnerIntake ||
    typeof c.partnerIntake.create !== "function" ||
    !c.analyticsEvent ||
    typeof c.analyticsEvent.create !== "function"
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
