"use client";

import { useTranslation } from "react-i18next";
import { UserBadge } from "@/components/user-profile/user-badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

/** Top app chrome for owner-facing screens. */
export function WhisperHeader() {
  const { t } = useTranslation();
  return (
    <header
      data-el="app-header"
      className="flex items-center justify-between gap-2 px-5"
      style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
          {t("app.title")}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <UserBadge />
      </div>
    </header>
  );
}
