"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Megaphone, Send } from "lucide-react";

const TONES = ["soft", "curious", "bold"] as const;
type Tone = (typeof TONES)[number];

type Platform = "xhs" | "weibo" | "x" | "system";
const PLATFORMS: Platform[] = ["xhs", "weibo", "x", "system"];

/**
 * "Grab a caption & post" panel. Removes the #1 friction that stops owners from
 * sharing — not knowing what to write. Three ready-made captions (soft /
 * curious / bold) with the owner's link already appended.
 *
 * Each caption offers "copy & post to <platform>": we always copy the full text
 * to the clipboard first (so the owner can paste anywhere), then open the
 * platform's post entry. Weibo and X accept a prefilled-text share intent, so
 * the caption lands in the compose box directly. Xiaohongshu exposes no public
 * post intent, so we copy + open it and tell the owner to long-press paste.
 * "More" uses the native share sheet on devices that support it.
 */
export function SharePromoPanel({ shareUrl }: { shareUrl: string }) {
  const { t } = useTranslation();
  const [copiedTone, setCopiedTone] = useState<Tone | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function caption(tone: Tone): string {
    return t(`promo.captions.${tone}`, { url: shareUrl || "" });
  }

  async function writeClipboard(text: string) {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard blocked — the share intent still carries the text */
    }
  }

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((c) => (c === msg ? null : c)), 2600);
  }

  async function copyOnly(tone: Tone) {
    await writeClipboard(caption(tone));
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone((c) => (c === tone ? null : c)), 1600);
  }

  async function postTo(tone: Tone, platform: Platform) {
    const text = caption(tone);
    // Always copy first so the caption is ready to paste on any platform.
    await writeClipboard(text);

    if (platform === "system") {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ text });
          return;
        } catch {
          /* user dismissed — fall through to toast */
        }
      }
      flashToast(t("promo.copied"));
      return;
    }

    if (platform === "x") {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (platform === "weibo") {
      // Weibo web share accepts prefilled title text.
      const url = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // Xiaohongshu: no public compose intent. Copy + open, prompt to paste.
    flashToast(t("promo.xhsHint"));
    window.open("https://www.xiaohongshu.com", "_blank", "noopener,noreferrer");
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
                    onClick={() => copyOnly(tone)}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-primary/25 px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-40"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? t("promo.copied") : t("promo.copy")}
                  </button>
                </div>
                <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/85">
                  {caption(tone)}
                </p>

                {/* Copy & jump to a platform's post entry */}
                <div className="mt-2.5 border-t border-primary/10 pt-2.5">
                  <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Send className="h-3 w-3" />
                    {t("promo.postTo")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        data-el="promo-post"
                        disabled={!shareUrl}
                        onClick={() => postTo(tone, p)}
                        className="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-40 gummy"
                      >
                        {t(`promo.platform.${p}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {t("promo.note")}
        </p>
      </div>

      {toast && (
        <div
          data-el="promo-toast"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] mx-auto w-fit max-w-[88%] rounded-full bg-foreground/90 px-4 py-2.5 text-center text-xs font-medium text-background shadow-lg"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
