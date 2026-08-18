"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LINE_STAGGER, paperSpring, toRevealLines } from "@/lib/whisper/motion";
import { cn } from "@/utils/utils";

/**
 * "Unsealing" reveal for a reply body: the text surfaces line by line, top to
 * bottom, as if the paper is being unfolded — instead of the whole block
 * appearing at once. Under prefers-reduced-motion it renders the full text
 * immediately with no animation.
 *
 * `revealKey` should change when a new body should re-animate (e.g. the message
 * id), so opening a different letter replays the reveal.
 */
export function LineReveal({
  text,
  className,
  revealKey,
}: {
  text: string;
  className?: string;
  revealKey?: string;
}) {
  const reduce = useReducedMotion();
  const lines = toRevealLines(text);

  if (reduce) {
    return <p className={cn("whitespace-pre-line", className)}>{text}</p>;
  }

  // Cap the cascade: lines 1..8 stagger in sequence; line 9 onward all share
  // the 8th slot's delay so a long letter still finishes quickly instead of
  // dribbling out line-by-line. 8 * 0.06s = ~0.48s max lead, then springs.
  const MAX_STAGGER_STEPS = 8;

  return (
    <motion.span
      key={revealKey}
      data-el="line-reveal"
      className={cn("block", className)}
    >
      {lines.map((ln, i) => (
        <motion.span
          key={`${revealKey}-${i}`}
          className="block"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...paperSpring,
            delay: Math.min(i, MAX_STAGGER_STEPS) * LINE_STAGGER,
          }}
        >
          {ln}
        </motion.span>
      ))}
    </motion.span>
  );
}
