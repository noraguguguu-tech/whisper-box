"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Send, Share2, Trash2, Ban } from "lucide-react";
import { GummyNote } from "@/components/whisper/gummy-note";
import { LetterButton } from "@/components/whisper/letter-button";
import { StatusPill } from "@/components/whisper/status-pill";
import { ShareCard } from "@/components/whisper/share-card";
import { LineReveal } from "@/components/whisper/line-reveal";
import { SealedCover } from "@/components/whisper/sealed-cover";
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
  // Sealed presentation only while unread AND collapsed — opening it (a tap)
  // still performs the real "unseal" (markRead happens in the parent onToggle).
  const sealed = message.status === "unread" && !expanded;

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
      <div className="flex w-full flex-col gap-2 text-left">
        <div className="flex items-center gap-2">
          <StatusPill
            variant={
              message.status === "unread"
                ? "unread"
                : message.status === "replied"
                  ? "replied"
                  : "read"
            }
          >
            {t(statusKey)}
          </StatusPill>
          {message.isPublic && <StatusPill variant="public">{t("inbox.public")}</StatusPill>}
          {message.blocked && <StatusPill variant="blocked">{t("inbox.muted")}</StatusPill>}
          {message.reported && (
            <StatusPill variant="reported">{t("inbox.reportedFlag")}</StatusPill>
          )}
        </div>

        {sealed ? (
          <SealedCover body={message.body} onOpen={onToggle} />
        ) : (
          <button
            onClick={onToggle}
            data-el="note-toggle"
            className="w-full text-left"
          >
            <p className="text-[15px] leading-relaxed text-foreground">{message.body}</p>
          </button>
        )}
      </div>

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
            <LetterButton
              data-el={hasReply ? "send-followup" : "send-reply"}
              disabled={!draft.trim()}
              onClick={submitDraft}
              variant="primary"
              size="md"
            >
              <Send className="h-4 w-4" />
              {t(hasReply ? "inbox.followupSend" : "inbox.send")}
            </LetterButton>
          </div>

          <LetterButton
            data-el="toggle-public"
            onClick={onTogglePublic}
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-3"
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
          </LetterButton>
          {hasReply && (
            <LetterButton
              data-el="open-share"
              onClick={() => setSharing(true)}
              variant="accent"
              size="sm"
              fullWidth
              className="mt-2"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("inbox.shareLetter")}
            </LetterButton>
          )}

          {/* Moderation row: mute follow-ups, delete the whole thread. */}
          <div className="mt-2 flex gap-2">
            {hasReply && (
              <LetterButton
                data-el="toggle-block"
                onClick={onToggleBlock}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                <Ban className="h-3.5 w-3.5" />
                {t(message.blocked ? "inbox.unmute" : "inbox.mute")}
              </LetterButton>
            )}
            <LetterButton
              data-el="delete-message"
              onClick={() => {
                if (window.confirm(t("inbox.deleteConfirm"))) onDelete();
              }}
              variant="danger"
              size="sm"
              className="flex-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("inbox.delete")}
            </LetterButton>
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
