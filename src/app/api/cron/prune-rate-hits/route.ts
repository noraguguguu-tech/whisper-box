import { type NextRequest, NextResponse } from "next/server";
import { pruneExpiredRateHits } from "@/lib/db/queries";

/**
 * Deletes expired anti-abuse rate-limit tokens (past their TTL), backing the
 * "not retained long-term" promise in the Privacy Policy independent of
 * traffic. Opportunistic pruning also runs on writes; this is the scheduled
 * guarantee. Wire into `vercel.json#crons` and authenticate via CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await pruneExpiredRateHits();
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[rate-hits/cron] prune failed", err);
    return NextResponse.json({ error: "prune failed" }, { status: 500 });
  }
}
