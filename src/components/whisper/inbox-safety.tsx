"use client";

import { useTranslation } from "react-i18next";
import { ShieldAlert, Power, CheckCircle2, Trash2 } from "lucide-react";
import { LetterButton } from "@/components/whisper/letter-button";
import type { WhisperMessage } from "@/lib/whisper/types";

/**
 * Owner safety controls, shown in the Settings tab: an emergency "close inbox"
 * valve and a review-mode switch (suspicious-only vs review-everything).
 */
export function SettingsControls({
  closed,
  modMode,
  onToggleClosed,
  onSwitchMode,
}: {
  closed: boolean;
  modMode: "suspicious" | "all";
  onToggleClosed: () => void;
  onSwitchMode: (next: "suspicious" | "all") => void;
}) {
  const { t } = useTranslation();
  return (
    <section data-el="safety-controls" className="px-5 pt-3">
      <div className="rounded-[30px] border border-white/60 bg-card p-5 gummy">
        {/* Emergency close */}
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <Power className="h-4 w-4" />
          {t("inbox.closeBox")}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("inbox.closeBoxHint")}</p>
        <button
          data-el="toggle-closed"
          onClick={onToggleClosed}
          className={
            closed
              ? "flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground gummy"
              : "flex w-full items-center justify-center gap-1.5 rounded-full border border-gummy-border bg-gummy-fill py-2.5 text-sm font-semibold text-foreground/70"
          }
        >
          {closed ? t("inbox.boxClosedState") : t("inbox.boxOpen")}
        </button>

        {/* Review mode */}
        <div className="mt-5 mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldAlert className="h-4 w-4" />
          {t("inbox.moderationModeLabel")}
        </div>
        <div className="flex gap-2">
          <ModeButton
            active={modMode === "suspicious"}
            label={t("inbox.moderationSuspicious")}
            onClick={() => onSwitchMode("suspicious")}
          />
          <ModeButton
            active={modMode === "all"}
            label={t("inbox.moderationAll")}
            onClick={() => onSwitchMode("all")}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("inbox.moderationHint")}
        </p>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      data-el="mode-button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground gummy"
          : "flex-1 rounded-full border border-gummy-border bg-gummy-fill px-3 py-2 text-xs font-medium text-foreground/70"
      }
    >
      {label}
    </button>
  );
}

/**
 * Review queue for flagged letters. Each item can be approved into the inbox or
 * deleted outright. Pending letters never counted toward unread or the wall.
 */
export function PendingQueue({
  items,
  onApprove,
  onReject,
}: {
  items: WhisperMessage[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <section data-el="pending-queue" className="px-5 pb-2 pt-1">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
          <ShieldAlert className="h-4 w-4 text-accent" />
          {t("inbox.pendingTitle")}
        </h3>
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
          {t("inbox.pendingBadge", { count: items.length })}
        </span>
      </div>
      <p className="mb-3 px-1 text-xs text-muted-foreground">{t("inbox.pendingDesc")}</p>
      <div className="flex flex-col gap-3">
        {items.map((m) => (
          <div
            key={m.id}
            data-el="pending-item"
            className="rounded-3xl border border-accent/30 bg-accent/5 p-4"
          >
            <p className="text-[15px] leading-relaxed text-foreground">{m.body}</p>
            <div className="mt-3 flex gap-2">
              <LetterButton
                data-el="approve-pending"
                onClick={() => onApprove(m.id)}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("inbox.approve")}
              </LetterButton>
              <LetterButton
                data-el="reject-pending"
                onClick={() => onReject(m.id)}
                variant="danger"
                size="sm"
                className="flex-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("inbox.reject")}
              </LetterButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
