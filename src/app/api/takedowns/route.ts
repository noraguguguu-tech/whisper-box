import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listOpenTakedownsForOwner } from "@/lib/db/queries";

/** GET /api/takedowns — open third-party takedowns for the owner's letters. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const rows = await listOpenTakedownsForOwner(auth.user.id);
  return NextResponse.json({
    takedowns: rows.map((r) => ({
      id: r.id,
      targetRef: r.targetRef,
      reason: r.reason,
      details: r.details,
      contact: r.contact,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
