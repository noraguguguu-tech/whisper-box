"use client";

import { cn } from "@/utils/utils";

/**
 * A glossy translucent "gummy note" surface — the core visual of the wall.
 * Tint is applied inline so each note can carry its own pastel color.
 */
export function GummyNote({
  tint,
  className,
  children,
  rotate = 0,
  popped = false,
  onClick,
  el,
}: {
  tint: string;
  className?: string;
  children: React.ReactNode;
  rotate?: number;
  popped?: boolean;
  onClick?: () => void;
  el?: string;
}) {
  return (
    <div
      data-el={el}
      onClick={onClick}
      style={{ background: tint, transform: `rotate(${rotate}deg)` }}
      className={cn(
        "gummy gummy-sheen rounded-[26px] border border-white/50 p-4 text-foreground",
        popped && "gummy-pop",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
