import { getOrCreateInbox, replyToMessage } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";

const BASE = "http://localhost:3000";

async function main() {
  const inbox = await getOrCreateInbox("test-owner-thread");
  console.log("slug:", inbox.slug);

  // 1) visitor sends a letter
  const post = await fetch(`${BASE}/api/u/${inbox.slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "第一封信：你好呀" }),
  });
  const { receiptId } = (await post.json()) as { receiptId: string };
  console.log("receiptId:", receiptId);

  // 2) receipt before reply -> canFollowUp false, turns empty
  let r = await (await fetch(`${BASE}/api/r/${receiptId}`)).json();
  console.log("before reply canFollowUp:", r.receipt.canFollowUp, "turns:", r.receipt.turns.length);

  // 3) premature follow-up should be rejected
  const early = await fetch(`${BASE}/api/r/${receiptId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "还没回信就追问" }),
  });
  console.log("premature followup status:", early.status);

  // 4) owner replies (direct query, auth-scoped)
  const msg = await db.select().from(messages).where(eq(messages.receiptId, receiptId)).limit(1);
  await replyToMessage("test-owner-thread", msg[0].id, "回信：你也好呀");

  // 5) now visitor follow-up works
  const ok = await fetch(`${BASE}/api/r/${receiptId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "追问：最近怎么样？" }),
  });
  r = await ok.json();
  console.log(
    "after followup status:",
    ok.status,
    "canFollowUp:",
    r.receipt.canFollowUp,
    "turns:",
    r.receipt.turns.map((tt: { author: string; body: string }) => `${tt.author}:${tt.body}`),
  );

  // cleanup
  await db.delete(messages).where(eq(messages.receiptId, receiptId));
  console.log("DONE");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
