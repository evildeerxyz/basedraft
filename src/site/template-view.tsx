"use client";

import { ArrowRightIcon, CaretDownIcon, CheckCircleIcon, PenNibIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { liveUrl, templateOf, type TemplateSlug } from "./live";
import { usePlan, usePurchases } from "./plan";
import { btnSm } from "./sheet";

/*
 * A template, full window, as its buyers' visitors will see it: its own site, every page of it
 * clickable. A card floats bottom right with what it is, what it costs, and the two ways on:
 * buy it, or open it in Studio to make it yours first. It folds down to a pill, out of the way.
 */
export function TemplateView({ slug }: { slug: TemplateSlug }) {
  const t = templateOf(slug)!;
  const q = useSearchParams();
  const [src] = useState(() => liveUrl(slug, q.get("path") ?? "/"));
  const [path, setPath] = useState(q.get("path") ?? "/");
  const [folded, setFolded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const mine = usePurchases();
  const [plan] = usePlan();
  const owned = plan === "pro" || Boolean((mine?.templates as readonly string[] | undefined)?.includes(slug));
  const price = t.price === "free" ? "Free" : `$${t.price}`;

  // Following the template's own links: the address and the tab's title say which page is open.
  // The template moves between its pages without loading the frame again, so it's checked often.
  const seen = useRef("");
  const follow = () => {
    try {
      const w = frame.current?.contentWindow;
      if (!w || seen.current === w.location.href) return;
      seen.current = w.location.href;
      const p = w.location.pathname.replace(new RegExp(`^/live/${slug}`), "") || "/";
      setPath(p);
      window.history.replaceState(null, "", p === "/" ? `/view/${slug}` : `/view/${slug}?path=${encodeURIComponent(p)}`);
      document.title = `${w.document.title || t.name} | ${t.name} on basedraft`;
    } catch {
      /* a page that left the template (an outside link) isn't ours to read */
    }
  };
  useEffect(() => {
    const id = setInterval(follow, 400);
    return () => clearInterval(id);
  });

  return (
    <div className="h-dvh bg-canvas">
      <iframe ref={frame} src={src} title={`${t.name}, live`} onLoad={follow} className="block h-full w-full border-0 bg-white" />
      <AnimatePresence initial={false} mode="popLayout">
        {folded ? (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setFolded(false)}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            aria-label={`${t.name}, ${owned ? "yours" : price}. Show options`}
            className="fixed bottom-4 right-4 z-50 flex h-10 items-center gap-2 rounded-full bg-surface pl-3.5 pr-3 text-ui font-medium text-fg shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35),0_0_0_1px_rgb(var(--bd-ink)/0.1)]"
          >
            <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
            {t.name}
            <span className="tabular-nums text-muted">{owned ? "Yours" : price}</span>
            <CaretDownIcon size={12} weight="bold" className="rotate-180 text-subtle" />
          </motion.button>
        ) : (
          <motion.aside
            key="card"
            aria-label={`${t.name} template`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="fixed inset-x-3 bottom-3 z-50 rounded-[var(--bd-r-sheet)] bg-surface p-3 text-fg shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45),0_0_0_1px_rgb(var(--bd-ink)/0.1)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[320px]"
          >
            <div className="flex items-start gap-3 px-1 pt-0.5">
              <div className="min-w-0 flex-1">
                <Link href={`/templates/${slug}`} className="flex items-center gap-2 text-ui font-semibold hover:underline hover:underline-offset-2">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                </Link>
                <p className="mt-0.5 truncate text-meta text-muted">
                  {t.category}, {t.pages.length} pages{path !== "/" ? `, on ${t.pages.find((p) => p.path === path)?.label ?? path}` : ""}
                </p>
              </div>
              {owned ? (
                <span className="flex items-center gap-1 text-meta font-medium text-[#1f9d55]">
                  <CheckCircleIcon size={14} weight="fill" /> Yours
                </span>
              ) : (
                <span className="text-heading tabular-nums leading-none">{price}</span>
              )}
              <button type="button" onClick={() => setFolded(true)} aria-label="Fold away" className="-mr-1 -mt-0.5 grid size-7 shrink-0 place-items-center rounded-[6px] text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg">
                <CaretDownIcon size={13} weight="bold" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={`/studio?template=${slug}`} className={cn(btnSm.quiet, "w-full")}>
                <PenNibIcon size={14} /> Open in Studio
              </Link>
              {owned ? (
                <Link href="/purchases" className={cn(btnSm.ink, "w-full")}>
                  Download <ArrowRightIcon size={13} weight="bold" />
                </Link>
              ) : (
                <a href={`/checkout?product=${slug}`} className={cn(btnSm.ink, "w-full")}>
                  Buy for {price} <ArrowRightIcon size={13} weight="bold" />
                </a>
              )}
            </div>
            {!owned && (
              <p className="mt-2.5 px-1 text-meta text-muted">
                Or every template with{" "}
                <Link href="/pro" className="font-medium text-fg underline-offset-2 hover:underline">
                  Pro
                </Link>
                , $149 once.
              </p>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
