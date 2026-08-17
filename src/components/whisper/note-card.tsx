"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Send, Share2 } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { ShareCard } from "@/components/whisper/share-card";
import { tintForId } from "@/lib/whisper/types";
import type { WhisperMessage } from "@/lib/whisper/types";
import { cn } from "@/utils/utils";

/** One gummy note in the owner's inbox wall: read → reply → toggle public. */
export function NoteCard({
  message,
  expanded,
  rotate,
  locale,
  shareUrl,
  onToggle,
  onReply,
  onTogglePublic,
}: {
  message: WhisperMessage;
  expanded: boolean;
  rotate: number;
  locale: string;
  shareUrl: string;
  onToggle: () => void;
  onReply: (text: string) => void;
  onTogglePublic: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [sharing, setSharing] = useState(false);
  const tint = tintForId(message.id);

  const statusKey =
    message.status === "unread"
      ? "inbox.statusUnread"
      : message.status === "replied"
        ? "inbox.statusReplied"
        : "inbox.statusRead";

  return (
    <GummyNote tint={tint} rotate={rotate} popped={expanded} el="note-item">
      <button
        onClick={onToggle}
        data-el="note-toggle"
        className="flex w-full flex-col gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              message.status === "unread"
                ? "bg-accent text-accent-foreground"
                : "bg-white/60 text-foreground/70",
            )}
          >
            {t(statusKey)}
          </span>
          {message.isPublic && (
            <span className="flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              <Globe className="h-3 w-3" />
              {t("inbox.public")}
            </span>
          )}
        </div>
        <p className="text-[15px] leading-relaxed text-foreground">{message.body}</p>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-white/50 pt-3">
          {message.reply ? (
            <div className="rounded-2xl bg-white/60 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {t("inbox.yourReply")}
              </p>
              <p className="text-sm text-foreground">{message.reply}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                data-el="reply-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("inbox.replyPlaceholder")}
                rows={2}
                className="w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
              />
              <button
                data-el="send-reply"
                disabled={!draft.trim()}
                onClick={() => {
                  onReply(draft.trim());
                  setDraft("");
                }}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
              >
                <Send className="h-4 w-4" />
                {t("inbox.send")}
              </button>
            </div>
          )}

          <button
            data-el="toggle-public"
            onClick={onTogglePublic}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/60 bg-white/40 py-2 text-xs font-semibold text-foreground/70"
          >
            {message.isPublic ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                {t("inbox.makePrivate")}
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                {t("inbox.makePublic")}
              </>
            )}
          </button>
          {message.reply && (
            <button
              data-el="open-share"
              onClick={() => setSharing(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent/15 py-2 text-xs font-semibold text-accent"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("inbox.shareLetter")}
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {t("inbox.receivedAt", {
              time: new Date(message.createdAt).toLocaleString(locale),
            })}
          </p>
        </div>
      )}

      {sharing && message.reply && (
        <ShareCard
          question={message.body}
          reply={message.reply}
          shareUrl={shareUrl}
          onClose={() => setSharing(false)}
        />
      )}
    </GummyNote>
  );
}
