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
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = value.trim() !== initialPromptRef(initialPrompt, value);

  async function save() {
    if (saving) return;
    setSaving(true);
    const ok = await updateInboxPrompt(value.trim());
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
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
            setSaved(false);
          }}
          placeholder={t("inbox.promptPlaceholder")}
          className="w-full resize-none rounded-2xl border border-white/60 bg-background p-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {saved && (
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

// Track the last-saved baseline so the Save button only enables on real edits.
let _baseline: string | null = null;
function initialPromptRef(initial: string, _current: string): string {
  if (_baseline === null) _baseline = initial;
  return _baseline;
}
