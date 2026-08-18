import { db } from "@/lib/db/client";
import { inboxes, messages } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";
const ibx = (await db.select().from(inboxes).limit(1))[0];
console.log("SLUG=" + ibx.slug, "| OWNER=" + ibx.ownerUserId, "| closed=" + ibx.closed, "| mode=" + ibx.moderationMode);
// ensure open + suspicious to start
await db.update(inboxes).set({ closed: false, moderationMode: "suspicious" }).where(eq(inboxes.id, ibx.id));
console.log("reset to open/suspicious");
process.exit(0);
