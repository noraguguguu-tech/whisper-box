"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ShieldAlert, Check } from "lucide-react";
import { LetterButton } from "@/components/whisper/letter-button";
import { submitTakedown, type TakedownReason } from "@/lib/api";

const REASONS: TakedownReason[] = [
  "defamation",
  "privacy",
  "harassment",
  "illegal",
  "minor",
  "other",
];

/**
 * Third-party takedown form for a PUBLIC letter. Any viewer (not just the owner
 * or sender) can flag content they believe defames or exposes them. No login.
 */
export function TakedownDialog({
  targetRef,
  onClose,
}: {
  targetRef: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<TakedownReason>("privacy");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit() {
    setSending(true);
    setFailed(false);
    const ok = await submitTakedown({ targetRef, reason, details, contact });
    setSending(false);
    if (ok) setDone(true);
    else setFailed(true);
  }

  return (
    <div
      data-el="takedown-dialog"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-heading text-base font-bold text-foreground">
            <ShieldAlert className="h-4 w-4 text-accent" />
            {t("takedown.title")}
          </h3>
          <button data-el="takedown-close" onClick={onClose} aria-label={t("common.close")}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-secondary/40">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">{t("takedown.done")}</p>
            <LetterButton onClick={onClose} variant="primary" size="md" className="mt-4 px-5">
              {t("common.close")}
            </LetterButton>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
              {t("takedown.intro")}
            </p>

            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              {t("takedown.reasonLabel")}
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  data-el="takedown-reason"
                  onClick={() => setReason(r)}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs font-medium " +
                    (reason === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gummy-border bg-gummy-fill text-foreground/70")
                  }
                >
                  {t(`takedown.reason.${r}`)}
                </button>
              ))}
            </div>

            <textarea
              data-el="takedown-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("takedown.detailsPlaceholder")}
              rows={3}
              className="mb-3 w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
            />
            <input
              data-el="takedown-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("takedown.contactPlaceholder")}
              className="mb-4 w-full rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
            />

            <LetterButton
              data-el="takedown-submit"
              disabled={sending}
              onClick={submit}
              variant="accent-solid"
              size="md"
              fullWidth
            >
              {t("takedown.submit")}
            </LetterButton>
            {failed && (
              <p data-el="takedown-error" className="mt-2 text-center text-[12px] text-destructive">
                {t("takedown.failed")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
