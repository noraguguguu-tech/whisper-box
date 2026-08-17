"use client";

import { use } from "react";
import { useTranslation } from "react-i18next";
import { Clock, MessageCircleHeart } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { MOCK_RECEIPT } from "@/lib/whisper/mock";

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = use(params);
  const { t, i18n } = useTranslation();

  // Frontend stage: show the sample receipt for the preview path.
  const receipt = MOCK_RECEIPT;

  return (
    <main
      data-el="receipt-page"
      className="mx-auto flex min-h-full w-full max-w-md flex-col px-5"
      style={{
        paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">/r/{receiptId}</span>
        <LanguageSwitcher />
      </div>

      <section className="pt-8">
        <div className="mb-5 flex items-center gap-2 text-primary">
          <MessageCircleHeart className="h-5 w-5" />
          <h1 className="font-heading text-xl font-bold text-foreground">
            {t("receipt.title")}
          </h1>
        </div>

        <GummyNote tint="#FFE0E6" el="receipt-message">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
            {t("receipt.youAsked")}
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">{receipt.body}</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-foreground/50">
            <Clock className="h-3 w-3" />
            {t("receipt.sentAt", {
              time: new Date(receipt.createdAt).toLocaleString(i18n.language),
            })}
          </p>
        </GummyNote>

        <div className="mt-5">
          {receipt.reply ? (
            <GummyNote tint="#DDF5E9" el="receipt-reply" popped>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {t("receipt.theyReplied")}
              </p>
              <p className="text-[15px] leading-relaxed text-foreground">{receipt.reply}</p>
              {receipt.repliedAt && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-foreground/50">
                  <Clock className="h-3 w-3" />
                  {t("receipt.repliedAt", {
                    time: new Date(receipt.repliedAt).toLocaleString(i18n.language),
                  })}
                </p>
              )}
            </GummyNote>
          ) : (
            <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground gummy">
              {t("receipt.waiting")}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
