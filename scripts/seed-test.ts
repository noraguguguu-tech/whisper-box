import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema/whisper";
import { eq } from "drizzle-orm";
const rid = "s3czro3kiqe9xavb11pbsm8a219yd36z";
// Mark replied so a follow-up would normally be allowed.
await db.update(messages).set({ status: "replied", reply: "回信了", repliedAt: new Date() }).where(eq(messages.receiptId, rid));
console.log("replied set");
process.exit(0);
