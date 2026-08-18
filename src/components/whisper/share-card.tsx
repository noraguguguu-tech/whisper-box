"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Download, Share2, X } from "lucide-react";
import QRCode from "qrcode";

const BG_SRC = "/share/letter-bg.png";
const W = 1024;
const H = 1280;

/**
 * Share dialog for one public letter (question + owner reply).
 * Renders a letter-paper card (fixed parchment background + wax seal +
 * handwritten title) to a PNG via canvas.
 * - Copy link: the owner's public letterbox URL.
 * - Save image: downloads the composed PNG.
 * - Share: Web Share API with the generated image when supported.
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
  const bgRef = useRef<HTMLImageElement | null>(null);
  const qrRef = useRef<HTMLImageElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  // Preload the parchment background so canvas renders are instant + complete.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      bgRef.current = img;
      setBgReady(true);
    };
    img.src = BG_SRC;
  }, []);

  // Encode the letterbox URL into a scannable QR. This is the viral bridge: a
  // screenshot circulating anywhere stays actionable — a passerby can scan it to
  // land on the box and open their own, no typing a URL from an image.
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl("");
      return;
    }
    let alive = true;
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#243B6Bff", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!alive) return;
        setQrDataUrl(url);
        const img = new Image();
        img.onload = () => {
          qrRef.current = img;
        };
        img.src = url;
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [shareUrl]);

  function handFamily(): string {
    if (typeof window === "undefined") return "cursive";
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-hand")
      .trim();
    return v || "cursive";
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function renderPng(): Promise<string> {
    // Ensure the brush webfont is ready before drawing to canvas.
    try {
      await document.fonts.ready;
    } catch {
      /* older browsers: fall through with fallback font */
    }
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    if (bgRef.current) {
      ctx.drawImage(bgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#F2EAD8";
      ctx.fillRect(0, 0, W, H);
    }

    const hand = handFamily();
    const PAD = 130;
    const maxW = W - PAD * 2;

    // Handwritten title.
    ctx.fillStyle = "#243B6B";
    ctx.font = `400 66px ${hand}`;
    ctx.fillText(t("inbox.shareTitleCard"), PAD, 210);

    // Question.
    let y = 320;
    ctx.fillStyle = "#C0392B";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText(t("inbox.shareQuestionLabel"), PAD, y);
    ctx.fillStyle = "#2B2B2B";
    ctx.font = "400 40px Georgia, serif";
    y = wrapText(ctx, question, PAD, y + 56, maxW, 58);

    // Divider.
    y += 46;
    ctx.strokeStyle = "rgba(36,59,107,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();

    // Reply.
    y += 64;
    ctx.fillStyle = "#C0392B";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText(t("inbox.shareReplyLabel"), PAD, y);
    ctx.fillStyle = "#2B2B2B";
    ctx.font = "400 40px Georgia, serif";
    wrapText(ctx, reply, PAD, y + 60, maxW, 58);

    // Footer link.
    ctx.fillStyle = "rgba(36,59,107,0.55)";
    ctx.font = "400 26px Georgia, serif";
    ctx.fillText(shareUrl || "", PAD, H - 150);

    return canvas.toDataURL("image/png");
  }

  async function download() {
    const url = await renderPng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "nameless-letter.png";
    a.click();
  }

  async function systemShare() {
    const dataUrl = await renderPng();
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

        {/* Live preview of the letter card (mirrors the exported image). */}
        <div
          data-el="share-preview"
          className="relative overflow-hidden rounded-3xl border border-primary/15 bg-cover bg-center p-5 shadow-inner"
          style={{ backgroundImage: `url(${BG_SRC})` }}
        >
          <p
            className="mb-4 text-3xl leading-none text-primary"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            {t("inbox.shareTitleCard")}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {t("inbox.shareQuestionLabel")}
          </p>
          <p className="mb-3 mt-1 text-sm leading-relaxed text-foreground">{question}</p>
          <div className="my-3 h-px bg-primary/20" />
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
            disabled={!bgReady}
            className="flex items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-background py-2.5 text-sm font-semibold text-primary disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {t("inbox.shareDownload")}
          </button>
        </div>

        {canShare && (
          <button
            data-el="share-system"
            onClick={systemShare}
            disabled={!bgReady}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
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
