import { db } from "@/lib/db/client";
import { messages, turns, inboxes } from "@/lib/db/schema/whisper";
import { deleteMessage, setMessageBlocked } from "@/lib/db/queries";
import { eq } from "drizzle-orm";
const rid = "s3czro3kiqe9xavb11pbsm8a219yd36z";
const m = (await db.select().from(messages).where(eq(messages.receiptId, rid)))[0];
const ibx = (await db.select().from(inboxes).where(eq(inboxes.id, m.inboxId)))[0];
const owner = ibx.ownerUserId;
console.log("real owner:", owner);
const turnsBefore = (await db.select().from(turns).where(eq(turns.messageId, m.id))).length;
console.log("turns before:", turnsBefore);
console.log("delete wrong owner (false):", await deleteMessage("nope", m.id));
console.log("block correct owner:", (await setMessageBlocked(owner, m.id, true))?.blocked);
console.log("unblock correct owner:", (await setMessageBlocked(owner, m.id, false))?.blocked);
console.log("delete correct owner (true):", await deleteMessage(owner, m.id));
console.log("msg gone:", (await db.select().from(messages).where(eq(messages.id, m.id))).length === 0,
  "| turns cascade gone:", (await db.select().from(turns).where(eq(turns.messageId, m.id))).length === 0);
process.exit(0);
