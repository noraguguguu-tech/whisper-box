"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Compact legal footer linking to the Privacy Policy and Terms. Rendered on
 * the cover, the visitor writing view, and the owner inbox so both audiences
 * can reach the documents. `stop` prevents the click from bubbling to a parent
 * navigation handler (the cover page navigates on any click).
 */
export function LegalFooter({ stop = false }: { stop?: boolean }) {
  const { t } = useTranslation();
  return (
    <nav
      data-el="legal-footer"
      onClick={stop ? (e) => e.stopPropagation() : undefined}
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 text-[11px] text-muted-foreground/70"
    >
      <span>{t("legal.footerNote")}</span>
      <Link data-el="footer-privacy" href="/legal/privacy" className="underline underline-offset-2">
        {t("legal.privacyLink")}
      </Link>
      <span aria-hidden>·</span>
      <Link data-el="footer-terms" href="/legal/terms" className="underline underline-offset-2">
        {t("legal.termsLink")}
      </Link>
    </nav>
  );
}
