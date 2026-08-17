"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { NOTE_TINTS } from "@/lib/whisper/types";

// Short letter-like snippets shown as floating preview notes on the cover.
// Kept as its own cover fixture so the cover fullness is independent of the inbox.
const COVER_NOTES_ZH = [
  "今天你看起来很累，还好吗？",
  "偷偷说，我关注你很久了。",
  "谢谢你，那句话我记到了现在。",
  "有件事一直没敢当面问你…",
  "见字如面，愿你一切都好。",
  "祝你今天也有好心情 ☺",
  "想给你写封信，却不知从何说起。",
  "很久没联系了，最近好吗？",
];
const COVER_NOTES_EN = [
  "You looked tired today — are you okay?",
  "I've quietly followed you for a while.",
  "Thank you. I still remember those words.",
  "There's something I never dared to ask…",
  "Reading this is like seeing your face.",
  "Hope today treats you gently ☺",
  "I wanted to write, but where to start?",
  "It's been a while — how have you been?",
];

// Scattered slots — irregular positions + sizes, airy but fuller. Tuned so
// notes don't overlap the title or the enter hint, with breathing room kept.
const SLOTS = [
  { top: "1%", left: "3%", w: 55, rotate: -5, delay: "0s" },
  { top: "3%", left: "62%", w: 34, rotate: 6, delay: "1.2s" },
  { top: "22%", left: "56%", w: 40, rotate: -4, delay: "0.6s" },
  { top: "30%", left: "4%", w: 38, rotate: 4, delay: "1.7s" },
  { top: "46%", left: "50%", w: 44, rotate: -6, delay: "0.9s" },
  { top: "52%", left: "6%", w: 42, rotate: 5, delay: "2.1s" },
  { top: "70%", left: "54%", w: 38, rotate: -3, delay: "1.4s" },
  { top: "74%", left: "8%", w: 46, rotate: 4, delay: "0.4s" },
];

export default function CoverPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isZh = i18n.language.startsWith("zh");
  const notes = isZh ? COVER_NOTES_ZH : COVER_NOTES_EN;

  return (
    <main
      data-el="cover-page"
      onClick={() => router.push("/inbox")}
      className="wall-aura relative mx-auto flex min-h-full w-full max-w-md cursor-pointer flex-col overflow-hidden"
      style={{
        paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Title */}
      <header data-el="cover-title" className="relative z-10 px-6 pb-2">
        <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-primary">
          {t("cover.title")}
        </h1>
        <p className="mt-2 max-w-[15rem] text-sm text-muted-foreground">
          {t("cover.subtitle")}
        </p>
      </header>

      {/* Scattered floating notes (display only) */}
      <div className="relative flex-1">
        {SLOTS.map((slot, i) => (
          <div
            key={i}
            data-el="cover-note"
            className="note-drift absolute"
            style={{
              top: slot.top,
              left: slot.left,
              width: `${slot.w}%`,
              animationDelay: slot.delay,
            }}
          >
            <GummyNote tint={NOTE_TINTS[i % NOTE_TINTS.length]} rotate={slot.rotate}>
              <p
                className="leading-snug text-foreground"
                style={{ fontSize: slot.w > 48 ? 14 : 12.5 }}
              >
                {notes[i % notes.length]}
              </p>
            </GummyNote>
          </div>
        ))}
      </div>

      {/* Enter hint */}
      <div
        data-el="cover-enter"
        className="relative z-10 flex items-center justify-center gap-1.5 px-6 pt-2 text-sm font-semibold text-accent"
      >
        {t("cover.enter")}
        <ChevronRight className="h-4 w-4 animate-pulse" />
      </div>
    </main>
  );
}
