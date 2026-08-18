"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollText } from "lucide-react";

// Minimum age of use. Adjust per your target market before launch (commonly
// 13+ or 16+). Bump CONSENT_VERSION whenever the legal terms materially change
// so returning users must re-consent.
const MIN_AGE = 13;
const CONSENT_VERSION = "2026-08-18";
const STORAGE_KEY = "whisper.consent";

/**
 * First-visit compliance gate: an age affirmation + agreement to the Privacy
 * Policy and Terms, shown once (per consent version) before the app is usable.
 * Renders nothing once consent is recorded. Covers both owners and visitors
 * because it mounts globally in the root layout.
 */
export function ConsentGate() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  // undefined = not yet checked (avoid SSR/first-paint flash); true/false after.
  const [needed, setNeeded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setNeeded(stored !== CONSENT_VERSION);
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, CONSENT_VERSION);
    } catch {
      /* private mode / storage disabled — still dismiss for this session */
    }
    setNeeded(false);
  }

  if (needed !== true) return null;

  return (
    <div
      data-el="consent-gate"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl"
        initial={reduce ? false : { y: 40, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary/40">
          <ScrollText className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
          {t("consent.title")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/80">
          {t("consent.ageLine", { age: MIN_AGE })}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/80">
          {t("consent.agreeLine")}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          <Link
            data-el="consent-privacy"
            href="/legal/privacy"
            className="text-primary underline underline-offset-2"
          >
            {t("legal.privacyLink")}
          </Link>
          <Link
            data-el="consent-terms"
            href="/legal/terms"
            className="text-primary underline underline-offset-2"
          >
            {t("legal.termsLink")}
          </Link>
        </div>

        <button
          data-el="consent-accept"
          onClick={accept}
          className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground gummy"
        >
          {t("consent.accept", { age: MIN_AGE })}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {t("consent.declineHint", { age: MIN_AGE })}
        </p>
      </motion.div>
    </div>
  );
}
