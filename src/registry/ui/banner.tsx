"use client";

import { ArrowRightIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";

/*
 * The line across the top of a site: news, a launch, a sale. In ink or on paper, with a small
 * badge, a link whose arrow steps forward when pointed at, and a close that folds the bar away and
 * can remember it was closed. Give it several messages and they roll up one after another, pausing
 * while it's pointed at or focused.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* Whether this banner was closed before, from localStorage; the server and the first render say no. */
const subscribe = (fn: () => void) => {
  addEventListener("storage", fn);
  addEventListener("bd-banner", fn);
  return () => {
    removeEventListener("storage", fn);
    removeEventListener("bd-banner", fn);
  };
};
const closedBefore = (key?: string) => {
  if (!key) return false;
  try {
    return localStorage.getItem(key) === "closed";
  } catch {
    return false;
  }
};

export type BannerProps = {
  /** One message, or several to roll through. */
  children?: ReactNode;
  messages?: ReactNode[];
  /** How long each message stays, in ms, when there are several. */
  interval?: number;
  /** In ink, or on paper. */
  variant?: "ink" | "paper";
  /** A small label before the message: New, Sale, Live. */
  badge?: ReactNode;
  /** Where the link goes, and what it says. */
  href?: string;
  cta?: string;
  /** Your router's link, like Next.js's Link. */
  link?: ElementType;
  /** Shows a close button. */
  dismissible?: boolean;
  /** Remembers it was closed, under this key, so it stays closed on the next visit. */
  storageKey?: string;
  onDismiss?: () => void;
  className?: string;
};

export function Banner({ children, messages, interval = 4500, variant = "ink", badge, href, cta = "Read more", link: Link = "a", dismissible = false, storageKey, onDismiss, className }: BannerProps) {
  const was = useSyncExternalStore(subscribe, () => closedBefore(storageKey), () => false);
  const [closed, setClosed] = useState(false);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = useReducedMotion();
  const list = messages && messages.length ? messages : [children];
  const many = list.length > 1;

  useEffect(() => {
    if (!many || paused || still) return;
    const t = setInterval(() => setI((n) => (n + 1) % list.length), interval);
    return () => clearInterval(t);
  }, [many, paused, still, interval, list.length]);

  const close = () => {
    setClosed(true);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "closed");
      } catch {}
    }
  };
  const ink = variant === "ink";

  return (
    <AnimatePresence initial={false} onExitComplete={() => {
      onDismiss?.();
      dispatchEvent(new Event("bd-banner"));
    }}>
      {!closed && !was && (
        <motion.div
          key="banner"
          role="region"
          aria-label="Announcement"
          exit={still ? { opacity: 0 } : { height: 0, opacity: 0, transition: { height: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.15 } } }}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPaused(false)}
          className={cx("relative overflow-hidden", ink ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "text-[var(--bd-fg)] [background:var(--bd-ui-paper)] shadow-[inset_0_-1px_0_var(--bd-line)]", className)}
        >
          <div className="mx-auto flex h-10 max-w-full items-center justify-center gap-3 px-12 text-[13px]">
            {badge && <span className={cx("inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium", ink ? "bg-[rgb(255_255_255/0.14)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] dark:bg-[rgb(0_0_0/0.08)]" : "bg-[var(--bd-ui-track)] text-[var(--bd-fg)]")}>{badge}</span>}
            <span className="relative grid min-w-0 overflow-hidden [&>*]:[grid-area:1/1]" aria-live={many ? "polite" : undefined}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={i}
                  initial={still ? { opacity: 0 } : { y: "110%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={still ? { opacity: 0 } : { y: "-110%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="block truncate"
                >
                  {list[i % list.length]}
                </motion.span>
              </AnimatePresence>
            </span>
            {href && (
              <Link href={href} className={cx("group/cta inline-flex shrink-0 items-center gap-1 font-medium underline-offset-4 outline-none hover:underline focus-visible:underline", ink ? "" : "text-[var(--bd-fg)]")}>
                {cta}
                <ArrowRightIcon weight="regular" className="size-3.5 transition-transform duration-200 ease-[var(--bd-ease)] group-hover/cta:translate-x-0.5" />
              </Link>
            )}
          </div>
          {many && (
            <span aria-hidden className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1 pb-1">
              {list.map((_, k) => (
                <span key={k} className={cx("h-[2px] rounded-full transition-all duration-300", k === i % list.length ? "w-3 opacity-80" : "w-1 opacity-30", ink ? "bg-current" : "bg-[var(--bd-fg)]")} />
              ))}
            </span>
          )}
          {dismissible && (
            <button
              type="button"
              aria-label="Close the announcement"
              onClick={close}
              className={cx("absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full outline-none transition-colors focus-visible:outline-2 focus-visible:outline-current", ink ? "text-current opacity-70 hover:bg-[rgb(255_255_255/0.12)] hover:opacity-100" : "text-[var(--bd-subtle)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]")}
            >
              <XIcon weight="regular" className="size-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
