"use client";

import { use, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Send, Sparkles, MessageCircleHeart } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { tintForId } from "@/lib/whisper/types";
import { MOCK_INBOX, MOCK_PUBLIC_ENTRIES } from "@/lib/whisper/mock";

const ROTATIONS = [-2, 1.6, -1.4, 2];

export default function VisitorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t, i18n } = useTranslation();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const prompt = MOCK_INBOX.prompt;
  const publicEntries = MOCK_PUBLIC_ENTRIES;

  const receiptUrl = useMemo(
    () =>
      receiptId && typeof window !== "undefined"
        ? `${window.location.origin}/r/${receiptId}`
        : "",
    [receiptId],
  );

  function submit() {
    if (!text.trim()) return;
    setSending(true);
    setTimeout(() => {
      setReceiptId(`rc-${Math.random().toString(36).slice(2, 10)}`);
      setSending(false);
    }, 500);
  }
  function copyReceipt() {
    navigator.clipboard?.writeText(receiptUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main
      data-el="visitor-page"
      className="mx-auto flex min-h-full w-full max-w-md flex-col px-5"
      style={{
        paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">/u/{slug}</span>
        <LanguageSwitcher />
      </div>

      {receiptId ? (
        <SentCard
          receiptUrl={receiptUrl}
          copied={copied}
          onCopy={copyReceipt}
          onAgain={() => {
            setReceiptId(null);
            setText("");
          }}
        />
      ) : (
        <section data-el="compose-card" className="pt-6">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <MessageCircleHeart className="h-5 w-5" />
            <h1 className="font-heading text-xl font-bold text-foreground">
              {t("visitor.heading")}
            </h1>
          </div>
          <p className="mb-4 rounded-2xl bg-card p-3 text-sm leading-relaxed text-foreground gummy">
            {prompt}
          </p>
          <GummyNote tint="#FFE0E6" el="compose-note">
            <textarea
              data-el="visitor-input"
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("visitor.placeholder")}
              rows={4}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-foreground/40"
            />
            <div className="mt-1 text-right text-[11px] text-foreground/50">
              {t("visitor.charCount", { count: text.length })}
            </div>
          </GummyNote>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("visitor.anonymousNote")}
          </p>
          <button
            data-el="visitor-send"
            disabled={!text.trim() || sending}
            onClick={submit}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
          >
            <Send className="h-4 w-4" />
            {sending ? t("visitor.sending") : t("visitor.send")}
          </button>
        </section>
      )}

      {/* Public wall */}
      <section data-el="public-wall" className="pt-8">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 font-heading text-base font-bold text-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          {t("visitor.wallTitle")}
        </h2>
        {publicEntries.length === 0 ? (
          <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
            {t("visitor.wallEmpty")}
          </p>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {publicEntries.map((e, i) => (
              <GummyNote
                key={e.id}
                tint={tintForId(e.id)}
                rotate={ROTATIONS[i % ROTATIONS.length]}
                el="public-note"
              >
                <p className="text-[15px] leading-relaxed text-foreground">{e.body}</p>
                <div className="mt-3 rounded-2xl bg-white/60 p-3">
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
              </GummyNote>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SentCard({
  receiptUrl,
  copied,
  onCopy,
  onAgain,
}: {
  receiptUrl: string;
  copied: boolean;
  onCopy: () => void;
  onAgain: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section data-el="sent-card" className="pt-8">
      <GummyNote tint="#DDF5E9" el="sent-note" popped>
        <div className="mb-2 flex items-center gap-2 text-secondary-foreground">
          <Check className="h-5 w-5" />
          <h1 className="font-heading text-lg font-bold">{t("visitor.sent")}</h1>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{t("visitor.sentDesc")}</p>
      </GummyNote>

      <div className="mt-5 rounded-[26px] bg-card p-4 gummy">
        <p className="mb-2 text-xs font-semibold text-primary">{t("visitor.yourReceipt")}</p>
        <div className="mb-3 truncate rounded-full bg-background px-4 py-2.5 font-mono text-xs text-foreground">
          {receiptUrl}
        </div>
        <button
          data-el="copy-receipt"
          onClick={onCopy}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground gummy"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("inbox.copied") : t("visitor.copyReceipt")}
        </button>
      </div>

      <button
        onClick={onAgain}
        className="mt-3 w-full rounded-full border border-white/60 bg-white/40 py-2.5 text-sm font-medium text-foreground/70"
      >
        {t("visitor.sendAnother")}
      </button>
    </section>
  );
}
