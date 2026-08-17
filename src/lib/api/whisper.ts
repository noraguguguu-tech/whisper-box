import { request } from "./request";
import type { PublicEntry, ReceiptView, WhisperMessage } from "@/lib/whisper/types";

export interface InboxData {
  inbox: { slug: string; prompt: string };
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

export function setMessagePublic(id: string, isPublic: boolean): Promise<WhisperMessage | null> {
  return patchMessage(id, { action: "public", isPublic });
}

// ---- visitor (no auth) ----

export interface VisitorInboxData {
  prompt: string;
  wall: PublicEntry[];
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

export async function sendVisitorMessage(
  slug: string,
  body: string,
): Promise<{ receiptId: string } | null> {
  try {
    const res = await request(`/api/u/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { receiptId: string };
  } catch {
    return null;
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
