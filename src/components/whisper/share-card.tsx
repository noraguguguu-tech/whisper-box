"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Download, Share2, X } from "lucide-react";

/**
 * Share dialog for one public letter (question + owner reply).
 * - Copy link: the owner's public letterbox URL.
 * - Save image: renders a letter-paper card to a PNG via canvas.
 * - Share: Web Share API with the generated image when the browser supports it.
 */
export function ShareCard({
  question,
  reply,
  shareUrl,
  onClose,
}: {
  question: string;
  reply: string;
  shareUrl: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function renderPng(): string {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Paper background.
    ctx.fillStyle = "#F2EAD8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#FBF6EA";
    roundRect(ctx, 70, 90, W - 140, H - 180, 48);
    ctx.fill();
    ctx.strokeStyle = "rgba(36,59,107,0.14)";
    ctx.lineWidth = 3;
    roundRect(ctx, 70, 90, W - 140, H - 180, 48);
    ctx.stroke();

    // Title.
    ctx.fillStyle = "#C0392B";
    ctx.font = "600 40px Georgia, serif";
    ctx.fillText(t("inbox.shareTitleCard"), 130, 200);

    // Question block.
    let y = 300;
    ctx.fillStyle = "#243B6B";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText(t("inbox.shareQuestionLabel"), 130, y);
    y += 20;
    ctx.fillStyle = "#2B2B2B";
    ctx.font = "400 40px Georgia, serif";
    y = wrapText(ctx, question, 130, y + 44, W - 260, 58);

    // Divider.
    y += 40;
    ctx.strokeStyle = "rgba(36,59,107,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(130, y);
    ctx.lineTo(W - 130, y);
    ctx.stroke();

    // Reply block.
    y += 60;
    ctx.fillStyle = "#C0392B";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText(t("inbox.shareReplyLabel"), 130, y);
    ctx.fillStyle = "#2B2B2B";
    ctx.font = "400 40px Georgia, serif";
    wrapText(ctx, reply, 130, y + 64, W - 260, 58);

    // Footer.
    ctx.fillStyle = "rgba(36,59,107,0.55)";
    ctx.font = "400 28px Georgia, serif";
    ctx.fillText(shareUrl || t("inbox.shareTitleCard"), 130, H - 150);

    return canvas.toDataURL("image/png");
  }

  function download() {
    const url = renderPng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "nameless-letter.png";
    a.click();
  }

  async function systemShare() {
    const dataUrl = renderPng();
    try {
      if (dataUrl && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "nameless-letter.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareUrl });
          return;
        }
      }
      await navigator.share({ text: `${t("inbox.shareTitleCard")} ${shareUrl}`, url: shareUrl });
    } catch {
      /* user dismissed */
    }
  }

  return (
    <div
      data-el="share-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[32px] border border-white/60 bg-card p-5 gummy"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-foreground">
            {t("inbox.shareLetter")}
          </h3>
          <button data-el="share-close" onClick={onClose} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live preview of the card. */}
        <div
          ref={cardRef}
          data-el="share-preview"
          className="rounded-3xl border border-primary/15 bg-background p-5"
        >
          <p className="mb-3 font-heading text-sm font-semibold text-accent">
            {t("inbox.shareTitleCard")}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {t("inbox.shareQuestionLabel")}
          </p>
          <p className="mb-3 mt-1 text-sm leading-relaxed text-foreground">{question}</p>
          <div className="my-3 h-px bg-primary/15" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {t("inbox.shareReplyLabel")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{reply}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            data-el="share-copy"
            onClick={copyLink}
            disabled={!shareUrl}
            className="flex items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-background py-2.5 text-sm font-semibold text-primary disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("inbox.shareCopied") : t("inbox.shareCopyLink")}
          </button>
          <button
            data-el="share-download"
            onClick={download}
            className="flex items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-background py-2.5 text-sm font-semibold text-primary"
          >
            <Download className="h-4 w-4" />
            {t("inbox.shareDownload")}
          </button>
        </div>

        {canShare && (
          <button
            data-el="share-system"
            onClick={systemShare}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground gummy"
          >
            <Share2 className="h-4 w-4" />
            {t("inbox.shareSystem")}
          </button>
        )}

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("inbox.shareHint2")}
        </p>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws wrapped text; returns the y after the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const chars = Array.from(text);
  let line = "";
  let cursorY = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = ch;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY;
}
