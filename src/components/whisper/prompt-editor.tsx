"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, PenLine } from "lucide-react";
import { updateInboxPrompt } from "@/lib/api";

/**
 * Owner control: the guiding line shown at the top of the visitor writing page.
 * Saves via PATCH /api/inbox. `initialPrompt` comes from the loaded inbox.
 */
export function PromptEditor({ initialPrompt }: { initialPrompt: string }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialPrompt);
  const [saved, setSaved] = useState(initialPrompt);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = value.trim() !== saved.trim();

  const templates = (() => {
    const raw = t("inbox.promptTemplates", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  })();

  async function save() {
    if (saving || !dirty) return;
    setSaving(true);
    const next = value.trim();
    const ok = await updateInboxPrompt(next);
    setSaving(false);
    if (ok) {
      setSaved(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }
  }

  return (
    <section data-el="prompt-editor" className="px-5 pt-4">
      <div className="rounded-[30px] border border-white/60 bg-card p-5 gummy">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <PenLine className="h-4 w-4" />
          {t("inbox.promptLabel")}
        </div>
        <textarea
          data-el="prompt-input"
          value={value}
          maxLength={200}
          rows={2}
          onChange={(e) => {
            setValue(e.target.value);
            setSavedFlash(false);
          }}
          placeholder={t("inbox.promptPlaceholder")}
          className="w-full resize-none rounded-2xl border border-white/60 bg-background p-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
        />
        {templates.length > 0 && (
          <div data-el="prompt-templates" className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              {t("inbox.promptTemplatesLabel")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  data-el="prompt-template-chip"
                  onClick={() => {
                    setValue(tpl);
                    setSavedFlash(false);
                  }}
                  className="rounded-full border border-primary/25 bg-background px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex items-center justify-end gap-2">
          {savedFlash && (
            <span className="flex items-center gap-1 text-xs font-medium text-secondary-foreground">
              <Check className="h-3.5 w-3.5" />
              {t("inbox.promptSaved")}
            </span>
          )}
          <button
            data-el="prompt-save"
            disabled={saving || !dirty}
            onClick={save}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 gummy"
          >
            {saving ? t("inbox.sending") : t("common.save")}
          </button>
        </div>
      </div>
    </section>
  );
}
