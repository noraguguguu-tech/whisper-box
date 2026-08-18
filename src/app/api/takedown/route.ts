import { type NextRequest, NextResponse } from "next/server";
import {
  createTakedownRequest,
  getPublicMessageById,
  logModeration,
} from "@/lib/db/queries";
import { allowWrite } from "@/lib/whisper/rate-limit";

// Allowed reason codes for a third-party takedown. Kept small and closed.
const REASONS = new Set([
  "defamation", // 诽谤/名誉
  "privacy", // 隐私泄露/人肉
  "harassment", // 骚扰/霸凌
  "illegal", // 违法信息
  "minor", // 涉未成年人
  "other",
]);

/**
 * POST /api/takedown — a takedown request from an affected THIRD PARTY about
 * publicly visible content. No login: the reporter is not the owner and not
 * necessarily the sender. We validate the target is real public content,
 * throttle to prevent abuse, store the request, and write an audit log entry.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    targetType?: unknown;
    targetRef?: unknown;
    reason?: unknown;
    details?: unknown;
    contact?: unknown;
  } | null;

  const targetType = typeof body?.targetType === "string" ? body.targetType : "";
  const targetRef = typeof body?.targetRef === "string" ? body.targetRef.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 2000) : "";
  const contact = typeof body?.contact === "string" ? body.contact.trim().slice(0, 200) : "";

  if (targetType !== "public_message" || !targetRef || !REASONS.has(reason)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // The target must reference content that is actually public right now.
  const target = await getPublicMessageById(targetRef);
  if (!target) {
    return NextResponse.json({ error: "target_not_found" }, { status: 404 });
  }

  // Anti-abuse throttle, scoped to the reported target.
  if (!(await allowWrite(request, `takedown:${targetRef}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const id = await createTakedownRequest({
    targetType: "public_message",
    targetRef,
    reason,
    details,
    contact,
  });

  // Audit trail: a third-party takedown was received. No reporter identity is
  // stored beyond an optional contact they chose to provide.
  await logModeration({
    actor: "visitor",
    action: "takedown_request",
    targetType: "message",
    targetRef,
    reason,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, id });
}
