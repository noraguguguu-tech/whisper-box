"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, EyeOff, Unlock, Ban, KeyRound, Share2, Check } from "lucide-react";
import { LetterButton } from "@/components/whisper/letter-button";
import { hapticTap } from "@/lib/whisper/motion";

/**
 * "Our promise" — a shareable trust card. This is the app's stage-0
 * monetization move: instead of charging early, we make the anti-dark-pattern
 * stance (never sell anonymity, no subscription traps, no ads/data selling,
 * private receipts) a screenshot-able, shareable artifact that lifts virality.
 *
 * `variant` tunes chrome density for its two placements:
 *   "panel"  → owner Settings tab (full card, matches other setting sections)
 *   "footer" → visitor writing page footer (same content, lighter framing)
 */
const PROMISES = [
  { icon: EyeOff, label: "promise.item1Label", desc: "promise.item1Desc" },
  { icon: Unlock, label: "promise.item2Label", desc: "promise.item2Desc" },
  { icon: Ban, label: "promise.item3Label", desc: "promise.item3Desc" },
  { icon: KeyRound, label: "promise.item4Label", desc: "promise.item4Desc" },
] as const;

export function PromisePanel({
  variant = "panel",
  className = "",
}: {
  variant?: "panel" | "footer";
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function share() {
    hapticTap(10);
    // Share the promise itself (tagline), routing people to the product's
    // strongest word-of-mouth line — not any private link.
    const text = `${t("promise.cardTagline")} ${t("promise.title")}`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: t("promise.title"), text, url });
        return;
      }
    } catch {
      /* user dismissed the share sheet — fall through to copy */
    }
    try {
      await navigator.clipboard?.writeText(`${text} ${url}`.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can safely do */
    }
  }

  return (
    <section
      data-el="promise-panel"
      className={`rounded-[30px] border border-primary/15 bg-card p-5 gummy ${className}`}
    >
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
        <ShieldCheck className="h-4 w-4 text-accent" />
        {t("promise.title")}
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {t("promise.subtitle")}
      </p>

      <ul className="flex flex-col gap-3">
        {PROMISES.map(({ icon: Icon, label, desc }) => (
          <li key={label} data-el="promise-item" className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">{t(label)}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                {t(desc)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* The screenshot-able one-liner + share. */}
      <div className="mt-4 rounded-2xl bg-background/60 px-4 py-3 text-center">
        <p className="font-hand text-sm leading-relaxed text-primary">
          “{t("promise.cardTagline")}”
        </p>
      </div>
      <LetterButton
        data-el="promise-share"
        onClick={share}
        variant={variant === "footer" ? "secondary" : "accent"}
        size="sm"
        fullWidth
        className="mt-3"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? t("promise.shareCopied") : t("promise.shareCta")}
      </LetterButton>
    </section>
  );
}
