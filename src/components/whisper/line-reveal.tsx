"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
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

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: LINE_STAGGER } },
  };
  const line: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: paperSpring },
  };

  return (
    <motion.span
      key={revealKey}
      data-el="line-reveal"
      className={cn("block", className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {lines.map((ln, i) => (
        <motion.span key={`${revealKey}-${i}`} variants={line} className="block">
          {ln}
        </motion.span>
      ))}
    </motion.span>
  );
}
