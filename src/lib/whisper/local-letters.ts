"use client";

// Locally remembered letters (per browser) so an anonymous visitor can find
// their sent letters and replies again without having saved the receipt link.
// This never leaves the device and holds no identity — just receipt ids the
// visitor themselves created, keyed by inbox slug.

const KEY = "wb.myLetters.v1";

export interface RememberedLetter {
  receiptId: string;
  slug: string;
  preview: string; // first chars of the letter, to recognize it
  createdAt: number; // epoch ms
}

function read(): RememberedLetter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RememberedLetter[]) : [];
  } catch {
    return [];
  }
}

function write(list: RememberedLetter[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* storage full / disabled — silently ignore */
  }
}

export function rememberLetter(entry: {
  receiptId: string;
  slug: string;
  preview: string;
}) {
  const list = read().filter((l) => l.receiptId !== entry.receiptId);
  list.unshift({
    receiptId: entry.receiptId,
    slug: entry.slug,
    preview: entry.preview.slice(0, 60),
    createdAt: Date.now(),
  });
  write(list);
}

/** All remembered letters, newest first. Optionally filter by inbox slug. */
export function getRememberedLetters(slug?: string): RememberedLetter[] {
  const list = read().sort((a, b) => b.createdAt - a.createdAt);
  return slug ? list.filter((l) => l.slug === slug) : list;
}

export function clearRememberedLetters(slug?: string) {
  if (!slug) {
    write([]);
    return;
  }
  write(read().filter((l) => l.slug !== slug));
}
