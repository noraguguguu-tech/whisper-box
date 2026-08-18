import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { checkAndRecordRate } from "@/lib/db/queries";

// Anonymous-write throttling. We never store a raw IP: the IP + action + a
// server salt are hashed into an opaque bucket key. Best-effort only — behind
// shared NATs several visitors share a bucket, which is an acceptable tradeoff
// for a first-line anti-flood measure that needs no login.

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function bucketFor(req: NextRequest, action: string): string {
  const salt = process.env.EAZO_APP_ID ?? "whisper-box";
  const raw = `${salt}:${action}:${clientIp(req)}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 48);
}

export interface RateLimit {
  windowSeconds: number;
  max: number;
}

// Sensible first-version limits for anonymous writing.
export const WRITE_LIMIT: RateLimit = { windowSeconds: 60, max: 5 }; // 5/min
export const WRITE_LIMIT_DAILY: RateLimit = { windowSeconds: 86400, max: 60 }; // 60/day

/**
 * Returns true when the request is allowed (and records the hit), false when
 * it should be throttled. Enforces both a burst window and a daily cap.
 */
export async function allowWrite(req: NextRequest, action: string): Promise<boolean> {
  const bucket = bucketFor(req, action);
  const dayOk = await checkAndRecordRate(
    `${bucket}:d`,
    WRITE_LIMIT_DAILY.windowSeconds,
    WRITE_LIMIT_DAILY.max,
  );
  if (!dayOk) return false;
  return checkAndRecordRate(`${bucket}:m`, WRITE_LIMIT.windowSeconds, WRITE_LIMIT.max);
}
