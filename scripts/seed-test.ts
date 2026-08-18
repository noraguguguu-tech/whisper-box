import { db } from "@/lib/db/client";
import { messages, turns } from "@/lib/db/schema/whisper";
import { deleteMessage, setMessageBlocked } from "@/lib/db/queries";
import { eq } from "drizzle-orm";
const rid = "s3czro3kiqe9xavb11pbsm8a219yd36z";
const m = (await db.select().from(messages).where(eq(messages.receiptId, rid)))[0];
if (!m) { console.log("no msg"); process.exit(0); }
const turnsBefore = (await db.select().from(turns).where(eq(turns.messageId, m.id))).length;
console.log("turns before delete:", turnsBefore);
// wrong owner -> should refuse
const wrong = await deleteMessage("not-the-owner", m.id);
console.log("delete wrong owner (expect false):", wrong);
// unblock via correct owner
const ub = await setMessageBlocked("testowner", m.id, false);
console.log("unblock correct owner (expect blocked=false):", ub?.blocked);
// delete with correct owner
const ok = await deleteMessage("testowner", m.id);
console.log("delete correct owner (expect true):", ok);
const gone = (await db.select().from(messages).where(eq(messages.id, m.id))).length === 0;
const turnsGone = (await db.select().from(turns).where(eq(turns.messageId, m.id))).length === 0;
console.log("message gone:", gone, "| turns cascade gone:", turnsGone);
process.exit(0);
