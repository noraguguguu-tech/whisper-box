"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Megaphone } from "lucide-react";

const TONES = ["soft", "curious", "bold"] as const;
type Tone = (typeof TONES)[number];

/**
 * "Grab a caption & post" panel. Removes the #1 friction that stops owners from
 * sharing — not knowing what to write. Three ready-made captions (soft /
 * curious / bold) with the owner's link already appended; one tap copies the
 * whole thing to paste on Xiaohongshu, Weibo, IG, WeChat, etc.
 */
export function SharePromoPanel({ shareUrl }: { shareUrl: string }) {
  const { t } = useTranslation();
  const [copiedTone, setCopiedTone] = useState<Tone | null>(null);

  function caption(tone: Tone): string {
    // Interpolate the absolute link into the localized template.
    return t(`promo.captions.${tone}`, { url: shareUrl || "" });
  }

  function copy(tone: Tone) {
    const text = caption(tone);
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone((c) => (c === tone ? null : c)), 1600);
  }

  return (
    <section data-el="share-promo" className="px-5 pt-3">
      <div className="rounded-[30px] border border-white/60 bg-card p-5 gummy">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
          <Megaphone className="h-4 w-4" />
          {t("promo.title")}
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {t("promo.hint")}
        </p>

        <div className="flex flex-col gap-3">
          {TONES.map((tone) => {
            const isCopied = copiedTone === tone;
            return (
              <div
                key={tone}
                data-el="promo-caption"
                className="rounded-2xl border border-primary/15 bg-background/60 p-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {t(`promo.tones.${tone}`)}
                  </span>
                  <button
                    data-el="promo-copy"
                    disabled={!shareUrl}
                    onClick={() => copy(tone)}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground disabled:opacity-40 gummy"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? t("promo.copied") : t("promo.copy")}
                  </button>
                </div>
                <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/85">
                  {caption(tone)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {t("promo.note")}
        </p>
      </div>
    </section>
  );
}
