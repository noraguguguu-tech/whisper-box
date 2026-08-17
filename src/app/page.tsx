"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { NOTE_TINTS } from "@/lib/whisper/types";

type Layer = "far" | "mid" | "hero";

// Layered composition: one big hero anchor up front, mid notes around it, and
// faded far notes behind for depth — irregular but composed, letter-paper tones.
interface CoverNote {
  zh: string;
  en: string;
  top: string;
  left: string;
  w: number; // % width
  rotate: number;
  layer: Layer;
  z: number;
  tint: number;
  delay: string;
}

const NOTES: CoverNote[] = [
  // far background — blurred + faded
  { zh: "很久没联系了，最近好吗？", en: "It's been a while — how are you?", top: "6%", left: "58%", w: 38, rotate: 6, layer: "far", z: 1, tint: 2, delay: "1.2s" },
  { zh: "祝你今天也有好心情 ☺", en: "Hope today treats you gently ☺", top: "41%", left: "63%", w: 33, rotate: -5, layer: "far", z: 1, tint: 4, delay: "0.6s" },
  { zh: "见字如面。", en: "Like seeing your face.", top: "72%", left: "60%", w: 31, rotate: 5, layer: "far", z: 1, tint: 5, delay: "1.9s" },
  // mid layer
  { zh: "偷偷说，我关注你很久了。", en: "I've quietly followed you for a while.", top: "9%", left: "5%", w: 50, rotate: -4, layer: "mid", z: 2, tint: 1, delay: "0.3s" },
  { zh: "谢谢你，那句话我记到现在。", en: "Thank you. I still remember it.", top: "66%", left: "6%", w: 47, rotate: 4, layer: "mid", z: 2, tint: 3, delay: "1.5s" },
  // hero anchor — big, sharp, front
  {
    zh: "今天你看起来很累，还好吗？想跟你说，慢慢来，没关系的。",
    en: "You looked tired today — are you okay? Take your time, it's alright.",
    top: "31%", left: "7%", w: 66, rotate: -2, layer: "hero", z: 3, tint: 0, delay: "0s",
  },
];

export default function CoverPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isZh = i18n.language.startsWith("zh");

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
      <header data-el="cover-title" className="relative z-20 px-6 pb-2">
        <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-primary">
          {t("cover.title")}
        </h1>
        <p className="mt-2 max-w-[15rem] text-sm text-muted-foreground">
          {t("cover.subtitle")}
        </p>
      </header>

      {/* Layered floating notes (display only) */}
      <div className="relative flex-1">
        {NOTES.map((n, i) => {
          const isHero = n.layer === "hero";
          return (
            <div
              key={i}
              data-el={isHero ? "cover-hero-note" : "cover-note"}
              className={[
                "absolute",
                isHero ? "note-drift-hero" : "note-drift",
                n.layer === "far" ? "note-far" : "",
              ].join(" ")}
              style={{
                top: n.top,
                left: n.left,
                width: `${n.w}%`,
                zIndex: n.z,
                animationDelay: n.delay,
              }}
            >
              <GummyNote tint={NOTE_TINTS[n.tint]} rotate={n.rotate} popped={isHero}>
                {isHero && (
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {isZh ? "无名信" : "Nameless"}
                  </p>
                )}
                <p
                  className="leading-relaxed text-foreground"
                  style={{ fontSize: isHero ? 17 : n.w > 44 ? 14 : 12.5 }}
                >
                  {isZh ? n.zh : n.en}
                </p>
              </GummyNote>
            </div>
          );
        })}
      </div>

      {/* Enter hint */}
      <div
        data-el="cover-enter"
        className="relative z-20 flex items-center justify-center gap-1.5 px-6 pt-2 text-sm font-semibold text-accent"
      >
        {t("cover.enter")}
        <ChevronRight className="h-4 w-4 animate-pulse" />
      </div>
    </main>
  );
}
