"use client";

import { useEffect, useState } from "react";

/** Build the absolute share URL for /u/[slug] on the client. */
export function useCallbackShareUrl(slug: string): string {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  if (!slug) return "";
  return `${origin}/u/${slug}`;
}
