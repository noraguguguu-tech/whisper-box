"use client";

import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { tintForId } from "@/lib/whisper/types";
import type { PublicEntry } from "@/lib/whisper/types";

const ROTATIONS = [-2, 1.6, -1.4, 2];

/**
 * The list of public letters (question + owner reply) shown on both the visitor
 * writing page and the standalone public-wall page. Extracted so both surfaces
 * render identical cards. `onReport` receives the entry id when a viewer flags a
 * public letter; omit it to hide the report affordance.
 */
export function PublicWall({
  entries,
  onReport,
}: {
  entries: PublicEntry[];
  onReport?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {entries.map((e, i) => (
        <GummyNote
          key={e.id}
          tint={tintForId(e.id)}
          rotate={ROTATIONS[i % ROTATIONS.length]}
          el="public-note"
        >
          <p className="text-[15px] leading-relaxed text-foreground">{e.body}</p>
          <div className="mt-3 rounded-2xl bg-gummy-fill-strong p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              {t("inbox.yourReply")}
            </p>
            <p className="text-sm text-foreground">{e.reply}</p>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("receipt.repliedAt", {
              time: new Date(e.repliedAt).toLocaleDateString(i18n.language),
            })}
          </p>
          {onReport && (
            <button
              data-el="wall-report"
              onClick={() => onReport(e.id)}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70 underline underline-offset-2"
            >
              <Flag className="h-3 w-3" />
              {t("takedown.reportPublic")}
            </button>
          )}
        </GummyNote>
      ))}
    </div>
  );
}
