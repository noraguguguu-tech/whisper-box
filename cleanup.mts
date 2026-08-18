import { db } from "./src/lib/db/client";
import { rateHits } from "./src/lib/db/schema/whisper";
import { inArray } from "drizzle-orm";
const r = await db.delete(rateHits).where(inArray(rateHits.bucket, ["prunetest-fresh","prunetest-stale"])).returning({ id: rateHits.id });
console.log("cleaned:", r.length);
process.exit(0);
