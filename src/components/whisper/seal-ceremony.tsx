"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { sealSpring, paperSpring, hapticTap } from "@/lib/whisper/motion";

/**
 * The "sealing" ceremony played the moment a visitor sends a letter. It is a
 * short, skippable overlay: the paper collapses, a vermilion wax seal slams
 * down (with ink bloom + one haptic tap), then the letter arcs away as if
 * dropped into the letterbox. On completion `onDone` fires so the caller can
 * reveal the receipt. Honors prefers-reduced-motion by finishing instantly.
 */
export function SealCeremony({
  previewText,
  onDone,
}: {
  previewText: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  // Reduced motion: no animation, just resolve on the next tick.
  useEffect(() => {
    if (!reduce) return;
    const id = window.setTimeout(onDone, 60);
    return () => window.clearTimeout(id);
  }, [reduce, onDone]);

  if (reduce) return null;

  const paper: Variants = {
    initial: { scale: 1, y: 0, rotate: 0, opacity: 1 },
    collapse: { scale: 0.96, y: 0, transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] } },
    drop: {
      // Arc down-and-away, like the letter falling into the box.
      x: 40,
      y: 220,
      rotate: 8,
      scale: 0.7,
      opacity: 0,
      transition: { ...paperSpring, damping: 22 },
    },
  };

  return (
    <motion.div
      data-el="seal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDone} // tap anywhere to skip
    >
      <motion.div
        data-el="seal-letter"
        className="gummy gummy-sheen relative w-64 rounded-[26px] border border-white/50 p-5"
        style={{ background: "#FBF6EA" }}
        variants={paper}
        initial="initial"
        animate={["collapse", "drop"]}
        onAnimationComplete={(def) => {
          if (def === "drop") onDone();
        }}
      >
        <p className="line-clamp-3 text-[15px] leading-relaxed text-foreground/70">
          {previewText}
        </p>

        {/* Wax seal: slams down with a bounce, ink blooms underneath. */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-6 flex justify-center">
          <div className="relative">
            {/* Ink bloom */}
            <motion.span
              className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(192,57,43,0.35), transparent 70%)" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1.2], opacity: [0, 0.9, 0.5] }}
              transition={{ delay: 0.16, duration: 0.4, ease: "easeOut" }}
            />
            {/* Seal disc */}
            <motion.div
              initial={{ scale: 1.6, rotate: -12, y: -80, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
              transition={{ ...sealSpring, delay: 0.16 }}
              onAnimationStart={() => window.setTimeout(() => hapticTap(12), 160)}
            >
              <SealDisc label={t("cover.stamp")} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** The vermilion wax-seal disc with an engraved label. */
function SealDisc({ label }: { label: string }) {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full text-center"
      style={{
        background: "radial-gradient(circle at 35% 30%, #D8543F, #C0392B 60%, #9E2A1E)",
        boxShadow: "0 6px 14px rgba(158,42,30,0.45), inset 0 2px 4px rgba(255,255,255,0.25)",
      }}
    >
      <span
        className="px-1 text-[10px] font-bold leading-tight text-[#FBF6EA]"
        style={{ textShadow: "0 1px 1px rgba(0,0,0,0.25)" }}
      >
        {label}
      </span>
    </div>
  );
}
