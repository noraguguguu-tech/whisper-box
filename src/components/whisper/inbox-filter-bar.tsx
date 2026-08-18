"use client";

import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { hapticTap } from "@/lib/whisper/motion";

/** The letter-list filter dimension. Mirrors the card status vocabulary so the
 *  filter chips read the same as the badges on the cards themselves. */
export type InboxFilter = "all" | "unread" | "replied" | "public";

const ORDER: InboxFilter[] = ["all", "unread", "replied", "public"];

const LABEL_KEY: Record<InboxFilter, string> = {
  all: "inbox.filterAll",
  unread: "inbox.filterUnread",
  replied: "inbox.filterReplied",
  public: "inbox.filterPublic",
};

/**
 * Owner inbox filter + search. As a letterbox fills up, scrolling the whole
 * pile is unworkable — this narrows by status (all / unread / replied / public)
 * and by a free-text query over the letter body, the owner's reply, and every
 * follow-up turn. Filtering is pure client-side over the already-fetched list,
 * so it is instant and needs no extra requests. Counts are supplied by the
 * parent so each chip shows how many letters it would reveal.
 */
export function InboxFilterBar({
  filter,
  onFilter,
  query,
  onQuery,
  counts,
}: {
  filter: InboxFilter;
  onFilter: (f: InboxFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  counts: Record<InboxFilter, number>;
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  return (
    <div data-el="inbox-filter-bar" className="flex flex-col gap-3 px-5 pb-1 pt-2">
      {/* Status chips — horizontally scrollable so four chips never widen the shell. */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {ORDER.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              data-el={`inbox-filter-${f}`}
              onClick={() => {
                if (!active) hapticTap(8);
                onFilter(f);
              }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs gummy transition-colors ${
                active
                  ? "font-semibold text-primary-foreground"
                  : "border border-white/60 bg-white/40 font-medium text-foreground/70"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="inbox-filter-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-primary"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t(LABEL_KEY[f])}</span>
              <span
                className={`relative z-10 rounded-full px-1.5 text-[10px] font-semibold ${
                  active ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Free-text search over body + reply + follow-ups. */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-foreground/40" />
        <input
          data-el="inbox-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("inbox.searchPlaceholder")}
          className="h-10 w-full rounded-full border border-white/60 bg-white/50 pl-10 pr-10 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary/40 focus:bg-white/70 gummy"
        />
        {query && (
          <button
            data-el="inbox-search-clear"
            onClick={() => onQuery("")}
            aria-label={t("inbox.searchClear")}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 text-foreground/60"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
