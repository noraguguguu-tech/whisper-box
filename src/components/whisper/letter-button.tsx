"use client";

import { forwardRef } from "react";
import { cn } from "@/utils/utils";

/**
 * The one button primitive for the whole letterbox. Before this, primary
 * buttons were hand-written in 8 files with 5 different heights (py-2 … py-3.5)
 * and danger/accent buttons blurred into share buttons. LetterButton fixes the
 * layers and sizes in one place.
 *
 * variant — visual hierarchy:
 *   primary   → filled ink-blue, the page/section main action (send, reply)
 *   secondary → translucent-white outline, the softer alternative (make private)
 *   danger    → vermilion outline + wash, destructive only (delete, mute)
 *   ghost     → text-only ink-blue, lightweight inline action
 *
 * size — fixed vertical rhythm so same-level buttons never drift:
 *   lg → py-3   text-sm  (page-level main action)
 *   md → py-2.5 text-sm  (in-card action)
 *   sm → py-2   text-xs  (secondary row inside a card)
 */
type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground gummy",
  secondary: "border border-gummy-border bg-gummy-fill text-foreground/70",
  danger: "border border-accent/40 bg-accent/10 text-accent",
  ghost: "text-primary hover:bg-primary/10 transition-colors",
};

const SIZE: Record<Size, string> = {
  sm: "py-2 text-xs font-semibold",
  md: "py-2.5 text-sm font-semibold",
  lg: "py-3 text-sm font-semibold",
};

export interface LetterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretch to fill its row (the common case for stacked card actions). */
  fullWidth?: boolean;
}

export const LetterButton = forwardRef<HTMLButtonElement, LetterButtonProps>(
  function LetterButton(
    { variant = "primary", size = "md", fullWidth = false, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-full disabled:opacity-40",
          VARIANT[variant],
          SIZE[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
