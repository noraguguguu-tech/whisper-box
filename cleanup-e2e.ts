import { db } from "@/lib/db/client";
import { inboxes, messages } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";
const rows = await db.select().from(inboxes).where(eq(inboxes.ownerUserId, "test-user-xyz"));
for (const r of rows) { await db.delete(messages).where(eq(messages.inboxId, r.id)); }
await db.delete(inboxes).where(eq(inboxes.ownerUserId, "test-user-xyz"));
console.log("cleaned");
process.exit(0);
