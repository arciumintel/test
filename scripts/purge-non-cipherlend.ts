/**
 * Remove all database content not tied to CipherLend.
 *
 * Keeps:
 *   - Product `product_cipherlend` and all cascaded product data
 *   - Ecosystem directory entry linked to CipherLend
 *   - Staff admins, CipherLend project admins, and CipherLend mock learners (CLmock*)
 *
 * Dry run (default): npx tsx scripts/purge-non-cipherlend.ts
 * Execute:           npx tsx scripts/purge-non-cipherlend.ts --execute
 */
import "dotenv/config";
import "@/lib/configure-neon";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { getDatabaseConnectionString } from "@/lib/configure-neon";

const CIPHERLEND_PRODUCT_ID = "product_cipherlend";
const CIPHERLEND_SLUG = "cipherlend";
const MOCK_WALLET_PREFIX = "CLmock";

const execute = process.argv.includes("--execute");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: getDatabaseConnectionString() }),
});

type Counts = Record<string, number>;

async function countPlan(cipherlendCourseIds: string[]): Promise<Counts> {
  const nonCipherlendProducts = await prisma.product.findMany({
    where: { id: { not: CIPHERLEND_PRODUCT_ID } },
    select: { id: true, slug: true },
  });
  const productIds = nonCipherlendProducts.map((p) => p.id);

  const nonCipherlendCourses = await prisma.course.findMany({
    where: { productId: { in: productIds } },
    select: { id: true },
  });
  const courseIds = nonCipherlendCourses.map((c) => c.id);

  const cipherlendUserIds = new Set<string>();

  const staffAdmins = await prisma.user.findMany({
    where: { role: "staff_admin" },
    select: { id: true },
  });
  staffAdmins.forEach((u) => cipherlendUserIds.add(u.id));

  const projectAdmins = await prisma.projectAdmin.findMany({
    where: { productId: CIPHERLEND_PRODUCT_ID },
    select: { userId: true },
  });
  projectAdmins.forEach((pa) => cipherlendUserIds.add(pa.userId));

  const mockLearners = await prisma.user.findMany({
    where: { walletAddress: { startsWith: MOCK_WALLET_PREFIX } },
    select: { id: true },
  });
  mockLearners.forEach((u) => cipherlendUserIds.add(u.id));

  const owner = await prisma.user.findUnique({
    where: { walletAddress: "FsBdnmg8QqCm5e693YYc1G4LuceKvvMii1fq1UmZ1wmj" },
    select: { id: true },
  });
  if (owner) cipherlendUserIds.add(owner.id);

  const usersWithCipherlendActivity = await prisma.user.findMany({
    where: {
      OR: [
        { progress: { some: { courseId: { in: cipherlendCourseIds } } } },
        { quizAttempts: { some: { quiz: { courseId: { in: cipherlendCourseIds } } } } },
        { badgeAwards: { some: { courseId: { in: cipherlendCourseIds } } } },
        { projectAdmins: { some: { productId: CIPHERLEND_PRODUCT_ID } } },
      ],
    },
    select: { id: true },
  });
  usersWithCipherlendActivity.forEach((u) => cipherlendUserIds.add(u.id));

  const keepUserIds = [...cipherlendUserIds];

  const orphanUsers = await prisma.user.count({
    where: { id: { notIn: keepUserIds } },
  });

  const analyticsFilter = {
    OR: [
      { ecosystemProjectId: { in: productIds } },
      { ecosystemProjectSlug: { in: nonCipherlendProducts.map((p) => p.slug) } },
      { courseId: { in: courseIds } },
      {
        AND: [
          { ecosystemProjectId: { not: CIPHERLEND_PRODUCT_ID } },
          { ecosystemProjectSlug: { not: CIPHERLEND_SLUG } },
          { courseId: { notIn: cipherlendCourseIds } },
        ],
      },
    ],
  };

  return {
    products: productIds.length,
    courses: courseIds.length,
    partnerIntakes: await prisma.partnerIntake.count({
      where: {
        OR: [
          { productId: { in: productIds } },
          {
            productId: null,
            NOT: {
              OR: [
                { partnerName: { contains: "Cipher" } },
                { partnerName: { contains: "cipher" } },
              ],
            },
          },
        ],
      },
    }),
    analyticsEvents: await prisma.analyticsEvent.count({ where: analyticsFilter }),
    orphanUsers,
    authNonces: await prisma.authNonce.count(),
    notificationsForOrphans: await prisma.notification.count({
      where: { userId: { notIn: keepUserIds } },
    }),
    projectAdmins: await prisma.projectAdmin.count({
      where: { productId: { in: productIds } },
    }),
    ecosystemDirectoryUnlinked: await prisma.ecosystemDirectoryEntry.count({
      where: {
        OR: [
          { productId: { in: productIds } },
          { slug: { not: CIPHERLEND_SLUG }, productId: null },
        ],
      },
    }),
  };
}

async function purge(cipherlendCourseIds: string[]) {
  const nonCipherlendProducts = await prisma.product.findMany({
    where: { id: { not: CIPHERLEND_PRODUCT_ID } },
    select: { id: true, slug: true, name: true },
  });
  const productIds = nonCipherlendProducts.map((p) => p.id);

  console.log(
    "Removing products:",
    nonCipherlendProducts.map((p) => `${p.slug} (${p.id})`).join(", ") || "(none)",
  );

  const nonCipherlendCourses = await prisma.course.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, slug: true },
  });
  const courseIds = nonCipherlendCourses.map((c) => c.id);

  const keepUserIds = new Set<string>();

  for (const u of await prisma.user.findMany({
    where: { role: "staff_admin" },
    select: { id: true },
  })) {
    keepUserIds.add(u.id);
  }

  for (const pa of await prisma.projectAdmin.findMany({
    where: { productId: CIPHERLEND_PRODUCT_ID },
    select: { userId: true },
  })) {
    keepUserIds.add(pa.userId);
  }

  for (const u of await prisma.user.findMany({
    where: { walletAddress: { startsWith: MOCK_WALLET_PREFIX } },
    select: { id: true },
  })) {
    keepUserIds.add(u.id);
  }

  const owner = await prisma.user.findUnique({
    where: { walletAddress: "FsBdnmg8QqCm5e693YYc1G4LuceKvvMii1fq1UmZ1wmj" },
    select: { id: true },
  });
  if (owner) keepUserIds.add(owner.id);

  for (const u of await prisma.user.findMany({
    where: {
      OR: [
        { progress: { some: { courseId: { in: cipherlendCourseIds } } } },
        { quizAttempts: { some: { quiz: { courseId: { in: cipherlendCourseIds } } } } },
        { badgeAwards: { some: { courseId: { in: cipherlendCourseIds } } } },
      ],
    },
    select: { id: true },
  })) {
    keepUserIds.add(u.id);
  }

  const keep = [...keepUserIds];

  await prisma.$transaction(async (tx) => {
    // 1. Analytics not tied to CipherLend
    const analyticsDeleted = await tx.analyticsEvent.deleteMany({
      where: {
        OR: [
          { ecosystemProjectId: { in: productIds } },
          { ecosystemProjectSlug: { in: nonCipherlendProducts.map((p) => p.slug) } },
          { courseId: { in: courseIds } },
          {
            AND: [
              { ecosystemProjectId: { not: CIPHERLEND_PRODUCT_ID } },
              { ecosystemProjectSlug: { not: CIPHERLEND_SLUG } },
              {
                OR: [
                  { courseId: null },
                  { courseId: { notIn: cipherlendCourseIds } },
                ],
              },
            ],
          },
        ],
      },
    });
    console.log("Deleted analytics events:", analyticsDeleted.count);

    // 2. Partner intakes for other products / unrelated applications
    const intakesDeleted = await tx.partnerIntake.deleteMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          {
            productId: null,
            NOT: {
              OR: [
                { partnerName: { contains: "Cipher" } },
                { partnerName: { contains: "cipher" } },
              ],
            },
          },
        ],
      },
    });
    console.log("Deleted partner intakes:", intakesDeleted.count);

    // 3. Non-CipherLend ecosystem directory entries (keep CipherLend only)
    const directoryDeleted = await tx.ecosystemDirectoryEntry.deleteMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { slug: { not: CIPHERLEND_SLUG } },
        ],
      },
    });
    console.log("Deleted ecosystem directory entries:", directoryDeleted.count);

    // 4. Clear review FKs on courses we are about to delete
    await tx.course.updateMany({
      where: { id: { in: courseIds } },
      data: { reviewRequestedByUserId: null, reviewedByUserId: null },
    });

    // 5. Delete non-CipherLend courses (cascades lessons, quizzes, badges, progress, etc.)
    const coursesDeleted = await tx.course.deleteMany({
      where: { id: { in: courseIds } },
    });
    console.log("Deleted courses:", coursesDeleted.count);

    // 6. Delete non-CipherLend products (cascades analytics profile, paths, concepts, etc.)
    const productsDeleted = await tx.product.deleteMany({
      where: { id: { in: productIds } },
    });
    console.log("Deleted products:", productsDeleted.count);

    // 7. Ephemeral auth nonces
    const noncesDeleted = await tx.authNonce.deleteMany();
    console.log("Deleted auth nonces:", noncesDeleted.count);

    // 8. Orphan users (test wallets from other products / casual sign-ins)
    const notificationsDeleted = await tx.notification.deleteMany({
      where: { userId: { notIn: keep } },
    });
    console.log("Deleted notifications for removed users:", notificationsDeleted.count);

    const usersDeleted = await tx.user.deleteMany({
      where: { id: { notIn: keep } },
    });
    console.log("Deleted orphan users:", usersDeleted.count);
  });
}

async function main() {
  const cipherlend = await prisma.product.findUnique({
    where: { id: CIPHERLEND_PRODUCT_ID },
    select: {
      id: true,
      name: true,
      slug: true,
      courses: { select: { id: true, slug: true, title: true } },
    },
  });

  if (!cipherlend) {
    console.error(
      `CipherLend product (${CIPHERLEND_PRODUCT_ID}) not found. Aborting to avoid wiping the database.`,
    );
    process.exitCode = 1;
    return;
  }

  const cipherlendCourseIds = cipherlend.courses.map((c) => c.id);

  console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`Keeping CipherLend product: ${cipherlend.name} (${cipherlend.slug})`);
  console.log(`Keeping ${cipherlend.courses.length} CipherLend courses:`);
  for (const c of cipherlend.courses) {
    console.log(`  - ${c.slug}: ${c.title}`);
  }

  const plan = await countPlan(cipherlendCourseIds);
  console.log("\nPlanned deletions:");
  for (const [key, value] of Object.entries(plan)) {
    console.log(`  ${key}: ${value}`);
  }

  if (!execute) {
    console.log("\nNo changes made. Re-run with --execute to apply.");
    return;
  }

  console.log("\nApplying purge...");
  await purge(cipherlendCourseIds);
  console.log("\nDone. Post-purge inventory:");

  const remaining = {
    products: await prisma.product.count(),
    courses: await prisma.course.count(),
    users: await prisma.user.count(),
    staffAdmins: await prisma.user.count({ where: { role: "staff_admin" } }),
    projectAdmins: await prisma.projectAdmin.count(),
    analyticsEvents: await prisma.analyticsEvent.count(),
    ecosystemDirectory: await prisma.ecosystemDirectoryEntry.count(),
    partnerIntakes: await prisma.partnerIntake.count(),
  };
  console.log(remaining);
}

void main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
