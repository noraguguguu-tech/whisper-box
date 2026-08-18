import { db } from "@/lib/db/client";
import { inboxes } from "@/lib/db/schema/whisper";
const rows = await db.select().from(inboxes).limit(1);
if (rows[0]) { console.log("SLUG=" + rows[0].slug); }
else {
  await db.insert(inboxes).values({ id: "testinbox0000000000000000000000", ownerUserId: "testowner", slug: "testslug", prompt: "" });
  console.log("SLUG=testslug");
}
process.exit(0);
