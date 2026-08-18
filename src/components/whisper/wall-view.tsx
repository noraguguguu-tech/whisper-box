"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Sparkles, PenLine, ArrowLeft, Share2, Check } from "lucide-react";
import { PublicWall } from "@/components/whisper/public-wall";
import { LetterButton } from "@/components/whisper/letter-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LegalFooter } from "@/components/whisper/legal-footer";
import { TakedownDialog } from "@/components/whisper/takedown-dialog";
import { hapticTap } from "@/lib/whisper/motion";
import { fetchVisitorInbox, fetchPublicWall } from "@/lib/api";
import type { PublicEntry } from "@/lib/whisper/types";

/**
 * Standalone, directly-shareable public wall for one letterbox: /u/[slug]/wall.
 * A passerby lands here, reads the letters this owner chose to make public and
 * how they replied, then converts via the prominent "write them a letter too"
 * CTA back to the compose page. Reuses the same public data (no auth) and the
 * same PublicWall card as the compose page.
 */
export function WallView({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [wall, setWall] = useState<PublicEntry[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchVisitorInbox(slug).then((data) => {
      if (!alive) return;
      if (!data) setNotFound(true);
      else {
        setWall(data.wall);
        setHasMore(data.wallHasMore);
        setTotal(data.wallTotal);
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    hapticTap(8);
    const page = await fetchPublicWall(slug, wall.length);
    if (page) {
      setWall((prev) => [...prev, ...page.wall]);
      setHasMore(page.wallHasMore);
      setTotal(page.wallTotal);
    }
    setLoadingMore(false);
  }

  const goWrite = () => router.push(`/u/${slug}`);

  async function shareWall() {
    hapticTap(10);
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = t("wallPage.title");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: text, url });
        return;
      }
    } catch {
      /* user dismissed the share sheet — fall through to copy */
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can safely do */
    }
  }

  return (
    <main
      data-el="wall-page"
      className="wall-aura relative mx-auto flex min-h-full w-full max-w-md flex-col px-5"
      style={{
        paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          data-el="wall-back"
          onClick={goWrite}
          className="flex items-center gap-1 text-xs font-medium text-foreground/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("wallPage.backToWrite")}
        </button>
        <div className="flex items-center gap-2">
          {!notFound && loaded && (
            <button
              data-el="wall-share"
              onClick={shareWall}
              className="flex items-center gap-1 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm gummy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? t("wallPage.shareCopied") : t("wallPage.shareCta")}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      {notFound ? (
        <p className="mt-10 rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground gummy">
          {t("visitor.notFound")}
        </p>
      ) : (
        <>
          <header className="pt-2">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold tracking-tight text-primary">
              <Sparkles className="h-5 w-5 text-accent" />
              {t("wallPage.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("wallPage.subtitle")}
            </p>
            {loaded && total > 0 && (
              <p className="mt-2 text-xs font-semibold text-accent">
                {t("wallPage.count", { count: total })}
              </p>
            )}
          </header>

          <section data-el="wall-list" className="pt-5">
            {loaded && wall.length === 0 ? (
              <div className="rounded-3xl bg-card p-6 text-center gummy">
                <p className="text-sm text-muted-foreground">{t("wallPage.empty")}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {t("wallPage.emptyCta")}
                </p>
              </div>
            ) : (
              <>
                <PublicWall entries={wall} onReport={setReportTarget} />
                {hasMore && (
                  <LetterButton
                    data-el="wall-load-more"
                    onClick={loadMore}
                    variant="secondary"
                    size="md"
                    fullWidth
                    disabled={loadingMore}
                    className="mt-4"
                  >
                    {loadingMore ? t("wallPage.loadingMore") : t("wallPage.loadMore")}
                  </LetterButton>
                )}
              </>
            )}
          </section>

          {/* Passerby → writer conversion. */}
          <LetterButton
            data-el="wall-write-cta"
            onClick={goWrite}
            variant="primary"
            size="lg"
            fullWidth
            className="mt-6"
          >
            <PenLine className="h-4 w-4" />
            {t("wallPage.writeCta")}
          </LetterButton>
        </>
      )}

      <div className="mt-auto pt-8">
        <LegalFooter />
      </div>

      {reportTarget && (
        <TakedownDialog
          targetRef={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </main>
  );
}
