// Basic keyword-based content screening. This is a deliberately simple word
// list — NOT an AI moderation system. Never describe it to users as "AI review".
// It exists to soft-block the most blatant abuse/threats and to flag self-harm
// so we can surface crisis resources. It will miss things; it is a floor, not a
// guarantee. All matching runs server-side.

// Normalize to defeat trivial evasion: lowercase, strip spaces/punctuation that
// people insert between letters (e.g. "k i l l", "f*ck").
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s._\-*|/\\+~`'"()<>[\]{}]/g, "");
}

// Blatant harassment / slurs (kept intentionally short; extend over time).
const ABUSE = [
  "去死", "滚蛋", "贱人", "婊子", "杂种", "废物", "智障", "脑残", "傻逼", "sb",
  "fuckyou", "fuckoff", "bitch", "asshole", "retard", "kys",
];

// Threats of violence.
const THREAT = [
  "我要杀了你", "杀了你", "弄死你", "打死你", "找到你", "让你好看",
  "killyou", "iwillkill", "hurtyou",
];

// Self-harm / suicide signals — routed to crisis resources, not just blocked.
const SELF_HARM = [
  "我想死", "不想活", "自杀", "结束生命", "活不下去", "想轻生",
  "killmyself", "suicide", "endmylife", "wanttodie",
];

// Weak signals — not blocked outright, but suspicious enough to hold for the
// owner to review (mild insults, coarse language, borderline hostility).
const WEAK = [
  "笨蛋", "讨厌", "闭嘴", "烦人", "垃圾", "恶心", "无聊透顶",
  "idiot", "stupid", "shutup", "loser", "ugly", "hateyou",
];

export type ModerationCategory = "abuse" | "threat" | "self_harm";
export type ModerationLevel = "clean" | "review" | "block";

export interface ModerationResult {
  ok: boolean; // false = hard block (never enters the inbox)
  level: ModerationLevel; // clean → inbox, review → pending queue, block → rejected
  category?: ModerationCategory;
}

function hits(normalized: string, list: string[]): boolean {
  return list.some((w) => normalized.includes(normalize(w)));
}

/**
 * Screen a piece of user text into three tiers:
 *   - block: self-harm / threat / blatant abuse → rejected (ok=false).
 *   - review: weak/borderline signals → accepted but held pending owner review.
 *   - clean: passes → goes straight to the inbox.
 * Self-harm additionally carries a category so the UI shows crisis resources.
 */
export function screenContent(text: string): ModerationResult {
  const n = normalize(text);
  if (hits(n, SELF_HARM)) return { ok: false, level: "block", category: "self_harm" };
  if (hits(n, THREAT)) return { ok: false, level: "block", category: "threat" };
  if (hits(n, ABUSE)) return { ok: false, level: "block", category: "abuse" };
  if (hits(n, WEAK)) return { ok: true, level: "review" };
  return { ok: true, level: "clean" };
}
