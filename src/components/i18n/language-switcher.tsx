"use client";

/** Reference locale control — restyle or fork for your app's header/settings UI. Keep changeLocale() wiring. */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Languages, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  changeLocale,
  getLocalePreference,
  normalizeLocale,
  supportedLocales,
  type LocaleCode,
  type LocalePreference,
} from "@/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const subscribePreference = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      window.addEventListener("eazo-locale-preference-changed", sync);
      window.addEventListener("storage", sync);
      return () => {
        i18n.off("languageChanged", sync);
        window.removeEventListener("eazo-locale-preference-changed", sync);
        window.removeEventListener("storage", sync);
      };
    },
    [i18n],
  );

  const preference = useSyncExternalStore(
    subscribePreference,
    getLocalePreference,
    () => "system" as LocalePreference,
  );

  const activeLocale =
    normalizeLocale(i18n.resolvedLanguage || i18n.language) ?? "en-US";
  const resolvedLabel =
    supportedLocales.find((l) => l.code === activeLocale)?.nativeLabel ?? activeLocale;

  // The short label shown on the closed pill.
  const triggerLabel =
    preference === "system" ? t("language.followSystem") : resolvedLabel;

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function select(value: LocalePreference | LocaleCode) {
    setOpen(false);
    if (value === "system") {
      await changeLocale("system");
      return;
    }
    const locale = normalizeLocale(value);
    if (locale) await changeLocale(locale as LocaleCode);
  }

  const options: { value: LocalePreference | LocaleCode; label: string; sub?: string }[] = [
    {
      value: "system",
      label: t("language.followSystem"),
      sub: resolvedLabel,
    },
    ...supportedLocales.map((l) => ({ value: l.code, label: l.nativeLabel })),
  ];

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger — parchment pill that matches the letter aesthetic */}
      <button
        type="button"
        data-el="locale-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-foreground gummy"
      >
        <Languages className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="max-w-[92px] truncate">{triggerLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* Menu — floating letter-card with checkmark on the active choice */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            data-el="locale-menu"
            aria-label={t("language.label")}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-primary/15 bg-card p-1.5 shadow-xl"
          >
            {options.map((opt) => {
              const selected = preference === opt.value;
              return (
                <li key={String(opt.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-el="locale-option"
                    onClick={() => void select(opt.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-colors ${
                      selected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground/80 hover:bg-secondary/40"
                    }`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{opt.label}</span>
                      {opt.sub && (
                        <span className="truncate text-[11px] font-normal text-muted-foreground">
                          {opt.sub}
                        </span>
                      )}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
