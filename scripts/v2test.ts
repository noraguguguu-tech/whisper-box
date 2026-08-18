import { db } from "@/lib/db/client";
import { messages, inboxes } from "@/lib/db/schema/whisper";
import { desc, eq } from "drizzle-orm";
const r = (await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(1))[0];
console.log("latest:", r.body, "=> pending:", r.pending);
// now close inbox
await db.update(inboxes).set({ closed: true, moderationMode: "suspicious" }).where(eq(inboxes.slug, "xjs5u1yo"));
console.log("inbox closed");
process.exit(0);
