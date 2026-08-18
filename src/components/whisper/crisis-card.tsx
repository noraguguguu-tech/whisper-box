"use client";

import { useTranslation } from "react-i18next";
import { LifeBuoy } from "lucide-react";

/**
 * Crisis-resource modal shown when self-harm content is detected. Deliberately
 * gentle and non-judgmental — points the writer to real help. Not a substitute
 * for professional support; it is a first-line signpost.
 */
export function CrisisCard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      data-el="crisis-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6"
      onClick={onClose}
    >
      <div
        data-el="crisis-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[26px] bg-card p-6 text-center gummy"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
          {t("safety.crisisTitle")}
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-foreground">
          {t("safety.crisisBody")}
        </p>
        <p className="text-sm font-semibold text-primary">{t("safety.crisisHotlineCN")}</p>
        <p className="mb-4 text-xs text-muted-foreground">{t("safety.crisisHotlineIntl")}</p>
        <button
          data-el="crisis-close"
          onClick={onClose}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground gummy"
        >
          {t("safety.gotIt")}
        </button>
      </div>
    </div>
  );
}
