import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateVerificationSlug(): string {
  return randomBytes(12).toString("base64url");
}

export async function getBadgeAwardByVerificationSlug(slug: string) {
  return prisma.badgeAward.findUnique({
    where: { verificationSlug: slug },
    include: {
      badge: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          criteria: true,
          issuer: true,
          status: true,
        },
      },
      course: {
        select: {
          title: true,
          slug: true,
          status: true,
          product: { select: { name: true, slug: true, status: true } },
        },
      },
    },
  });
}

/** Ensures legacy awards have wallet + slug for public verification. */
export async function backfillBadgeAwardMetadata(
  awardId: string,
  walletAddress: string
): Promise<string | null> {
  const award = await prisma.badgeAward.findUnique({
    where: { id: awardId },
    select: { walletAddress: true, verificationSlug: true },
  });
  if (!award) return null;

  const needsWallet = !award.walletAddress;
  const needsSlug = !award.verificationSlug;
  if (!needsWallet && !needsSlug) return award.verificationSlug;

  let slug = award.verificationSlug;
  if (needsSlug) {
    slug = generateVerificationSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.badgeAward.update({
          where: { id: awardId },
          data: {
            walletAddress: needsWallet ? walletAddress : undefined,
            verificationSlug: slug,
          },
        });
        return slug;
      } catch {
        slug = generateVerificationSlug();
      }
    }
    return null;
  }

  await prisma.badgeAward.update({
    where: { id: awardId },
    data: { walletAddress },
  });
  return award.verificationSlug;
}
