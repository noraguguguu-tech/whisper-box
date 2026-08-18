"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getLegalDoc, type LegalDocId } from "@/lib/whisper/legal-content";

/** Renders a bilingual legal document (privacy / terms) in the app's style. */
export function LegalPage({ docId }: { docId: LegalDocId }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language.startsWith("zh") ? "zh" : "en";
  const doc = getLegalDoc(docId, locale);

  return (
    <main
      data-el="legal-page"
      className="wall-aura relative mx-auto flex min-h-full w-full max-w-md flex-col"
      style={{
        paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Header: back + language */}
      <header data-el="legal-header" className="flex items-center justify-between gap-2 px-4">
        <button
          data-el="legal-back"
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-foreground/70"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("legal.back")}
        </button>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 px-6 pt-4">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-primary">
          {doc.title}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{doc.updated}</p>

        {/* Non-advice disclaimer callout */}
        <div
          data-el="legal-disclaimer"
          className="mt-4 flex gap-2 rounded-2xl border border-accent/30 bg-accent/10 p-3"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-[12px] leading-relaxed text-foreground/80">{doc.disclaimer}</p>
        </div>

        {/* Sections */}
        <div className="mt-5 flex flex-col gap-5 pb-6">
          {doc.sections.map((s, i) => (
            <section key={i} data-el="legal-section">
              <h2 className="mb-1.5 text-[15px] font-bold text-foreground">{s.heading}</h2>
              <div className="flex flex-col gap-1.5">
                {s.body.map((para, j) =>
                  para.startsWith("• ") ? (
                    <p
                      key={j}
                      className="pl-3 text-[13.5px] leading-relaxed text-foreground/80"
                    >
                      {para}
                    </p>
                  ) : (
                    <p key={j} className="text-[13.5px] leading-relaxed text-foreground/80">
                      {para}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
