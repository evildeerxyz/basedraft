"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

/*
 * A balance's past and where it's heading, on one line. What it was day by day runs in ink up to a
 * hairline for today; from there a ghost of the same line carries on at the pace it's spent, down
 * to where it runs out, marked. Turn on a top-up that runs by itself and the ghost becomes a saw
 * that never reaches zero. Point anywhere for that day's figure. When the balance or the pace
 * changes, the line glides to its new shape rather than being drawn again.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const DAY = 86_400_000;
const EASE = [0.16, 1, 0.3, 1] as const;

export type RunwayMark = { date: string; label: string };

export type RunwayProps = {
  /** What the balance was at the end of each day, oldest first, ending today. */
  history: number[];
  /** The day the first of them is for, YYYY-MM-DD. */
  start: string;
  /** What's spent in a day at the current pace. */
  burn: number;
  /** How many days ahead it looks. */
  ahead?: number;
  /** A top-up that runs by itself: this amount whenever the balance falls under that one. */
  autoReload?: { amount: number; below: number } | null;
  /** Things that happened: a top-up, a refund. A dot on the line, labeled. */
  events?: RunwayMark[];
  /** Days to mark on the axis: the next bill, a renewal. */
  marks?: RunwayMark[];
  currency?: string;
  /** What the balance is, for screen readers. */
  label?: string;
  height?: number;
  className?: string;
};

const dayIndex = (start: string, date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY);
const dateAt = (start: string, i: number) => new Date(Date.parse(`${start}T00:00:00Z`) + i * DAY);
const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** The days ahead at the current pace: down by the burn each day, topped up when it falls under the line, never under zero. */
export function forecast(from: number, burn: number, days: number, autoReload?: { amount: number; below: number } | null) {
  const out: number[] = [];
  let b = from;
  let emptyAt: number | null = null;
  for (let i = 1; i <= days; i++) {
    const next = b - burn;
    if (autoReload && next < autoReload.below) b = next + autoReload.amount;
    else if (next <= 0) {
      if (emptyAt === null) emptyAt = i - 1 + b / burn;
      b = 0;
    } else b = next;
    out.push(b);
  }
  return { days: out, runsOut: emptyAt };
}

export function Runway({ history, start, burn, ahead = 30, autoReload = null, events = [], marks = [], currency = "USD", label = "Balance", height = 200, className }: RunwayProps) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.4 });
  const still = useReducedMotion();
  const [w, setW] = useState(640);
  const [at, setAt] = useState<number | null>(null);
  // A resize redraws at once; a new balance or pace glides.
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(([e]) => {
      setResizing(true);
      setW(Math.max(160, Math.round(e.contentRect.width)));
      window.clearTimeout(t);
      t = window.setTimeout(() => setResizing(false), 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const money = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }), [currency]);
  const today = history.length - 1;
  const coming = useMemo(() => forecast(history[today] ?? 0, burn, ahead, autoReload), [history, today, burn, ahead, autoReload]);
  const all = [...history, ...coming.days];
  const n = all.length;
  const top = Math.max(...all, 1) * 1.14;

  // Room above the line for the labels on it, and under the baseline for the dates.
  const PAD_T = 26;
  const PAD_B = 28;
  const plotH = height - PAD_T - PAD_B;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => PAD_T + plotH * (1 - v / top);
  const line = (from: number, to: number) => all.slice(from, to + 1).map((v, k) => `${k ? "L" : "M"}${x(from + k).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const past = line(0, today);
  const future = line(today, n - 1);
  const area = (d: string, from: number, to: number) => `${d}L${x(to).toFixed(1)},${y(0).toFixed(1)}L${x(from).toFixed(1)},${y(0).toFixed(1)}Z`;
  const glide = still || resizing ? { duration: 0 } : { duration: 0.7, ease: EASE };

  const hovered = at === null ? null : { i: at, v: all[at], future: at > today };
  const runsOut = coming.runsOut === null ? null : today + coming.runsOut;

  // Words under the line, most important first: today, the day it runs out, then the first day, the
  // first of each month, the marks and the last day, each only where it has room. They're measured
  // by their length, and held inside the box at its ends.
  type Tick = { key: string; at: number; text: string; tone: "now" | "out" | "plain"; lo: number; hi: number; align: "start" | "center" | "end" };
  const ticks: Tick[] = [];
  const put = (key: string, i: number, text: string, tone: Tick["tone"] = "plain") => {
    const width = text.length * 6.4 + 4;
    const at = x(i);
    const align = at - width / 2 < 0 ? "start" : at + width / 2 > w ? "end" : "center";
    const lo = align === "start" ? at : align === "end" ? at - width : at - width / 2;
    if (ticks.some((t) => lo < t.hi + 12 && lo + width > t.lo - 12)) return;
    ticks.push({ key, at, text, tone, lo, hi: lo + width, align });
  };
  put("today", today, "Today", "now");
  if (runsOut !== null) put("out", runsOut, `Runs out ${short(dateAt(start, Math.round(runsOut)))}`, "out");
  put("first", 0, short(dateAt(start, 0)));
  for (let i = 1; i < n; i++) if (dateAt(start, i).getUTCDate() === 1) put(`d${i}`, i, short(dateAt(start, i)));
  for (const m of marks) {
    const i = dayIndex(start, m.date);
    if (i > 0 && i < n) put(`m${m.date}`, i, m.label);
  }
  put("last", n - 1, short(dateAt(start, n - 1)));

  const summary = `${label}: ${money.format(history[today] ?? 0)} today.${runsOut !== null ? ` At this pace it runs out around ${short(dateAt(start, Math.round(runsOut)))}.` : autoReload ? " It tops itself up, so it doesn't run out." : ""}`;

  return (
    <div
      ref={box}
      role="img"
      aria-label={summary}
      className={cx("relative w-full touch-none select-none", className)}
      style={{ height }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setAt(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
      }}
      onPointerLeave={() => setAt(null)}
    >
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="bd-runway-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "rgb(var(--bd-ink))", stopOpacity: 0.12 }} />
            <stop offset="1" style={{ stopColor: "rgb(var(--bd-ink))", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {/* Zero. */}
        <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="rgb(var(--bd-ink))" strokeOpacity={0.1} />
        {/* Where a top-up that runs by itself steps in. */}
        {autoReload && <line x1={x(today)} x2={w} y1={y(autoReload.below)} y2={y(autoReload.below)} stroke="rgb(var(--bd-ink))" strokeOpacity={0.22} strokeDasharray="3 4" />}
        {marks.map((m) => {
          const i = dayIndex(start, m.date);
          return i > 0 && i < n ? <line key={m.date} x1={x(i)} x2={x(i)} y1={PAD_T} y2={y(0)} stroke="rgb(var(--bd-ink))" strokeOpacity={0.1} strokeDasharray="2 3" /> : null;
        })}
        <motion.path initial={false} animate={{ d: area(past, 0, today) }} transition={glide} fill="url(#bd-runway-fill)" style={{ opacity: seen ? 1 : 0, transition: "opacity 0.8s" }} />
        <motion.path initial={false} animate={{ d: area(future, today, n - 1) }} transition={glide} style={{ fill: "rgb(var(--bd-ink))", fillOpacity: 0.04, opacity: seen ? 1 : 0, transition: "opacity 0.8s 0.4s" }} />
        <motion.path
          initial={{ pathLength: still ? 1 : 0 }}
          animate={{ d: past, pathLength: seen ? 1 : 0 }}
          transition={{ d: glide, pathLength: { duration: still ? 0 : 1.1, ease: EASE } }}
          fill="none"
          stroke="var(--bd-fg)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <motion.path
          initial={{ pathLength: still ? 1 : 0 }}
          animate={{ d: future, pathLength: seen ? 1 : 0 }}
          transition={{ d: glide, pathLength: { duration: still ? 0 : 0.9, ease: EASE, delay: still ? 0 : 0.9 } }}
          fill="none"
          stroke="var(--bd-fg)"
          strokeOpacity={0.3}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Today. */}
        <line x1={x(today)} x2={x(today)} y1={8} y2={y(0)} stroke="var(--bd-fg)" strokeOpacity={0.35} />
        {hovered && <line x1={x(hovered.i)} x2={x(hovered.i)} y1={8} y2={y(0)} stroke="var(--bd-fg)" strokeOpacity={0.5} />}
      </svg>

      {/* Dots and words over the line, in HTML so they stay round and crisp at any width. */}
      <motion.span aria-hidden initial={false} animate={{ left: x(today), top: y(history[today] ?? 0) }} transition={glide} className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bd-fg)] shadow-[0_0_0_3px_var(--bd-surface)]" />
      {events.map((e) => {
        const i = dayIndex(start, e.date);
        if (i < 0 || i > today) return null;
        return (
          <span key={e.date} aria-hidden className="absolute" style={{ left: x(i), top: y(all[i]) }}>
            <span className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--bd-fg)] bg-[var(--bd-surface)]" />
            <span className="absolute bottom-2 left-0 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium tabular-nums text-[var(--bd-fg)]">{e.label}</span>
          </span>
        );
      })}
      <AnimatePresence>
        {runsOut !== null && (
          <motion.span key="out" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1, left: x(runsOut), top: y(0) }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3, delay: seen ? 0 : 1.6 }, left: glide, top: glide }} className="absolute">
            <span className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bd-ui-stop)] bg-[var(--bd-surface)]" />
          </motion.span>
        )}
      </AnimatePresence>
      {autoReload && (
        <span aria-hidden className="absolute -translate-y-full pb-1 pl-2 text-[12px] text-[var(--bd-muted)]" style={{ top: y(autoReload.below), left: x(today) }}>
          Tops up under {money.format(autoReload.below).replace(/\.00$/, "")}
        </span>
      )}

      {/* The dates. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-5">
        {ticks.map((t) => (
          <span
            key={t.key}
            className={cx(
              "absolute bottom-0 whitespace-nowrap text-[12px] tabular-nums",
              t.tone === "now" ? "font-medium text-[var(--bd-fg)]" : t.tone === "out" ? "font-medium text-[var(--bd-ui-stop)]" : "text-[var(--bd-subtle)]",
              t.align === "center" ? "-translate-x-1/2" : t.align === "end" ? "-translate-x-full" : "",
            )}
            style={{ left: t.at }}
          >
            {t.text}
          </span>
        ))}
      </div>

      {/* The day pointed at. */}
      {hovered && (
        <span aria-hidden className={cx("pointer-events-none absolute top-0 whitespace-nowrap rounded-full bg-[var(--bd-raised)] px-2.5 py-1 text-[12px] tabular-nums shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_4px_12px_-4px_rgb(var(--bd-shade)/0.2)]", x(hovered.i) > w - 120 ? "-translate-x-full" : x(hovered.i) < 120 ? "" : "-translate-x-1/2")} style={{ left: x(hovered.i) }}>
          <span className="text-[var(--bd-muted)]">{hovered.i === today ? "Today" : short(dateAt(start, hovered.i))}</span> <span className={hovered.future ? "text-[var(--bd-muted)]" : "font-medium text-[var(--bd-fg)]"}>{hovered.future ? `~${money.format(hovered.v)}` : money.format(hovered.v)}</span>
        </span>
      )}
    </div>
  );
}
