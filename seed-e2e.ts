import { getOrCreateInbox, createMessage, replyToMessage, setMessagePublic } from "@/lib/db/queries/whisper";
const inbox = await getOrCreateInbox("test-user-xyz");
console.log("SLUG=" + inbox.slug);
const m = await createMessage(inbox.id, "端到端测试：你好呀");
console.log("RECEIPT=" + m.receiptId);
await replyToMessage("test-user-xyz", m.id, "收到啦，谢谢你");
await setMessagePublic("test-user-xyz", m.id, true);
console.log("done");
process.exit(0);
