"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // origin never changes during the session; no subscription needed.
  return () => {};
}
function getOrigin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Build the absolute share URL for /u/[slug] on the client. */
export function useCallbackShareUrl(slug: string): string {
  const origin = useSyncExternalStore(subscribe, getOrigin, () => "");
  if (!slug) return "";
  return `${origin}/u/${slug}`;
}
