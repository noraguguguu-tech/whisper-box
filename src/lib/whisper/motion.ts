// Shared motion vocabulary for the letter rituals. One spring so every card
// shares the same soft, slightly bouncy physics — the seal is the only element
// allowed a heavier, snappier feel (it should land like a real stamp).

import type { Transition } from "framer-motion";

/** Soft paper spring — used for cards sliding, revealing, settling. */
export const paperSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

/** Heavier, snappier spring for the wax seal slamming down. */
export const sealSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 17,
  mass: 1.1,
};

/** Per-line stagger delay (seconds) for the "unsealing" line reveal. */
export const LINE_STAGGER = 0.06;

/** A single short haptic tap, e.g. the moment the seal lands. Mobile only. */
export function hapticTap(ms = 12): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* vibration unsupported or blocked — silently ignore */
    }
  }
}

/**
 * Split a letter body into display lines for the reveal. We keep it simple:
 * split on explicit newlines, then fall back to the whole string so a single
 * paragraph still reveals as one graceful block.
 */
export function toRevealLines(text: string): string[] {
  const byNewline = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  return byNewline.length > 0 ? byNewline : [text];
}
