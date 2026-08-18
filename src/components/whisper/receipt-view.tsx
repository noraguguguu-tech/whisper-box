"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, MessageCircleHeart, Send, Flag } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { CrisisCard } from "@/components/whisper/crisis-card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { ConversationTurn, ReceiptView as ReceiptData } from "@/lib/whisper/types";
import { fetchReceipt, sendReceiptFollowup, reportReceipt } from "@/lib/api";

export function ReceiptView({ receiptId }: { receiptId: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchReceipt(receiptId).then((r) => {
      if (!alive) return;
      setReceipt(r);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [receiptId]);

  async function sendFollowup() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setNotice(null);
    const res = await sendReceiptFollowup(receiptId, text);
    setSending(false);
    if (res.ok) {
      setReceipt(res.data);
      setDraft("");
      return;
    }
    if (res.reason === "blocked_content") {
      setNotice(t("receipt.blockedContent"));
      if (res.category === "self_harm") setShowCrisis(true);
    } else if (res.reason === "rate_limited") {
      setNotice(t("receipt.rateLimited"));
    } else if (res.reason === "not_allowed") {
      // Thread closed by the owner — reflect it and refresh state.
      setNotice(t("receipt.closed"));
      fetchReceipt(receiptId).then((r) => r && setReceipt(r));
    } else {
      setNotice(t("receipt.sendFailed"));
    }
  }

  async function report() {
    const ok = await reportReceipt(receiptId);
    if (ok) setReported(true);
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(i18n.language);

  // Build the whole thread as a single keyed list so React never swaps an
  // element slot with a bare text node (that swap is what triggers the
  // "insertBefore" DOM crash when a browser translation extension has mutated
  // text nodes in place). Every slot is always a keyed <div>.
  type Row =
    | { kind: "bubble"; key: string; side: "you" | "them"; label: string; body: string; time?: string }
    | { kind: "waiting"; key: string };

  const rows: Row[] = receipt
    ? [
        {
          kind: "bubble" as const,
          key: "letter",
          side: "you" as const,
          label: t("receipt.you"),
          body: receipt.body,
          time: fmt(receipt.createdAt),
        },
        receipt.reply
          ? {
              kind: "bubble" as const,
              key: "reply",
              side: "them" as const,
              label: t("receipt.them"),
              body: receipt.reply,
              time: receipt.repliedAt ? fmt(receipt.repliedAt) : undefined,
            }
          : { kind: "waiting" as const, key: "waiting" },
        ...receipt.turns.map((turn: ConversationTurn) => ({
          kind: "bubble" as const,
          key: `turn-${turn.id}`,
          side: (turn.author === "owner" ? "them" : "you") as "you" | "them",
          label: turn.author === "owner" ? t("receipt.them") : t("receipt.you"),
          body: turn.body,
          time: fmt(turn.createdAt),
        })),
      ]
    : [];

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

      <button
        data-el="receipt-back"
        onClick={() => router.back()}
        className="mt-3 flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("receipt.back")}
      </button>

      {loaded && !receipt ? (
        <p className="mt-16 rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground gummy">
          {t("receipt.notFound")}
        </p>
      ) : receipt ? (
        <section className="pt-8">
          <div className="mb-5 flex items-center gap-2 text-primary">
            <MessageCircleHeart className="h-5 w-5" />
            <h1 className="font-heading text-xl font-bold text-foreground">
              {t("receipt.title")}
            </h1>
          </div>

          {/* Conversation thread — one keyed slot per row, never text↔element */}
          <div className="flex flex-col gap-3" data-el="receipt-thread" suppressHydrationWarning>
            {rows.map((row) =>
              row.kind === "bubble" ? (
                <div key={row.key}>
                  <Bubble side={row.side} label={row.label} body={row.body} time={row.time} />
                </div>
              ) : (
                <div key={row.key}>
                  <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground gummy">
                    {t("receipt.waiting")}
                  </p>
                </div>
              ),
            )}
          </div>

          {/* Follow-up composer (only once the owner has replied) */}
          {receipt.canFollowUp && (
            <div className="mt-5" data-el="receipt-followup">
              <GummyNote tint="#F6EFDD" el="followup-note">
                <textarea
                  data-el="followup-input"
                  value={draft}
                  maxLength={500}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("receipt.followupPlaceholder")}
                  rows={3}
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-foreground/40"
                />
                <div className="mt-1 text-right text-[11px] text-foreground/50">
                  {t("visitor.charCount", { count: draft.length })}
                </div>
              </GummyNote>
              <button
                data-el="followup-send"
                disabled={!draft.trim() || sending}
                onClick={sendFollowup}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
              >
                <Send className="h-4 w-4" />
                {sending ? t("receipt.followupSending") : t("receipt.followupSend")}
              </button>
              {notice && (
                <p
                  data-el="followup-notice"
                  className="mt-3 rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-xs font-medium text-accent"
                >
                  {notice}
                </p>
              )}
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {t("receipt.followupHint")}
              </p>
            </div>
          )}

          {/* Owner closed follow-ups on this thread. */}
          {receipt.reply && receipt.closed && (
            <p
              data-el="receipt-closed"
              className="mt-5 rounded-3xl bg-card p-5 text-center text-sm text-muted-foreground gummy"
            >
              {t("receipt.closed")}
            </p>
          )}

          {/* Report + save-link footer. */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {reported ? (
              <span className="text-[11px] font-medium text-accent">
                {t("receipt.reported")}
              </span>
            ) : (
              <button
                data-el="receipt-report"
                onClick={report}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                <Flag className="h-3 w-3" />
                {t("receipt.report")}
              </button>
            )}
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              {t("receipt.saveLink")}
            </p>
          </div>
        </section>
      ) : null}
      {showCrisis && <CrisisCard onClose={() => setShowCrisis(false)} />}
    </main>
  );
}

/** One conversation bubble. "you" = the anonymous visitor, "them" = the owner. */
function Bubble({
  side,
  label,
  body,
  time,
}: {
  side: "you" | "them";
  label: string;
  body: string;
  time?: string;
}) {
  const mine = side === "you";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <GummyNote
        tint={mine ? "#F6EFDD" : "#EDE4CE"}
        el={mine ? "bubble-you" : "bubble-them"}
        popped={!mine}
      >
        <div className="max-w-[15rem] sm:max-w-xs">
          <p
            className={
              mine
                ? "mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/50"
                : "mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary"
            }
          >
            {label}
          </p>
          <p className="text-[15px] leading-relaxed text-foreground" suppressHydrationWarning>
            {body}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-foreground/50" suppressHydrationWarning>
            {time ? (
              <>
                <Clock className="h-3 w-3" />
                {time}
              </>
            ) : null}
          </p>
        </div>
      </GummyNote>
    </div>
  );
}
