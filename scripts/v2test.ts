import { db } from "@/lib/db/client";
import { inboxes } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";
await db.update(inboxes).set({ moderationMode: "all" }).where(eq(inboxes.slug, "xjs5u1yo"));
console.log("mode=all set");
process.exit(0);
