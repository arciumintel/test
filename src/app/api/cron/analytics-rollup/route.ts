import { NextResponse } from "next/server";
import { runAnalyticsRollup } from "@/lib/analytics-rollup";

/**
 * Recomputes daily analytics rollups. Default lookback covers yesterday and
 * today (late events land safely). Pass ?days=N (max 3650) to backfill.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = new URL(request.url).searchParams.get("days");
  const lookbackDays = daysParam ? Number.parseInt(daysParam, 10) : undefined;
  if (daysParam && (!Number.isInteger(lookbackDays) || lookbackDays! < 1)) {
    return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });
  }

  const result = await runAnalyticsRollup({ lookbackDays });
  return NextResponse.json({ ok: true, ...result });
}
