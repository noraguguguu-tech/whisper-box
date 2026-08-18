import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema/whisper";
import { desc } from "drizzle-orm";
const rows = (await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(2));
for (const r of rows) console.log(r.body, "=> pending:", r.pending);
process.exit(0);
