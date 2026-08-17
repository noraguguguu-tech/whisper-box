"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { Copy, Check, Link2, Sparkles, ArrowLeft } from "lucide-react";
import { WhisperHeader } from "@/components/whisper/whisper-header";
import { NoteCard } from "@/components/whisper/note-card";
import type { WhisperMessage } from "@/lib/whisper/types";
import { MOCK_INBOX } from "@/lib/whisper/mock";

const ROTATIONS = [-2.5, 1.8, -1.2, 2.2, -2, 1.4];

export default function InboxPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);

  const [messages, setMessages] = useState<WhisperMessage[]>(MOCK_INBOX.messages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const slug = user?.id ? user.id.slice(0, 8) : MOCK_INBOX.slug;
  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/u/${slug}` : `/u/${slug}`),
    [slug],
  );
  const unread = messages.filter((m) => m.status === "unread").length;

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function toggleOpen(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
    setMessages((ms) =>
      ms.map((m) => (m.id === id && m.status === "unread" ? { ...m, status: "read" } : m)),
    );
  }
  function sendReply(id: string, text: string) {
    setMessages((ms) =>
      ms.map((m) =>
        m.id === id
          ? { ...m, reply: text, status: "replied", repliedAt: new Date().toISOString() }
          : m,
      ),
    );
  }
  function togglePublic(id: string) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, isPublic: !m.isPublic } : m)));
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

      <section data-el="share-card" className="px-5 pt-3">
        <div className="rounded-[30px] border border-white/60 bg-card p-5 gummy">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <Link2 className="h-4 w-4" />
            {t("inbox.shareTitle")}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{t("inbox.shareHint")}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-full bg-background px-4 py-2.5 font-mono text-sm text-foreground">
              /u/{slug}
            </div>
            <button
              data-el="copy-link"
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground gummy"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("inbox.copied") : t("inbox.copy")}
            </button>
          </div>
          {!user && !loading && (
            <button
              onClick={() => auth.login().catch(() => undefined)}
              className="mt-3 w-full rounded-full border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary"
            >
              {t("inbox.signedOutTitle")} · {t("common.signIn")}
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between px-6 pb-2 pt-6">
        <h2 className="font-heading text-base font-bold text-foreground">
          <Sparkles className="mr-1.5 inline h-4 w-4 text-accent" />
          {messages.length}
        </h2>
        {unread > 0 && (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {t("inbox.unreadBadge", { count: unread })}
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <p className="mx-5 rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t("inbox.empty")}
        </p>
      ) : (
        <section data-el="note-wall" className="flex flex-col gap-4 px-5 pb-8">
          {messages.map((m, i) => (
            <NoteCard
              key={m.id}
              message={m}
              expanded={openId === m.id}
              rotate={0}
              locale={i18n.language}
              onToggle={() => toggleOpen(m.id)}
              onReply={(txt) => sendReply(m.id, txt)}
              onTogglePublic={() => togglePublic(m.id)}
            />
          ))}
        </section>
      )}
    </main>
  );
}
