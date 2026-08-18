"use client";

import { useCallbackShareUrl } from "./use-share-url";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { Copy, Check, Link2, Sparkles, ArrowLeft, LogIn } from "lucide-react";
import { WhisperHeader } from "@/components/whisper/whisper-header";
import { NoteCard } from "@/components/whisper/note-card";
import { SettingsControls, PendingQueue } from "@/components/whisper/inbox-safety";
import { LegalFooter } from "@/components/whisper/legal-footer";
import { PromptEditor } from "@/components/whisper/prompt-editor";
import type { WhisperMessage } from "@/lib/whisper/types";
import {
  fetchInbox,
  markMessageRead,
  replyToMessage,
  followupMessage,
  setMessagePublic,
  setMessageBlocked,
  deleteMessage,
  approveMessage,
  setInboxClosed,
  setModerationMode,
} from "@/lib/api";

export function InboxView() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const [slug, setSlug] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<WhisperMessage[]>([]);
  const [closed, setClosed] = useState(false);
  const [modMode, setModMode] = useState<"suspicious" | "all">("suspicious");
  const [fetched, setFetched] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"letters" | "settings">("letters");
  const [takedowns, setTakedowns] = useState<OwnerTakedown[]>([]);

  const shareUrl = useCallbackShareUrl(slug);
  // Pending letters are held out of the normal list and the unread count.
  const pendingList = messages.filter((m) => m.pending);
  const liveList = messages.filter((m) => !m.pending);
  const unread = liveList.filter((m) => m.status === "unread").length;
  // Loading while signed in but the first fetch hasn't resolved yet.
  const loading = !!user && !authLoading && !fetched;

  // Restore the last-selected tab (persisted on this device). Deferred out of
  // the synchronous effect body so it doesn't trigger a cascading render.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = window.localStorage.getItem("wb.inboxTab");
        if (saved === "settings" || saved === "letters") setTab(saved);
      } catch {
        /* storage disabled — keep default */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTab(next: "letters" | "settings") {
    setTab(next);
    try {
      window.localStorage.setItem("wb.inboxTab", next);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    fetchInbox().then((data) => {
      if (!alive) return;
      if (data) {
        setSlug(data.inbox.slug);
        setPrompt(data.inbox.prompt ?? "");
        setClosed(data.inbox.closed);
        setModMode(data.inbox.moderationMode);
        setMessages(data.messages);
      }
      setFetched(true);
    });
    fetchTakedowns().then((rows) => {
      if (alive) setTakedowns(rows);
    });
    return () => {
      alive = false;
    };
  }, [user, authLoading]);

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function toggleOpen(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
    const target = messages.find((m) => m.id === id);
    if (target && target.status === "unread") {
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status: "read" } : m)));
      markMessageRead(id).catch(() => undefined);
    }
  }

  async function sendReply(id: string, text: string) {
    const updated = await replyToMessage(id, text);
    if (updated) setMessages((ms) => ms.map((m) => (m.id === id ? updated : m)));
  }

  async function sendFollowup(id: string, text: string) {
    const updated = await followupMessage(id, text);
    if (updated) setMessages((ms) => ms.map((m) => (m.id === id ? updated : m)));
  }

  async function togglePublic(id: string) {
    const cur = messages.find((m) => m.id === id);
    if (!cur) return;
    const updated = await setMessagePublic(id, !cur.isPublic);
    if (updated) setMessages((ms) => ms.map((m) => (m.id === id ? updated : m)));
  }

  async function toggleBlock(id: string) {
    const cur = messages.find((m) => m.id === id);
    if (!cur) return;
    const updated = await setMessageBlocked(id, !cur.blocked);
    if (updated) setMessages((ms) => ms.map((m) => (m.id === id ? updated : m)));
  }

  async function removeMessage(id: string) {
    const ok = await deleteMessage(id);
    if (ok) {
      setMessages((ms) => ms.filter((m) => m.id !== id));
      setOpenId((cur) => (cur === id ? null : cur));
    }
  }

  async function approve(id: string) {
    const updated = await approveMessage(id);
    if (updated) setMessages((ms) => ms.map((m) => (m.id === id ? updated : m)));
  }

  async function handleResolveTakedown(id: string, status: "actioned" | "dismissed") {
    const ok = await resolveTakedown(id, status);
    if (ok) setTakedowns((ts) => ts.filter((t) => t.id !== id));
  }

  async function toggleClosed() {
    const next = !closed;
    setClosed(next); // optimistic
    const ok = await setInboxClosed(next);
    if (!ok) setClosed(!next);
  }

  async function switchMode(next: "suspicious" | "all") {
    const prev = modMode;
    setModMode(next); // optimistic
    const ok = await setModerationMode(next);
    if (!ok) setModMode(prev);
  }

  return (
    <main
      data-el="inbox-page"
      className="mx-auto flex min-h-full w-full max-w-md flex-col"
      style={{ paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))" }}
    >
      <WhisperHeader />

      <button
        data-el="back-to-cover"
        onClick={() => router.push("/")}
        className="mx-5 mt-3 flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("cover.title")}
      </button>

      {!user && !authLoading ? (
        <SignedOut onLogin={() => auth.login().catch(() => undefined)} />
      ) : (
        <>
          {/* Tab bar */}
          <div data-el="inbox-tabs" className="flex gap-2 px-5 pt-3">
            <TabButton
              active={tab === "letters"}
              onClick={() => selectTab("letters")}
              label={t("inbox.tabLetters")}
              badge={unread > 0 ? unread : undefined}
            />
            <TabButton
              active={tab === "settings"}
              onClick={() => selectTab("settings")}
              label={t("inbox.tabSettings")}
            />
          </div>

          {tab === "settings" ? (
            <>
              <section data-el="share-card" className="px-5 pt-3">
                <div className="rounded-[30px] border border-white/60 bg-card p-5 gummy">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Link2 className="h-4 w-4" />
                    {t("inbox.shareTitle")}
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">{t("inbox.shareHint")}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded-full bg-background px-4 py-2.5 font-mono text-sm text-foreground">
                      {slug ? `/u/${slug}` : "…"}
                    </div>
                    <button
                      data-el="copy-link"
                      disabled={!slug}
                      onClick={copyLink}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t("inbox.copied") : t("inbox.copy")}
                    </button>
                  </div>
                </div>
              </section>

              {fetched && (
                <SettingsControls
                  closed={closed}
                  modMode={modMode}
                  onToggleClosed={toggleClosed}
                  onSwitchMode={switchMode}
                />
              )}
              {fetched && <PromptEditor initialPrompt={prompt} />}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 pb-2 pt-6">
                <h2 className="font-heading text-base font-bold text-foreground">
                  <Sparkles className="mr-1.5 inline h-4 w-4 text-accent" />
                  {liveList.length}
                </h2>
                {unread > 0 && (
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                    {t("inbox.unreadBadge", { count: unread })}
                  </span>
                )}
              </div>

              {/* Pending / review queue — held out of the main list. */}
              {pendingList.length > 0 && (
                <PendingQueue
                  items={pendingList}
                  onApprove={approve}
                  onReject={removeMessage}
                />
              )}

              {loading ? (
                <p className="mx-5 rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
                  {t("inbox.loadingBox")}
                </p>
              ) : liveList.length === 0 ? (
                <div className="mx-5 rounded-3xl bg-card p-6 text-center gummy">
                  <p className="text-sm text-muted-foreground">{t("inbox.empty")}</p>
                  <button
                    data-el="empty-copy-cta"
                    onClick={() => selectTab("settings")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground gummy"
                  >
                    <Link2 className="h-4 w-4" />
                    {t("inbox.emptyCta")}
                  </button>
                </div>
              ) : (
                <section data-el="note-wall" className="flex flex-col gap-4 px-5 pb-8">
                  {liveList.map((m) => (
                    <NoteCard
                      key={m.id}
                      message={m}
                      expanded={openId === m.id}
                      rotate={0}
                      locale={i18n.language}
                      shareUrl={shareUrl}
                      onToggle={() => toggleOpen(m.id)}
                      onReply={(txt) => sendReply(m.id, txt)}
                      onFollowup={(txt) => sendFollowup(m.id, txt)}
                      onTogglePublic={() => togglePublic(m.id)}
                      onToggleBlock={() => toggleBlock(m.id)}
                      onDelete={() => removeMessage(m.id)}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      <div className="mt-8">
        <LegalFooter />
      </div>
    </main>
  );
}

/** One pill tab in the inbox tab bar. */
function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      data-el="inbox-tab"
      onClick={onClick}
      className={
        active
          ? "flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground gummy"
          : "flex items-center gap-1.5 rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm font-medium text-foreground/70"
      }
    >
      {label}
      {badge !== undefined && (
        <span
          className={
            active
              ? "rounded-full bg-primary-foreground/20 px-1.5 text-[11px] font-semibold"
              : "rounded-full bg-accent/15 px-1.5 text-[11px] font-semibold text-accent"
          }
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function SignedOut({ onLogin }: { onLogin: () => void }) {
  const { t } = useTranslation();
  return (
    <section data-el="inbox-signed-out" className="px-5 pt-6">
      <div className="rounded-[30px] border border-white/60 bg-card p-6 text-center gummy">
        <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
          {t("inbox.signedOutTitle")}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {t("inbox.signedOutDesc")}
        </p>
        <button
          data-el="inbox-login"
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground gummy"
        >
          <LogIn className="h-4 w-4" />
          {t("common.signIn")}
        </button>
      </div>
    </section>
  );
}
