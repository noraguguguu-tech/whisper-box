"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { NoteCard } from "@/components/whisper/note-card";
import { tintForId } from "@/lib/whisper/types";
import type { WhisperMessage } from "@/lib/whisper/types";
import { cn } from "@/utils/utils";

// Scatter slots (relative %) — irregular positions + sizes, like sticky notes
// tossed on a board. Cycled so any message count still looks scattered.
const SLOTS = [
  { top: "2%", left: "4%", w: 60, rotate: -4, delay: "0s" },
  { top: "6%", left: "58%", w: 40, rotate: 5, delay: "1.1s" },
  { top: "30%", left: "60%", w: 42, rotate: -3, delay: "0.5s" },
  { top: "40%", left: "3%", w: 44, rotate: 4, delay: "1.6s" },
  { top: "58%", left: "50%", w: 46, rotate: -5, delay: "0.8s" },
  { top: "66%", left: "6%", w: 42, rotate: 3, delay: "2s" },
];

/** The playful "notes tossed on a board" wall for the owner's inbox. */
export function ScatterWall({
  messages,
  openId,
  locale,
  onToggle,
  onReply,
  onTogglePublic,
}: {
  messages: WhisperMessage[];
  openId: string | null;
  locale: string;
  onToggle: (id: string) => void;
  onReply: (id: string, text: string) => void;
  onTogglePublic: (id: string) => void;
}) {
  const { t } = useTranslation();
  const openMsg = messages.find((m) => m.id === openId) ?? null;

  return (
    <div data-el="scatter-wall" className="relative flex-1">
      {/* Scattered collapsed notes */}
      <div className="relative mx-auto h-[520px] w-full max-w-md wall-aura">
        {messages.map((m, i) => {
          const slot = SLOTS[i % SLOTS.length];
          const isOpen = m.id === openId;
          return (
            <button
              key={m.id}
              data-el="scatter-note"
              onClick={() => onToggle(m.id)}
              aria-hidden={isOpen}
              style={{
                top: slot.top,
                left: slot.left,
                width: `${slot.w}%`,
                animationDelay: slot.delay,
                opacity: isOpen ? 0 : 1,
                pointerEvents: isOpen ? "none" : "auto",
              }}
              className="note-drift absolute text-left transition-opacity duration-200"
            >
              <GummyNote tint={tintForId(m.id)} rotate={slot.rotate} el="scatter-note-inner">
                <div className="mb-1.5 flex items-center gap-1.5">
                  {m.status === "unread" && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      {t("inbox.statusUnread")}
                    </span>
                  )}
                  {m.isPublic && <Globe className="h-3 w-3 text-secondary-foreground/70" />}
                </div>
                <p
                  className={cn(
                    "leading-snug text-foreground",
                    slot.w > 50 ? "text-[15px]" : "text-[13px]",
                  )}
                >
                  {truncate(m.body, slot.w > 50 ? 44 : 24)}
                </p>
              </GummyNote>
            </button>
          );
        })}
      </div>

      {/* Expanded note overlay — the focused card floats above the scatter */}
      {openMsg && (
        <div
          data-el="scatter-open-overlay"
          className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/20 px-5 backdrop-blur-sm"
          onClick={() => onToggle(openMsg.id)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <NoteCard
              message={openMsg}
              expanded
              rotate={0}
              locale={locale}
              onToggle={() => onToggle(openMsg.id)}
              onReply={(txt) => onReply(openMsg.id, txt)}
              onTogglePublic={() => onTogglePublic(openMsg.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
