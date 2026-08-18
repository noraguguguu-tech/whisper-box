import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";
const rid = "s3czro3kiqe9xavb11pbsm8a219yd36z";
await db.update(messages).set({ blocked: true }).where(eq(messages.receiptId, rid));
console.log("blocked set");
process.exit(0);
