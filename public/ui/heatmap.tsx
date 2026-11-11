"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

/*
 * A year of activity, a cell a day in columns of weeks. Each cell is shaded not by fading its
 * color but by an ordered dither: a quiet day is a few dots, a busy one nearly solid, so it reads
 * like print at any size and in light or dark alike. It fits as many weeks as its width holds,
 * ending on the last day, and fills in a column at a time the first time it's seen. Point at a
 * day, or move to it with the arrow keys, and a card says what happened on it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: the order a cell's dots light in as its day gets busier. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DAY = 86_400_000;
const CELL = 12;
const GAP = 3;
const PITCH = CELL + GAP;
/* Room for the weekday names on the left and the months on top. */
const LEFT = 28;
const TOP = 18;

/** YYYY-MM-DD to a time at midnight UTC, and back. */
const parse = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

export type HeatmapDay = { date: string; value: number };

export type HeatmapProps = {
  /** The days that had anything, as YYYY-MM-DD and a count. Days left out count as zero. */
  data: HeatmapDay[];
  /** What it shows, for a screen reader. */
  label: string;
  /** The last day shown, as YYYY-MM-DD. The latest day in data by default. */
  end?: string;
  /** How many weeks. As many as fit its width by default, up to a year. */
  weeks?: number;
  /** The day a week starts on: 0 for Sunday, 1 for Monday. */
  weekStart?: 0 | 1;
  /** How many shades past an empty day. */
  levels?: number;
  /** Where each shade starts, lowest first: a day at or past thresholds[i] gets shade i + 1. By default the active days split evenly, so each shade holds about as many. */
  thresholds?: number[];
  /** Each cell's shade as an ordered dither, or as solid steps. */
  pattern?: "dither" | "solid";
  /** The cells' color: any CSS color. */
  color?: string;
  /** A day's count as its card says it: "14 deploys". */
  format?: (value: number) => string;
  /** Runs when a day is clicked, or chosen with Enter. */
  onSelect?: (day: HeatmapDay) => void;
  /** Shows Less, the shades, More, under it. */
  legend?: boolean;
  className?: string;
};

export function Heatmap({ data, label, end, weeks, weekStart = 0, levels = 4, thresholds, pattern = "dither", color = "var(--bd-ui-viz-1)", format = (v) => `${v.toLocaleString("en-US")} ${v === 1 ? "event" : "events"}`, onSelect, legend = true, className }: HeatmapProps) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.2 });
  const still = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [byKeys, setByKeys] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = useMemo(() => new Map(data.map((d) => [d.date, d.value])), [data]);
  const last = useMemo(() => (end ? parse(end) : data.length ? Math.max(...data.map((d) => parse(d.date))) : 0), [end, data]);
  const fit = Math.max(4, Math.min(53, Math.floor((width - LEFT + GAP) / PITCH)));
  const cols = weeks ?? (width ? fit : 0);
  // The first column starts on the week's first day, so the last column holds the last day.
  const lastDow = (new Date(last).getUTCDay() - weekStart + 7) % 7;
  const first = last - lastDow * DAY - (cols - 1) * 7 * DAY;
  const count = cols ? (cols - 1) * 7 + lastDow + 1 : 0;
  const days = useMemo(() => Array.from({ length: count }, (_, i) => { const t = first + i * DAY; const date = iso(t); return { date, value: values.get(date) ?? 0, t }; }), [count, first, values]);

  // Where each shade starts: by default, the active days' quantiles, so one busy week doesn't leave the rest pale.
  const steps = useMemo(() => {
    if (thresholds) return thresholds;
    const active = days.map((d) => d.value).filter((v) => v > 0).sort((a, b) => a - b);
    const out = [Number.MIN_VALUE];
    for (let k = 1; k < levels; k++) out.push(Math.max(out[k - 1], active.length ? active[Math.floor((active.length * k) / levels)] : k));
    return out;
  }, [thresholds, days, levels]);
  const levelOf = (v: number) => (v <= 0 ? 0 : Math.max(1, steps.filter((s) => v >= s).length));
  const shades = steps.length;

  // A month's name over the first column that starts in it, unless it would crowd the one before.
  const months: Array<{ col: number; name: string }> = [];
  for (let c = 0; c < cols; c++) {
    const t = first + c * 7 * DAY;
    const m = new Date(t).getUTCMonth();
    const prev = c ? new Date(t - 7 * DAY).getUTCMonth() : -1;
    if (m !== prev && (months.length === 0 || c - months.at(-1)!.col >= 3) && (c > 0 || new Date(t).getUTCDate() <= 7)) months.push({ col: c, name: monthName.format(t) });
  }
  const total = days.reduce((s, d) => s + d.value, 0);
  const on = active != null ? days[active] : null;

  const move = (to: number) => {
    setByKeys(true);
    setActive(Math.max(0, Math.min(days.length - 1, to)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = active ?? days.length - 1;
    const moves: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    if (e.key in moves) move(active == null ? at : at + moves[e.key]);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(days.length - 1);
    else if (e.key === "Enter" && on) onSelect?.({ date: on.date, value: on.value });
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const W = LEFT + cols * PITCH - GAP;
  const H = TOP + 7 * PITCH - GAP;
  const fillOf = (level: number) => (pattern === "dither" ? `url(#${uid}-l${level})` : color);
  const cardX = on ? LEFT + Math.floor(days.indexOf(on) / 7) * PITCH + CELL / 2 : 0;
  const cardY = on ? TOP + (days.indexOf(on) % 7) * PITCH : 0;

  return (
    <div className={cx("w-full", className)}>
      <div
        ref={box}
        tabIndex={days.length ? 0 : -1}
        role="group"
        aria-label={label}
        aria-roledescription="heatmap"
        onKeyDown={onKey}
        onBlur={() => byKeys && setActive(null)}
        onPointerLeave={() => !byKeys && setActive(null)}
        className="relative w-full rounded-[10px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bd-ui-focus)]"
      >
        {cols > 0 && (
          <svg width={W} height={H} role="img" aria-label={`${label}: ${total.toLocaleString("en-US")} over ${cols} weeks, to ${longDate.format(last)}.`} className="block select-none overflow-visible" style={{ color }}>
            <defs>
              {/* Each shade as its own 4 by 4 dither, laid over the cell it fills. */}
              {Array.from({ length: shades }, (_, k) => {
                const lit = Math.round(((k + 1) / shades) * 16);
                return (
                  <pattern key={k} id={`${uid}-l${k + 1}`} patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
                    {BAYER.map((b, i) => (b < lit ? <rect key={i} x={(i % 4) / 4} y={Math.floor(i / 4) / 4} width={0.25} height={0.25} fill="currentColor" /> : null))}
                  </pattern>
                );
              })}
            </defs>
            {[1, 3, 5].map((r) => (
              <text key={r} x={0} y={TOP + r * PITCH + CELL / 2} dy="0.32em" className="fill-[var(--bd-subtle)] text-[10px]">
                {dayName.format(first + r * DAY)}
              </text>
            ))}
            {months.map((m) => (
              <text key={m.col} x={LEFT + m.col * PITCH} y={10} className="fill-[var(--bd-subtle)] text-[10px]">
                {m.name}
              </text>
            ))}
            {days.map((d, i) => {
              const c = Math.floor(i / 7);
              const r = i % 7;
              const level = levelOf(d.value);
              const x = LEFT + c * PITCH;
              const y = TOP + r * PITCH;
              return (
                <g
                  key={d.date}
                  onPointerEnter={() => {
                    setByKeys(false);
                    setActive(i);
                  }}
                  onClick={() => onSelect?.({ date: d.date, value: d.value })}
                  style={{ opacity: seen || still ? 1 : 0, transition: still ? undefined : `opacity 320ms ${c * 14}ms ease-out` }}
                >
                  <rect x={x} y={y} width={CELL} height={CELL} rx={3} className="fill-[var(--bd-ui-track)]" />
                  {level > 0 && <rect x={x} y={y} width={CELL} height={CELL} rx={3} fill={fillOf(level)} opacity={pattern === "solid" ? 0.2 + (0.8 * level) / shades : 1} />}
                </g>
              );
            })}
            {on && <rect x={LEFT + Math.floor(days.indexOf(on) / 7) * PITCH - 1.5} y={TOP + (days.indexOf(on) % 7) * PITCH - 1.5} width={CELL + 3} height={CELL + 3} rx={4.5} fill="none" strokeWidth={1.5} className="pointer-events-none stroke-[var(--bd-fg)]" />}
          </svg>
        )}
        <AnimatePresence>
          {on && (
            <motion.div
              key="card"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14 }}
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[12px] bg-[var(--bd-surface)] px-3 py-2 text-xs shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
              style={{ left: Math.min(Math.max(cardX, 70), Math.max(70, width - 70)), top: cardY - 8, translate: "-50% -100%" }}
            >
              <p className="font-medium tabular-nums text-[var(--bd-fg)]">{on.value ? format(on.value) : "Nothing"}</p>
              <p className="mt-0.5 text-[var(--bd-muted)]">{longDate.format(on.t)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {legend && cols > 0 && (
        <div aria-hidden className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[var(--bd-subtle)]" style={{ maxWidth: W }}>
          Less
          <svg width={shades * (CELL + 3) + CELL} height={CELL} className="overflow-visible" style={{ color }}>
            {Array.from({ length: shades + 1 }, (_, k) => (
              <g key={k}>
                <rect x={k * (CELL + 3)} y={0} width={CELL} height={CELL} rx={3} className="fill-[var(--bd-ui-track)]" />
                {k > 0 && <rect x={k * (CELL + 3)} y={0} width={CELL} height={CELL} rx={3} fill={fillOf(k)} opacity={pattern === "solid" ? 0.2 + (0.8 * k) / shades : 1} />}
              </g>
            ))}
          </svg>
          More
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {on && byKeys ? `${longDate.format(on.t)}: ${on.value ? format(on.value) : "nothing"}` : ""}
      </span>
    </div>
  );
}
