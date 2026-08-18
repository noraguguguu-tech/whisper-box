"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { hapticTap, paperSpring } from "@/lib/whisper/motion";

const LONG_PRESS_MS = 450;

/**
 * The sealed cover shown for an UNREAD, collapsed letter in the owner inbox.
 * It keeps the body hidden behind a wax seal (so opening still feels like
 * unsealing), breathes slowly to draw the eye, and supports a long-press
 * "peek" that lifts a corner to reveal the first lines — without consuming the
 * unread state. A normal tap still bubbles up to open (handled by the caller).
 *
 * We intercept the click only when a peek actually fired, so long-press to peek
 * doesn't also open the letter.
 */
export function SealedCover({
  body,
  onOpen,
}: {
  body: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [peeking, setPeeking] = useState(false);
  const timer = useRef<number | null>(null);
  const peeked = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const startPeek = useCallback(() => {
    if (reduce) return; // no peek gesture under reduced motion
    peeked.current = false;
    timer.current = window.setTimeout(() => {
      peeked.current = true;
      setPeeking(true);
      hapticTap(10);
    }, LONG_PRESS_MS);
  }, [reduce]);

  const endPeek = useCallback(() => {
    clearTimer();
    setPeeking(false);
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    // If a long-press peek fired, swallow this click so we don't also open.
    if (peeked.current) {
      peeked.current = false;
      return;
    }
    onOpen();
  }, [onOpen]);

  const previewLines = body.split(/\n+/).filter(Boolean).slice(0, 2).join(" ");

  return (
    <motion.button
      type="button"
      data-el="sealed-cover"
      onClick={handleClick}
      onPointerDown={startPeek}
      onPointerUp={endPeek}
      onPointerLeave={endPeek}
      onPointerCancel={endPeek}
      className="relative flex w-full flex-col items-center gap-2 py-2 text-center"
      // Slow "breathing" to signal an unopened letter waiting to be read.
      animate={reduce ? undefined : { scale: [1, 1.015, 1] }}
      transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ touchAction: "manipulation" }}
    >
      {/* Unopened crease line across the paper */}
      <span className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-foreground/10" />

      {/* Wax seal */}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #D8543F, #C0392B 60%, #9E2A1E)",
          boxShadow: "0 4px 10px rgba(158,42,30,0.4), inset 0 2px 3px rgba(255,255,255,0.25)",
        }}
      >
        <Send className="h-4 w-4 text-[#FBF6EA]" />
      </span>
      <span className="text-xs font-medium text-foreground/60">{t("inbox.sealedHint")}</span>

      {/* Peek: a corner lifts, revealing the first lines underneath. */}
      {peeking && (
        <motion.div
          data-el="peek-preview"
          className="pointer-events-none absolute inset-x-3 bottom-full mb-1 rounded-2xl border border-white/60 bg-card/95 p-3 text-left shadow-lg"
          initial={{ opacity: 0, y: 6, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={paperSpring}
        >
          <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground/80">
            {previewLines || body}
          </p>
        </motion.div>
      )}
    </motion.button>
  );
}
