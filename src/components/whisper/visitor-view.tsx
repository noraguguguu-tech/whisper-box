"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Copy, Check, Send, Sparkles, MessageCircleHeart, Mail, Lock, PenLine } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { LetterButton } from "@/components/whisper/letter-button";
import { PromisePanel } from "@/components/whisper/promise-panel";
import { PublicWall } from "@/components/whisper/public-wall";
import { CrisisCard } from "@/components/whisper/crisis-card";
import { SealCeremony } from "@/components/whisper/seal-ceremony";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LegalFooter } from "@/components/whisper/legal-footer";
import { TakedownDialog } from "@/components/whisper/takedown-dialog";
import { tintForId } from "@/lib/whisper/types";
import type { PublicEntry } from "@/lib/whisper/types";
import { fetchVisitorInbox, sendVisitorMessage } from "@/lib/api";
import {
  getRememberedLetters,
  rememberLetter,
  clearRememberedLetters,
  type RememberedLetter,
} from "@/lib/whisper/local-letters";

const ROTATIONS = [-2, 1.6, -1.4, 2];

export function VisitorView({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [wall, setWall] = useState<PublicEntry[]>([]);
  const [closed, setClosed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState<RememberedLetter[]>([]);
  // Friendly inline notice for a rejected send (screen / throttle / crisis).
  const [notice, setNotice] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  // Public-wall takedown: holds the target message id while the form is open.
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  // The sealing ceremony: holds { receiptId, preview } while it plays, then
  // resolves into the receipt view. Null when idle.
  const [sealing, setSealing] = useState<{ receiptId: string; preview: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchVisitorInbox(slug).then((data) => {
      if (!alive) return;
      if (!data) {
        setNotFound(true);
      } else {
        setPrompt(data.prompt);
        setWall(data.wall);
        setClosed(data.closed);
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // Remembered letters live only in this browser; read them after mount.
  // Deferred via microtask so setState isn't synchronous in the effect body.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setMine(getRememberedLetters(slug));
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const receiptUrl = useMemo(
    () =>
      receiptId && typeof window !== "undefined"
        ? `${window.location.origin}/r/${receiptId}`
        : "",
    [receiptId],
  );

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    setNotice(null);
    const body = text.trim();
    const res = await sendVisitorMessage(slug, body);
    setSending(false);
    if (res.ok) {
      rememberLetter({ receiptId: res.data.receiptId, slug, preview: body });
      setMine(getRememberedLetters(slug));
      // Play the sealing ceremony; it resolves into the receipt on completion.
      setSealing({ receiptId: res.data.receiptId, preview: body });
      return;
    }
    // Rejected — show a precise, non-punitive message. Self-harm content also
    // surfaces crisis resources instead of just a block.
    if (res.reason === "blocked_content") {
      setNotice(t("visitor.blockedContent"));
      if (res.category === "self_harm") setShowCrisis(true);
    } else if (res.reason === "rate_limited") {
      setNotice(t("visitor.rateLimited"));
    } else if (res.reason === "inbox_closed") {
      setNotice(t("visitor.boxClosed"));
      setClosed(true);
    } else {
      setNotice(t("visitor.sendFailed"));
    }
  }
  function copyReceipt() {
    navigator.clipboard?.writeText(receiptUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function clearMine() {
    clearRememberedLetters(slug);
    setMine([]);
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

      {loaded && notFound ? (
        <p className="mt-16 rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground gummy">
          {t("visitor.notFound")}
        </p>
      ) : receiptId ? (
        <SentCard
          receiptUrl={receiptUrl}
          copied={copied}
          onCopy={copyReceipt}
          onAgain={() => {
            setReceiptId(null);
            setText("");
          }}
        />
      ) : closed ? (
        <section data-el="closed-card" className="pt-8">
          <div className="rounded-[30px] border border-white/60 bg-card p-6 text-center gummy">
            <Lock className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-foreground">{t("visitor.boxClosed")}</p>
          </div>
        </section>
      ) : (
        <section data-el="compose-card" className="pt-6">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <MessageCircleHeart className="h-5 w-5" />
            <h1 className="font-heading text-xl font-bold text-foreground">
              {t("visitor.heading")}
            </h1>
          </div>
          {prompt && (
            <p className="mb-4 rounded-2xl bg-card p-3 text-sm leading-relaxed text-foreground gummy">
              {prompt}
            </p>
          )}
          <GummyNote tint="#F6EFDD" el="compose-note">
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
          <LetterButton
            data-el="visitor-send"
            disabled={!text.trim() || sending}
            onClick={submit}
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4"
          >
            <Send className="h-4 w-4" />
            {sending ? t("visitor.sending") : t("visitor.send")}
          </LetterButton>
          {notice && (
            <p
              data-el="send-notice"
              className="mt-3 rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-xs font-medium text-accent"
            >
              {notice}
            </p>
          )}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("safety.screeningNote")}
          </p>
        </section>
      )}

      {/* My remembered letters (this browser only) */}
      {!notFound && !receiptId && mine.length > 0 && (
        <section data-el="my-letters" className="pt-8">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1.5 font-heading text-base font-bold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              {t("visitor.myLettersTitle")}
            </h2>
            <button
              data-el="clear-mine"
              onClick={clearMine}
              className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("visitor.clearMine")}
            </button>
          </div>
          <p className="mb-3 px-1 text-xs text-muted-foreground">
            {t("visitor.myLettersDesc")}
          </p>
          <div className="flex flex-col gap-3">
            {mine.map((l, i) => (
              <button
                key={l.receiptId}
                data-el="my-letter"
                onClick={() => router.push(`/r/${l.receiptId}`)}
                className="text-left"
              >
                <GummyNote tint={tintForId(l.receiptId)} rotate={ROTATIONS[i % ROTATIONS.length]}>
                  <p className="truncate text-[15px] leading-relaxed text-foreground">
                    {l.preview || "…"}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <MessageCircleHeart className="h-3 w-3" />
                    {t("visitor.openLetter")}
                  </p>
                </GummyNote>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Public wall */}
      {!notFound && (
        <section data-el="public-wall" className="pt-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1.5 font-heading text-base font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              {t("visitor.wallTitle")}
            </h2>
            {wall.length > 0 && (
              <button
                data-el="wall-view-all"
                onClick={() => router.push(`/u/${slug}/wall`)}
                className="text-xs font-semibold text-primary underline underline-offset-2"
              >
                {t("wallPage.count", { count: wall.length })}
              </button>
            )}
          </div>
          {wall.length === 0 ? (
            <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
              {t("visitor.wallEmpty")}
            </p>
          ) : (
            <div className="pb-4">
              <PublicWall entries={wall} onReport={setReportTarget} />
            </div>
          )}
        </section>
      )}

      {/* Passerby → owner conversion at the end of the wall (compose flow only;
          the SentCard flow already shows its own CTA). */}
      {!notFound && !receiptId && !closed && (
        <div className="pt-8">
          <OpenOwnBoxCta />
        </div>
      )}

      <div className="mt-auto pt-6">
        <PromisePanel variant="footer" className="mb-6" />
        <LegalFooter />
      </div>

      {showCrisis && <CrisisCard onClose={() => setShowCrisis(false)} />}
      {reportTarget && (
        <TakedownDialog targetRef={reportTarget} onClose={() => setReportTarget(null)} />
      )}
      {sealing && (
        <SealCeremony
          previewText={sealing.preview}
          onDone={() => {
            setReceiptId(sealing.receiptId);
            setSealing(null);
          }}
        />
      )}
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
      <GummyNote tint="#EDE4CE" el="sent-note" popped>
        <div className="mb-2 flex items-center gap-2 text-accent">
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
        <LetterButton
          data-el="copy-receipt"
          onClick={onCopy}
          variant="primary"
          size="lg"
          fullWidth
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("inbox.copied") : t("visitor.copyReceipt")}
        </LetterButton>
        <p
          data-el="receipt-warning"
          className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
        >
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
          {t("visitor.receiptWarning")}
        </p>
      </div>

      <LetterButton
        onClick={onAgain}
        variant="secondary"
        size="md"
        fullWidth
        className="mt-3 font-medium"
      >
        {t("visitor.sendAnother")}
      </LetterButton>

      <OpenOwnBoxCta className="mt-5" />
    </section>
  );
}

/**
 * The core viral loop: convert a passerby who just wrote a letter (peak intent)
 * into a new owner. Routes to /inbox where they sign in and get their own box.
 */
function OpenOwnBoxCta({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <section
      data-el="open-own-box"
      className={`rounded-[26px] border border-primary/20 bg-primary/5 p-5 text-center ${className}`}
    >
      <h3 className="font-heading text-base font-bold text-foreground">
        {t("visitor.ownBoxTitle")}
      </h3>
      <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {t("visitor.ownBoxDesc")}
      </p>
      <LetterButton
        data-el="open-own-box-cta"
        onClick={() => router.push("/inbox")}
        variant="primary"
        size="lg"
        fullWidth
        className="mt-4"
      >
        <PenLine className="h-4 w-4" />
        {t("visitor.ownBoxCta")}
      </LetterButton>
    </section>
  );
}
