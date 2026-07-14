/**
 * QA smoke: buildAnalyticsExport for every scope against a real product.
 *
 * Run: pnpm exec tsx scripts/qa-analytics-export-smoke.ts [productId]
 */

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Stub server-only before any app imports (outside Next runtime).
const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as NodeModule;

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

async function main() {
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    "";
  if (!connectionString) {
    console.error("FAIL: no DATABASE_URL");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const argId = process.argv[2];
  const product =
    (argId
      ? await prisma.product.findUnique({ where: { id: argId } })
      : null) ??
    (await prisma.product.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }));

  if (!product) {
    console.error("FAIL: no product found");
    await prisma.$disconnect();
    process.exit(1);
  }

  const profile = await prisma.analyticsProfile.findUnique({
    where: { productId: product.id },
    select: { featureFlags: true },
  });
  const flags = (profile?.featureFlags ?? {}) as Record<string, unknown>;
  console.log(
    JSON.stringify(
      {
        productId: product.id,
        productName: product.name,
        analyticsV2: flags.analyticsV2 ?? null,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();

  const { buildAnalyticsExport } = await import(
    "../src/lib/analytics-export.ts"
  );
  const { isAnalyticsV2Enabled } = await import(
    "../src/lib/analytics-feature-flags.ts"
  );
  const { ANALYTICS_EXPORT_SCOPES } = await import(
    "../src/lib/analytics-export-types.ts"
  );

  const v2 = await isAnalyticsV2Enabled(product.id);
  console.log(`analyticsV2 enabled: ${v2}`);

  const course = await (async () => {
    const adapter2 = new PrismaNeon({ connectionString });
    const p2 = new PrismaClient({ adapter: adapter2 });
    const c = await p2.course.findFirst({
      where: { productId: product.id, status: "published" },
      select: { id: true, title: true },
    });
    await p2.$disconnect();
    return c;
  })();

  const scopes = [...ANALYTICS_EXPORT_SCOPES];
  const formats = ["markdown", "html", "csv"] as const;
  const results: Array<Record<string, unknown>> = [];
  let failures = 0;

  for (const scope of scopes) {
    if (scope === "course" && !course) {
      results.push({
        scope,
        status: "SKIP",
        reason: "no published course",
      });
      continue;
    }
    for (const format of formats) {
      const started = Date.now();
      try {
        const built = await buildAnalyticsExport({
          productId: product.id,
          rangePreset: "30d",
          compareBaseline: "none",
          format,
          scope,
          courseId: scope === "course" ? course!.id : undefined,
        });
        const ms = Date.now() - started;
        if (!built) {
          failures += 1;
          results.push({ scope, format, status: "FAIL", error: "null result", ms });
          continue;
        }

        const checks: string[] = [];
        if (!built.content || built.content.length < 20) {
          checks.push("content too short");
        }
        if (!built.filename) checks.push("missing filename");
        if (!built.mimeType) checks.push("missing mimeType");

        if (v2) {
          if (format === "markdown") {
            if (!built.content.includes("Aggregates only")) {
              checks.push("missing privacy footer");
            }
            if (scope === "full") {
              for (const heading of [
                "## Overview",
                "## Courses",
                "## Concepts",
                "## Assessments",
                "## Readiness",
                "## Certifications",
                "## Recommendations",
              ]) {
                if (!built.content.includes(heading)) {
                  checks.push(`full pack missing ${heading}`);
                }
              }
            } else if (scope !== "course") {
              const title =
                scope.charAt(0).toUpperCase() + scope.slice(1);
              if (!built.content.includes(`## ${title}`)) {
                // course title is dynamic; skip
                checks.push(`missing ## ${title}`);
              }
            }
            if (
              built.content.includes("wallet") &&
              /0x|[1-9A-HJ-NP-Za-km-z]{32,}/.test(built.content)
            ) {
              checks.push("possible wallet/PII leak");
            }
          }
          if (format === "csv" && scope === "full") {
            for (const marker of [
              "# section:overview",
              "# section:courses",
              "# section:concepts",
              "# section:assessments",
              "# section:readiness",
              "# section:certifications",
              "# section:recommendations",
            ]) {
              if (!built.content.includes(marker)) {
                checks.push(`full csv missing ${marker}`);
              }
            }
          }
          if (format === "html") {
            if (!built.content.includes("<!DOCTYPE html>")) {
              checks.push("not an html document");
            }
            if (!built.content.includes("Aggregates only")) {
              checks.push("missing privacy footer");
            }
          }
        } else {
          // Plus fallback — at least non-empty Partner Plus style report
          if (format === "markdown" && !built.content.includes("Partner Analytics")) {
            // Accept either legacy title or new title when transitioning
            if (!built.content.includes("Arcademy")) {
              checks.push("unexpected plus markdown body");
            }
          }
        }

        if (checks.length) {
          failures += 1;
          results.push({
            scope,
            format,
            status: "FAIL",
            checks,
            bytes: built.content.length,
            filename: built.filename,
            ms,
          });
        } else {
          results.push({
            scope,
            format,
            status: "PASS",
            bytes: built.content.length,
            filename: built.filename,
            ms,
          });
        }
      } catch (err) {
        failures += 1;
        results.push({
          scope,
          format,
          status: "FAIL",
          error: err instanceof Error ? err.message : String(err),
          ms: Date.now() - started,
        });
      }
    }
  }

  console.log(JSON.stringify({ failures, results }, null, 2));
  // Avoid unused import warning for pathToFileURL in some bundlers
  void pathToFileURL;
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
