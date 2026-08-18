import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logModeration, resolveTakedownForOwner } from "@/lib/db/queries";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/takedowns/[id] — owner resolves a takedown request.
 * body: { status: "actioned" | "dismissed" }. "actioned" means the owner has
 * dealt with the content (e.g. deleted/unpublished it separately). We record
 * the resolution in the moderation audit log.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status === "actioned" || body?.status === "dismissed" ? body.status : null;
  if (!status) return NextResponse.json({ error: "bad_status" }, { status: 400 });

  const targetRef = await resolveTakedownForOwner(auth.user.id, id, status);
  if (!targetRef) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await logModeration({
    actor: "owner",
    actorId: auth.user.id,
    action: "takedown_resolve",
    targetType: "takedown",
    targetRef: id,
    reason: status,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
