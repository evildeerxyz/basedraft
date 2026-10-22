"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useState, type ElementType, type ReactNode } from "react";

/*
 * The pages of a long list. The page you're on is inked on a pill that slides to the next, the
 * first and last stay in reach, and the ones far off fold into a quiet "…", so the row keeps its
 * length as you go and nothing under your pointer moves. When the window shifts, its numbers roll
 * the way you went. Compact, it's "Page 3 of 12" with the same roll. Buttons by default; give it
 * `href` and the pages are links a crawler can follow.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** The slots to show: page numbers and "…", always the same count once there are enough pages. */
function slots(page: number, total: number, siblings: number): Array<number | "…"> {
  const first = [1];
  const last = total > 1 ? [total] : [];
  const start = Math.max(Math.min(page - siblings, total - siblings * 2 - 2), 3);
  const end = Math.min(Math.max(page + siblings, siblings * 2 + 3), total - 2);
  return [...first, ...(start > 3 ? ["…" as const] : total > 2 ? [2] : []), ...range(start, end), ...(end < total - 2 ? ["…" as const] : total - 1 > 1 ? [total - 1] : []), ...last].filter((v, i, all) => v === "…" || all.indexOf(v) === i);
}

/** A number that rolls up or down to its new value, the way the page went. */
function Roll({ value, dir }: { value: ReactNode; dir: number }) {
  const still = useReducedMotion();
  return (
    <span className="relative inline-grid overflow-hidden [&>*]:[grid-area:1/1]">
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.span
          key={String(value)}
          custom={dir}
          variants={{ in: (d: number) => ({ y: still ? 0 : `${d * 90}%`, opacity: 0 }), at: { y: 0, opacity: 1 }, out: (d: number) => ({ y: still ? 0 : `${-d * 90}%`, opacity: 0 }) }}
          initial="in"
          animate="at"
          exit="out"
          transition={{ type: "spring", stiffness: 520, damping: 38 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export type PaginationProps = {
  /** The page you're on, from 1. */
  page: number;
  /** How many pages there are. */
  total: number;
  onPageChange?: (page: number) => void;
  /** How many pages show on each side of the current one. */
  siblings?: number;
  /** Every page in reach, or compact: "Page 3 of 12" between two arrows. */
  variant?: "pages" | "compact";
  /** Each page's address: the pages become links. */
  href?: (page: number) => string;
  /** Your router's link, like Next.js's Link, for when there's href. */
  link?: ElementType;
  /** What the nav is called, for a screen reader. */
  label?: string;
  className?: string;
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]";

export function Pagination({ page, total, onPageChange, siblings = 1, variant = "pages", href, link: Link = "a", label = "Pagination", className }: PaginationProps) {
  const id = useId();
  const still = useReducedMotion();
  const at = Math.min(Math.max(1, page), Math.max(1, total));
  // Which way the last change went, so the numbers roll that way.
  const [last, setLast] = useState({ page: at, dir: 1 });
  const dir = last.page === at ? last.dir : at > last.page ? 1 : -1;
  if (last.page !== at) setLast({ page: at, dir });

  /** A page as a button, or a link when there's href. */
  const go = (p: number, props: { className: string; "aria-label"?: string; "aria-current"?: "page"; disabled?: boolean; children: ReactNode }) => {
    const { disabled, ...rest } = props;
    // At an end, the arrow stays in place but can't be used or reached by Tab.
    if (disabled) return href ? <a role="link" aria-disabled="true" {...rest} className={cx(rest.className, "pointer-events-none opacity-35")} /> : <button type="button" disabled {...rest} className={cx(rest.className, "pointer-events-none opacity-35")} />;
    if (href) return <Link href={href(p)} onClick={() => onPageChange?.(p)} {...rest} />;
    return <button type="button" onClick={() => onPageChange?.(p)} {...rest} />;
  };
  const arrow = (to: number, side: "prev" | "next") =>
    go(to, {
      "aria-label": side === "prev" ? "Previous page" : "Next page",
      disabled: side === "prev" ? at <= 1 : at >= total,
      className: cx("grid size-9 shrink-0 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] [&_svg]:size-4", FOCUS),
      children: side === "prev" ? <CaretLeftIcon weight="regular" /> : <CaretRightIcon weight="regular" />,
    });

  if (variant === "compact") {
    return (
      <nav aria-label={label} className={cx("inline-flex items-center gap-1", className)}>
        {arrow(at - 1, "prev")}
        <span className="flex min-w-[112px] items-center justify-center gap-1 px-1 text-sm tabular-nums text-[var(--bd-muted)]" aria-live="polite">
          <span className="sr-only">
            Page {at} of {total}
          </span>
          <span aria-hidden className="flex items-center gap-1">
            Page
            <span className="font-medium text-[var(--bd-fg)]">
              <Roll value={at} dir={dir} />
            </span>
            of {total}
          </span>
        </span>
        {arrow(at + 1, "next")}
      </nav>
    );
  }

  const list = slots(at, total, siblings);
  return (
    <nav aria-label={label} className={className}>
      <LayoutGroup id={id}>
        <ul className="flex items-center gap-0.5">
          <li>{arrow(at - 1, "prev")}</li>
          {list.map((p, i) => (
            <li key={i}>
              {p === "…" ? (
                <span aria-hidden className="grid size-9 place-items-center text-[var(--bd-subtle)]">
                  …
                </span>
              ) : (
                go(p, {
                  "aria-label": `Page ${p}`,
                  "aria-current": p === at ? "page" : undefined,
                  className: cx(
                    "relative isolate grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm tabular-nums transition-colors duration-200",
                    p === at ? "font-medium text-[var(--bd-ui-ink-text)]" : "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]",
                    FOCUS,
                  ),
                  children: (
                    <>
                      {p === at && <motion.span layoutId="page" aria-hidden className="absolute inset-0 -z-10 rounded-full [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_4px_12px_-6px_rgb(var(--bd-shade)/0.5)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }} />}
                      <Roll value={p} dir={dir} />
                    </>
                  ),
                })
              )}
            </li>
          ))}
          <li>{arrow(at + 1, "next")}</li>
        </ul>
      </LayoutGroup>
    </nav>
  );
}
