"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ElementType, type ReactNode } from "react";

/*
 * The top few of something, ranked: pages, referrers, countries. Each row is a name and a number,
 * with a slim bar under them whose dots thin out through an ordered dither toward the value, where
 * a hard edge marks it exactly. The bars grow in one after another when the list comes into view,
 * rows glide to their new places when the ranking changes, and pointing at one shows its share.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: which cells of the bar stay lit as it thins. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/* The bar: four cells of two pixels, eight pixels tall. */
const CELL = 2;
const TALL = 8;

/** How much of the bar is lit at a point along it, from 0 at its start to 1 at its end: solid, thinning to a quarter. */
const density = (t: number) => 1 - 0.74 * t ** 1.25;

/** The bar's fill as one path, for its own length, in the pattern asked for. */
function fill(pattern: "dither" | "dots", length: number) {
  let d = "";
  if (pattern === "dither") {
    const cols = Math.floor(length / CELL);
    for (let c = 0; c < cols; c++) {
      const lit = density(cols > 1 ? c / (cols - 1) : 0);
      for (let r = 0; r < TALL / CELL; r++) {
        if ((BAYER[r * 4 + (c % 4)] + 0.5) / 16 > lit) continue;
        d += `M${c * CELL},${r * CELL}h${CELL}v${CELL}h${-CELL}z`;
      }
    }
    return d;
  }
  // Dots on two staggered rows, each smaller than the last toward the end.
  for (let x = 2, i = 0; x < length; x += 4, i++) {
    const r = Math.max(0.45, 1.85 * Math.sqrt(density(x / length)));
    for (const y of i % 2 ? [2] : [6]) d += `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  }
  return d;
}

export type BarListItem = {
  name: string;
  value: number;
  /** Before the name: a favicon, a flag, an icon. */
  icon?: ReactNode;
  /** Makes the row a link. */
  href?: string;
};

export type BarListProps = {
  data: BarListItem[];
  /** The numbers as they read. Grouped with commas by default. */
  format?: (value: number) => string;
  /** Highest first, as given, or lowest first. */
  sort?: "desc" | "none" | "asc";
  /** How many rows show; the rest open from a Show more button. */
  limit?: number;
  /** The bars' fill: a dither that thins toward the value, round dots, solid, or a gradient. */
  pattern?: "dither" | "dots" | "solid" | "gradient";
  /** The bars' color: any CSS color. */
  color?: string;
  /** Shows each row's share of the total when it's pointed at. */
  share?: boolean;
  /** Makes each row a button. */
  onSelect?: (item: BarListItem) => void;
  /** Your router's link, like Next.js's Link, for rows with href. */
  link?: ElementType;
  /** What the list is, for a screen reader. */
  label?: string;
  className?: string;
};

const number = new Intl.NumberFormat("en-US");

export function BarList({ data, format = (v) => number.format(v), sort = "desc", limit, pattern = "dither", color = "var(--bd-ui-viz-1)", share = true, onSelect, link: Link = "a", label, className }: BarListProps) {
  const list = useRef<HTMLUListElement>(null);
  const seen = useInView(list, { once: true, amount: 0.3 });
  const still = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(0, el.clientWidth - 16)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = sort === "none" ? data : [...data].sort((a, b) => (sort === "desc" ? b.value - a.value : a.value - b.value));
  const top = Math.max(...rows.map((r) => r.value), 0) || 1;
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const shown = limit && !open ? rows.slice(0, limit) : rows;
  const hidden = rows.length - shown.length;

  return (
    <div className={cx("w-full", className)}>
      <ul ref={list} aria-label={label} id={id} className="grid">
        <AnimatePresence initial={false}>
          {shown.map((item, i) => {
            const w = Math.round((item.value / top) * width);
            const body = (
              <>
                <span className="flex items-center gap-2 text-[13.5px] leading-5">
                  {item.icon && <span className="grid size-4 shrink-0 place-items-center text-[var(--bd-muted)] [&_img]:size-4 [&_img]:rounded-[4px] [&_svg]:size-4">{item.icon}</span>}
                  <span className="min-w-0 flex-1 truncate text-[var(--bd-fg)]">{item.name}</span>
                  {share && <span className="shrink-0 text-xs tabular-nums text-[var(--bd-subtle)] opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-visible/row:opacity-100">{Math.round((item.value / total) * 100)}%</span>}
                  <span className="shrink-0 font-medium tabular-nums text-[var(--bd-fg)]">{format(item.value)}</span>
                </span>
                <span aria-hidden className="relative mt-1.5 block h-2">
                  {/* A faint track the whole way, so every row has the same rail. */}
                  <span className="absolute inset-0 rounded-[3px] bg-[var(--bd-ui-track)] opacity-70" />
                  <motion.span
                    className="absolute inset-y-0 left-0 block"
                    initial={{ width: 0 }}
                    animate={{ width: seen ? w : 0 }}
                    transition={still ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24, delay: seen && w ? Math.min(i, 8) * 0.06 : 0 }}
                  >
                    {width > 0 && (
                      <span className="absolute inset-0 overflow-hidden rounded-l-[3px]">
                      <svg width={w} height={TALL} className="block" style={{ color }}>
                        {pattern === "solid" ? (
                          <rect width={w} height={TALL} rx={2} fill="currentColor" opacity={0.85} />
                        ) : pattern === "gradient" ? (
                          <>
                            <defs>
                              <linearGradient id={`${id}-g${i}`} x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0" stopColor="currentColor" stopOpacity={0.9} />
                                <stop offset="1" stopColor="currentColor" stopOpacity={0.22} />
                              </linearGradient>
                            </defs>
                            <rect width={w} height={TALL} rx={2} fill={`url(#${id}-g${i})`} />
                          </>
                        ) : (
                          <path d={fill(pattern, w)} fill="currentColor" />
                        )}
                      </svg>
                      </span>
                    )}
                    {/* The edge that marks the value exactly, standing a little proud of the bar. */}
                    <span className="absolute inset-y-[-2px] right-0 w-[3px] rounded-full" style={{ background: color }} />
                  </motion.span>
                </span>
              </>
            );
            const row = "group/row block rounded-[12px] px-2 py-2 outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]";
            return (
              <motion.li key={item.name} layout={still ? false : "position"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ layout: { type: "spring", stiffness: 420, damping: 38 } }}>
                {item.href ? (
                  <Link href={item.href} className={cx(row, "hover:bg-[rgb(var(--bd-ink)/0.04)]")}>
                    {body}
                  </Link>
                ) : onSelect ? (
                  <button type="button" onClick={() => onSelect(item)} className={cx(row, "w-full text-left hover:bg-[rgb(var(--bd-ink)/0.04)]")}>
                    {body}
                  </button>
                ) : (
                  <div className={cx(row, "hover:bg-[rgb(var(--bd-ink)/0.025)]")}>{body}</div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {limit != null && rows.length > limit && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="mx-2 mt-1 h-8 rounded-full px-3 text-[13px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          {open ? "Show fewer" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
