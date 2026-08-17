import type { Inbox, PublicEntry, ReceiptView, WhisperMessage } from "./types";

// ---- Mock data (frontend-only stage). Removed when the real backend lands. ----

export const MOCK_SLUG = "demo";

export const MOCK_MESSAGES: WhisperMessage[] = [
  {
    id: "m1",
    body: "今天你看起来很累，还好吗？记得好好休息呀。",
    reply: "谢谢你的关心，最近确实有点忙，看到这条消息心里暖暖的 🧸",
    status: "replied",
    isPublic: true,
    receiptId: "demo-receipt",
    createdAt: "2026-08-16T09:20:00.000Z",
    repliedAt: "2026-08-16T12:05:00.000Z",
  },
  {
    id: "m2",
    body: "偷偷说，我关注你很久了，你分享的东西真的帮到我很多。",
    reply: null,
    status: "unread",
    isPublic: false,
    receiptId: "rc-2",
    createdAt: "2026-08-16T18:41:00.000Z",
    repliedAt: null,
  },
  {
    id: "m3",
    body: "如果可以匿名问一个问题：你是怎么坚持做一件事这么久的？",
    reply: "其实我也会想放弃，只是每次都告诉自己再多做一点点，就这样走到了现在。",
    status: "replied",
    isPublic: true,
    receiptId: "rc-3",
    createdAt: "2026-08-15T14:10:00.000Z",
    repliedAt: "2026-08-15T20:30:00.000Z",
  },
  {
    id: "m4",
    body: "祝你今天也有好心情，一条来自陌生人的悄悄话～",
    reply: null,
    status: "read",
    isPublic: false,
    receiptId: "rc-4",
    createdAt: "2026-08-14T08:00:00.000Z",
    repliedAt: null,
  },
];

export const MOCK_INBOX: Inbox = {
  slug: MOCK_SLUG,
  prompt: "问我任何事，我在这里悄悄听你说 🌙",
  messages: MOCK_MESSAGES,
};

export const MOCK_PUBLIC_ENTRIES: PublicEntry[] = MOCK_MESSAGES.filter(
  (m) => m.isPublic && m.reply,
).map((m) => ({
  id: m.id,
  body: m.body,
  reply: m.reply as string,
  repliedAt: m.repliedAt as string,
}));

export const MOCK_RECEIPT: ReceiptView = {
  id: MOCK_MESSAGES[0].id,
  body: MOCK_MESSAGES[0].body,
  reply: MOCK_MESSAGES[0].reply,
  status: MOCK_MESSAGES[0].status,
  createdAt: MOCK_MESSAGES[0].createdAt,
  repliedAt: MOCK_MESSAGES[0].repliedAt,
};
