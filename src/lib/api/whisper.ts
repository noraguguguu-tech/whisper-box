import { request } from "./request";
import type { PublicEntry, ReceiptView, WhisperMessage } from "@/lib/whisper/types";

export interface InboxData {
  inbox: { slug: string; prompt: string; closed: boolean; moderationMode: "suspicious" | "all" };
  messages: WhisperMessage[];
}

/** Owner: fetch inbox + all messages (requires auth). */
export async function fetchInbox(): Promise<InboxData | null> {
  try {
    const res = await request("/api/inbox");
    if (!res.ok) return null;
    return (await res.json()) as InboxData;
  } catch {
    return null;
  }
}

/** Owner: update guiding prompt. */
export async function updateInboxPrompt(prompt: string): Promise<boolean> {
  try {
    const res = await request("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Owner: open/close the inbox (emergency valve). */
export async function setInboxClosed(closed: boolean): Promise<boolean> {
  try {
    const res = await request("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closed }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Owner: switch review mode between "suspicious" and "all". */
export async function setModerationMode(mode: "suspicious" | "all"): Promise<boolean> {
  try {
    const res = await request("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderationMode: mode }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function patchMessage(
  id: string,
  payload: Record<string, unknown>,
): Promise<WhisperMessage | null> {
  try {
    const res = await request(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { message: WhisperMessage };
    return json.message;
  } catch {
    return null;
  }
}

export function markMessageRead(id: string): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "read" });
}

export function replyToMessage(id: string, reply: string): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "reply", reply });
}

/** Owner: add a follow-up turn on an already-replied thread. */
export function followupMessage(id: string, reply: string): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "followup", reply });
}

export function setMessagePublic(id: string, isPublic: boolean): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "public", isPublic });
}

/** Owner: mute/unmute a thread (mute stops visitor follow-ups). */
export function setMessageBlocked(id: string, blocked: boolean): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "block", blocked });
}

/** Owner: approve a pending letter — it leaves review and enters the inbox. */
export function approveMessage(id: string): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "approve" });
}

/** Owner: delete a letter and its whole thread. Returns true on success. */
export async function deleteMessage(id: string): Promise<boolean> {
  try {
    const res = await request(`/api/messages/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- visitor (no auth) ----

export interface VisitorInboxData {
  prompt: string;
  closed: boolean;
  wall: PublicEntry[];
  wallHasMore: boolean;
  wallTotal: number;
}

export async function fetchVisitorInbox(slug: string): Promise<VisitorInboxData | null> {
  try {
    const res = await request(`/api/u/${slug}`);
    if (!res.ok) return null;
    return (await res.json()) as VisitorInboxData;
  } catch {
    return null;
  }
}

/** One more page of a slug's public wall, starting at `offset`. */
export async function fetchPublicWall(
  slug: string,
  offset: number,
): Promise<{ wall: PublicEntry[]; wallHasMore: boolean; wallTotal: number } | null> {
  try {
    const res = await request(`/api/u/${slug}?wallOffset=${offset}`);
    if (!res.ok) return null;
    return (await res.json()) as { wall: PublicEntry[]; wallHasMore: boolean; wallTotal: number };
  } catch {
    return null;
  }
}

export type SendFailReason = "blocked_content" | "rate_limited" | "not_allowed" | "inbox_closed" | "error";

/** Discriminated outcome so the UI can show a precise, friendly message. */
export type SendOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; reason: SendFailReason; category?: string };

async function readError(res: Response): Promise<{ error?: string; category?: string }> {
  try {
    return (await res.json()) as { error?: string; category?: string };
  } catch {
    return {};
  }
}

function mapReason(status: number, error?: string): SendFailReason {
  if (status === 422 || error === "blocked_content") return "blocked_content";
  if (status === 429 || error === "rate_limited") return "rate_limited";
  if (error === "inbox_closed") return "inbox_closed";
  if (status === 403 || status === 400) return "not_allowed";
  return "error";
}

export async function sendVisitorMessage(
  slug: string,
  body: string,
): Promise<SendOutcome<{ receiptId: string }>> {
  try {
    const res = await request(`/api/u/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as { receiptId: string } };
    }
    const err = await readError(res);
    return { ok: false, reason: mapReason(res.status, err.error), category: err.category };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function fetchReceipt(receiptId: string): Promise<ReceiptView | null> {
  try {
    const res = await request(`/api/r/${receiptId}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { receipt: ReceiptView };
    return json.receipt;
  } catch {
    return null;
  }
}

/** Visitor: continue the thread with a follow-up (only after owner replied). */
export async function sendReceiptFollowup(
  receiptId: string,
  body: string,
): Promise<SendOutcome<ReceiptView>> {
  try {
    const res = await request(`/api/r/${receiptId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const json = (await res.json()) as { receipt: ReceiptView };
      return { ok: true, data: json.receipt };
    }
    const err = await readError(res);
    return { ok: false, reason: mapReason(res.status, err.error), category: err.category };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Visitor: flag this thread as harmful. Best-effort. */
export async function reportReceipt(receiptId: string): Promise<boolean> {
  try {
    const res = await request(`/api/r/${receiptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type TakedownReason =
  | "defamation"
  | "privacy"
  | "harassment"
  | "illegal"
  | "minor"
  | "other";

export interface OwnerTakedown {
  id: string;
  targetRef: string;
  reason: string;
  details: string;
  contact: string;
  createdAt: string;
}

/** Third party: submit a takedown request about a public letter. No auth. */
export async function submitTakedown(input: {
  targetRef: string;
  reason: TakedownReason;
  details?: string;
  contact?: string;
}): Promise<boolean> {
  try {
    const res = await request("/api/takedown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "public_message", ...input }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Owner: list open third-party takedowns for their letters. */
export async function fetchTakedowns(): Promise<OwnerTakedown[]> {
  try {
    const res = await request("/api/takedowns");
    if (!res.ok) return [];
    const data = (await res.json()) as { takedowns: OwnerTakedown[] };
    return data.takedowns ?? [];
  } catch {
    return [];
  }
}

/** Owner: resolve a takedown request. */
export async function resolveTakedown(
  id: string,
  status: "actioned" | "dismissed",
): Promise<boolean> {
  try {
    const res = await request(`/api/takedowns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
