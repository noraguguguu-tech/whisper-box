"use client";

import { Globe, Ban, Flag } from "lucide-react";
import { cn } from "@/utils/utils";

/**
 * The one status-badge primitive for letter cards. Previously these pills were
 * hand-written 6+ times with clashing washes (bg-accent vs /15 vs /20 vs /12)
 * and — critically — "replied" reused the exact grey of "read", so they were
 * indistinguishable in the list. StatusPill gives each state one canonical look
 * and gives `replied` its own ink-blue tint so a letter you've answered reads
 * differently from one merely opened.
 */
export type PillVariant =
  | "unread"
  | "read"
  | "replied"
  | "public"
  | "blocked"
  | "reported";

const STYLE: Record<PillVariant, string> = {
  unread: "bg-accent text-accent-foreground",
  read: "bg-gummy-fill-strong text-foreground/70",
  // Distinct from `read`: ink-blue wash signals "you have replied".
  replied: "bg-primary/12 text-primary",
  public: "bg-secondary/50 text-secondary-foreground",
  blocked: "bg-foreground/10 text-foreground/70",
  reported: "bg-accent/20 text-accent",
};

const ICON: Partial<Record<PillVariant, typeof Globe>> = {
  public: Globe,
  blocked: Ban,
  reported: Flag,
};

export function StatusPill({
  variant,
  children,
  className,
}: {
  variant: PillVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ICON[variant];
  return (
    <span
      data-el={`pill-${variant}`}
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        STYLE[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
