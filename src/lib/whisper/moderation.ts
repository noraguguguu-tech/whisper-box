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

export type ModerationCategory = "abuse" | "threat" | "self_harm";

export interface ModerationResult {
  ok: boolean; // true = passes the basic screen
  category?: ModerationCategory;
}

function hits(normalized: string, list: string[]): boolean {
  return list.some((w) => normalized.includes(normalize(w)));
}

/**
 * Screen a piece of user text. Threat/abuse -> block (ok=false). Self-harm is
 * also flagged so the UI can show crisis resources; we still block posting the
 * raw self-harm text to another person's inbox.
 */
export function screenContent(text: string): ModerationResult {
  const n = normalize(text);
  if (hits(n, SELF_HARM)) return { ok: false, category: "self_harm" };
  if (hits(n, THREAT)) return { ok: false, category: "threat" };
  if (hits(n, ABUSE)) return { ok: false, category: "abuse" };
  return { ok: true };
}
