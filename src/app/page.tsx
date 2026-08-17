"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { tintForId } from "@/lib/whisper/types";
import { MOCK_INBOX } from "@/lib/whisper/mock";

// Scattered slots for the cover — irregular, tossed-on-a-board feel.
const SLOTS = [
  { top: "4%", left: "6%", w: 58, rotate: -5, delay: "0s" },
  { top: "10%", left: "56%", w: 40, rotate: 6, delay: "1.2s" },
  { top: "34%", left: "60%", w: 38, rotate: -4, delay: "0.6s" },
  { top: "46%", left: "4%", w: 46, rotate: 5, delay: "1.7s" },
  { top: "64%", left: "48%", w: 46, rotate: -6, delay: "0.9s" },
  { top: "72%", left: "8%", w: 40, rotate: 4, delay: "2.1s" },
];

export default function CoverPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const notes = MOCK_INBOX.messages;

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
        <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground">
          {t("cover.title")}
        </h1>
        <p className="mt-2 max-w-[15rem] text-sm text-muted-foreground">
          {t("cover.subtitle")}
        </p>
      </header>

      {/* Scattered floating notes (display only) */}
      <div className="relative flex-1">
        {notes.map((m, i) => {
          const slot = SLOTS[i % SLOTS.length];
          return (
            <div
              key={m.id}
              data-el="cover-note"
              className="note-drift absolute"
              style={{
                top: slot.top,
                left: slot.left,
                width: `${slot.w}%`,
                animationDelay: slot.delay,
              }}
            >
              <GummyNote tint={tintForId(m.id)} rotate={slot.rotate}>
                <p
                  className="leading-snug text-foreground"
                  style={{ fontSize: slot.w > 50 ? 15 : 13 }}
                >
                  {truncate(m.body, slot.w > 50 ? 42 : 22)}
                </p>
              </GummyNote>
            </div>
          );
        })}
      </div>

      {/* Enter hint */}
      <div
        data-el="cover-enter"
        className="relative z-10 flex items-center justify-center gap-1.5 px-6 pt-2 text-sm font-semibold text-primary"
      >
        {t("cover.enter")}
        <ChevronRight className="h-4 w-4 animate-pulse" />
      </div>
    </main>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
