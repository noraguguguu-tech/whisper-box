"use client";

import { useTranslation } from "react-i18next";
import { ShieldAlert, Check, X } from "lucide-react";
import { LetterButton } from "@/components/whisper/letter-button";
import type { OwnerTakedown } from "@/lib/api";

/**
 * Owner-facing queue of third-party takedown requests about their public
 * letters. The owner reviews each, then either marks it actioned (after they
 * remove/unpublish the letter) or dismisses it. Both outcomes are audit-logged
 * server-side.
 */
export function TakedownQueue({
  items,
  onResolve,
}: {
  items: OwnerTakedown[];
  onResolve: (id: string, status: "actioned" | "dismissed") => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <section data-el="takedown-queue" className="mx-5 mb-4 rounded-3xl border border-accent/30 bg-accent/5 p-4">
      <h3 className="mb-1 flex items-center gap-1.5 font-heading text-sm font-bold text-accent">
        <ShieldAlert className="h-4 w-4" />
        {t("takedownQueue.title", { count: items.length })}
      </h3>
      <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
        {t("takedownQueue.desc")}
      </p>

      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <div key={it.id} data-el="takedown-item" className="rounded-2xl bg-white/70 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                {t(`takedown.reason.${it.reason}`)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(it.createdAt).toLocaleDateString(i18n.language)}
              </span>
            </div>
            {it.details && (
              <p className="break-words text-[13px] leading-relaxed text-foreground/80">{it.details}</p>
            )}
            {it.contact && (
              <p className="mt-1 break-words text-[11px] text-muted-foreground">
                {t("takedownQueue.contact")}: {it.contact}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <LetterButton
                data-el="takedown-action"
                onClick={() => onResolve(it.id, "actioned")}
                variant="accent-solid"
                size="sm"
                className="flex-1"
              >
                <Check className="h-3.5 w-3.5" />
                {t("takedownQueue.actioned")}
              </LetterButton>
              <LetterButton
                data-el="takedown-dismiss"
                onClick={() => onResolve(it.id, "dismissed")}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                <X className="h-3.5 w-3.5" />
                {t("takedownQueue.dismiss")}
              </LetterButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
