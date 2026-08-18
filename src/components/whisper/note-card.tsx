"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Send, Share2, Trash2, Ban, Flag } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { ShareCard } from "@/components/whisper/share-card";
import { tintForId } from "@/lib/whisper/types";
import type { WhisperMessage } from "@/lib/whisper/types";
import { cn } from "@/utils/utils";

/** One gummy note in the owner's inbox wall: read → reply → follow up → share. */
export function NoteCard({
  message,
  expanded,
  rotate,
  locale,
  shareUrl,
  onToggle,
  onReply,
  onFollowup,
  onTogglePublic,
  onToggleBlock,
  onDelete,
}: {
  message: WhisperMessage;
  expanded: boolean;
  rotate: number;
  locale: string;
  shareUrl: string;
  onToggle: () => void;
  onReply: (text: string) => void;
  onFollowup: (text: string) => void;
  onTogglePublic: () => void;
  onToggleBlock: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [sharing, setSharing] = useState(false);
  const tint = tintForId(message.id);
  const hasReply = !!message.reply;

  const statusKey =
    message.status === "unread"
      ? "inbox.statusUnread"
      : message.status === "replied"
        ? "inbox.statusReplied"
        : "inbox.statusRead";

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    if (hasReply) onFollowup(text);
    else onReply(text);
    setDraft("");
  }

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
          {message.blocked && (
            <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
              <Ban className="h-3 w-3" />
              {t("inbox.muted")}
            </span>
          )}
          {message.reported && (
            <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
              <Flag className="h-3 w-3" />
              {t("inbox.reportedFlag")}
            </span>
          )}
        </div>
        <p className="text-[15px] leading-relaxed text-foreground">{message.body}</p>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-white/50 pt-3">
          {/* Thread: first reply, then any follow-up turns. */}
          {hasReply && (
            <div className="flex flex-col gap-2">
              <ThreadBubble mine label={t("inbox.yourReply")} body={message.reply as string} />
              {message.turns.map((turn) => (
                <ThreadBubble
                  key={turn.id}
                  mine={turn.author === "owner"}
                  label={turn.author === "owner" ? t("inbox.yourReply") : t("inbox.theirFollowup")}
                  body={turn.body}
                  reveal={turn.author === "visitor"}
                  revealKey={turn.id}
                />
              ))}
            </div>
          )}

          {/* Composer: initial reply when none yet, otherwise a follow-up. */}
          <div className={cn("flex flex-col gap-2", hasReply && "mt-3")}>
            <textarea
              data-el={hasReply ? "followup-input" : "reply-input"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t(hasReply ? "inbox.followupPlaceholder" : "inbox.replyPlaceholder")}
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
            />
            <button
              data-el={hasReply ? "send-followup" : "send-reply"}
              disabled={!draft.trim()}
              onClick={submitDraft}
              className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
            >
              <Send className="h-4 w-4" />
              {t(hasReply ? "inbox.followupSend" : "inbox.send")}
            </button>
          </div>

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
          {hasReply && (
            <button
              data-el="open-share"
              onClick={() => setSharing(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent/15 py-2 text-xs font-semibold text-accent"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("inbox.shareLetter")}
            </button>
          )}

          {/* Moderation row: mute follow-ups, delete the whole thread. */}
          <div className="mt-2 flex gap-2">
            {hasReply && (
              <button
                data-el="toggle-block"
                onClick={onToggleBlock}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/60 bg-white/40 py-2 text-xs font-semibold text-foreground/70"
              >
                <Ban className="h-3.5 w-3.5" />
                {t(message.blocked ? "inbox.unmute" : "inbox.mute")}
              </button>
            )}
            <button
              data-el="delete-message"
              onClick={() => {
                if (window.confirm(t("inbox.deleteConfirm"))) onDelete();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-2 text-xs font-semibold text-accent"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("inbox.delete")}
            </button>
          </div>
          {message.blocked && (
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              {t("inbox.mutedHint")}
            </p>
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

/** A reply/turn bubble inside the owner's expanded note. */
/** A reply/turn bubble inside the owner's expanded note. */
function ThreadBubble({
  mine,
  label,
  body,
  reveal = false,
  revealKey,
}: {
  mine: boolean;
  label: string;
  body: string;
  reveal?: boolean;
  revealKey?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3", mine ? "bg-white/60" : "bg-accent/10")}>
      <p
        className={cn(
          "mb-1 text-[11px] font-semibold uppercase tracking-wide",
          mine ? "text-primary" : "text-accent",
        )}
      >
        {label}
      </p>
      {reveal ? (
        <LineReveal text={body} revealKey={revealKey} className="text-sm text-foreground" />
      ) : (
        <p className="text-sm text-foreground">{body}</p>
      )}
    </div>
  );
}
