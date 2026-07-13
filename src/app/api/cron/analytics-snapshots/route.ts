import { NextResponse } from "next/server";
import { runHourlyAnalyticsSnapshots } from "@/lib/analytics-snapshots";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runHourlyAnalyticsSnapshots();
  return NextResponse.json({ ok: true, ...result });
}
