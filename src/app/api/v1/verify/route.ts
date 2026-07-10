import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { badgeVerificationPath } from "@/lib/paths";
import { absoluteUrl } from "@/lib/site";

/**
 * Public proof-of-understanding endpoint.
 *
 * GET /api/v1/verify?wallet=<solana-address>[&course=<course-slug>]
 *
 * Returns the badges awarded to a wallet — the same information exposed on
 * public badge verification pages, in machine-readable form. Intended for
 * ecosystem integrations (campaign eligibility, role gating, allowlists).
 */

const WALLET_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: Request) {
  const rate = checkRateLimit(`verify:${clientIpFromRequest(request)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet")?.trim();
  const courseSlug = url.searchParams.get("course")?.trim() || null;

  if (!wallet) {
    return NextResponse.json(
      { error: "Missing required query parameter: wallet" },
      { status: 400 }
    );
  }
  if (!WALLET_PATTERN.test(wallet)) {
    return NextResponse.json(
      { error: "Invalid wallet address format." },
      { status: 400 }
    );
  }

  const awards = await prisma.badgeAward.findMany({
    where: {
      walletAddress: wallet,
      ...(courseSlug ? { course: { slug: courseSlug } } : {}),
    },
    orderBy: { awardedAt: "desc" },
    select: {
      awardedAt: true,
      verificationSlug: true,
      badge: { select: { name: true, description: true, imageUrl: true } },
      course: {
        select: {
          title: true,
          slug: true,
          product: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const badges = awards.map((award) => ({
    badge: {
      name: award.badge.name,
      description: award.badge.description,
      imageUrl: award.badge.imageUrl,
    },
    course: {
      title: award.course.title,
      slug: award.course.slug,
      project: {
        name: award.course.product.name,
        slug: award.course.product.slug,
      },
    },
    awardedAt: award.awardedAt.toISOString(),
    verificationUrl: award.verificationSlug
      ? absoluteUrl(badgeVerificationPath(award.verificationSlug))
      : null,
  }));

  return NextResponse.json(
    {
      wallet,
      ...(courseSlug ? { course: courseSlug } : {}),
      verified: badges.length > 0,
      badgeCount: badges.length,
      badges,
      issuer: "Arcademy",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
