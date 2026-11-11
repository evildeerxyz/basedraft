"use client";

import { ChartLineIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

/*
 * Values over time as lit areas: each series a smooth line in the theme's data colors, with a soft
 * glow, and under it a wash of its color that fades away toward the baseline. Side by side or
 * stacked. It draws itself in from the left the first time it's seen, and again
 * when its data changes, a new range say. Point at it (or step with the arrow keys) and a
 * crosshair snaps to the nearest point, with a card of every series' value there, and tells you
 * which point, so a figure above it can follow. The legend turns series off and on, and what's
 * left re-scales on a spring. Pure SVG, sized to its container, light and dark from the theme.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type ValueFormat = "number" | "compact" | "currency" | "percent";
export type ChartDatum = Record<string, string | number | Date | null | undefined>;
export type ChartSeries = {
  /** The field in each datum that holds this series' value. */
  key: string;
  label: string;
  /** Any CSS color. The default is the theme's data colors, in order. */
  color?: string;
};

/* The theme's data colors, in their checked order; the fallbacks are its light steps. */
const PALETTE = ["var(--bd-ui-viz-1, oklch(56% 0.16 290))", "var(--bd-ui-viz-2, oklch(63% 0.12 166))", "var(--bd-ui-viz-3, oklch(66% 0.15 55))", "var(--bd-ui-viz-4, oklch(62% 0.13 236))", "var(--bd-ui-viz-5, oklch(58% 0.17 10))"];
/* The last point's quiet pulse, for a chart that's live. */
const PULSE = `@keyframes bd-ui-chart-pulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(3.2);opacity:0}}.bd-ui-chart-pulse{transform-box:fill-box;transform-origin:center;animation:bd-ui-chart-pulse 1.8s cubic-bezier(.16,1,.3,1) infinite}@media (prefers-reduced-motion:reduce){.bd-ui-chart-pulse{animation:none;opacity:0}}`;
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
/* The soft spring, critically damped so a re-scale never overshoots past the data. */
const SOFT = { stiffness: 300, damping: 35 };

const formatter = (format: ValueFormat, locale: string, currency: string, decimals?: number) =>
  new Intl.NumberFormat(locale, {
    ...(format === "currency" && { style: "currency", currency, maximumFractionDigits: decimals ?? 0 }),
    ...(format === "compact" && { notation: "compact", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "percent" && { style: "percent", maximumFractionDigits: decimals ?? 0 }),
    ...(format === "number" && { maximumFractionDigits: decimals ?? 0 }),
  });

/** A round step for about `count` ticks across `span`: 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(span: number, count: number) {
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function niceDomain(lo: number, hi: number, count: number) {
  if (hi <= lo) hi = lo + 1;
  const step = niceStep(hi - lo, count);
  return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step };
}

const num = (v: ChartDatum[string]) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const fx = (n: number) => Math.round(n * 10) / 10;

/* ---------- fill patterns ---------- */

/** How a chart's color fills its shapes: a smooth gradient, flat, an ordered pixel dither, halftone dots, fine diagonal lines, or nothing. */
export type ChartPattern = "gradient" | "solid" | "dither" | "dots" | "lines" | "none";

/* A 4 by 4 ordered (Bayer) dither: each cell's turn to fill in as the density rises. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/* A dither cell's side, and the spacing of halftone dots, in pixels. */
const CELL = 2;
const DOT = 4;
/* How full a pattern is from its strong end (0) to its faint end (1). */
const density = (t: number) => 1 - 0.82 * Math.min(1, Math.max(0, t)) ** 1.1;

/**
 * One tile of a pattern that runs the length of a shape: an ordered dither or halftone dots, full
 * at the shape's strong end and thinning toward the other. The tile is four dither cells (or two
 * dots) across and `length` long, as a single path. It runs top to bottom, or bottom to top with
 * `reverse`; lying down, right to left, or left to right with `reverse`.
 */
function patternTile(kind: "dither" | "dots", length: number, lying = false, reverse = false) {
  // A distance from the strong end, as a place along the shape: from its far side when it runs backward.
  const along = (dist: number, size: number) => (lying !== reverse ? length - dist - size : dist);
  const put = (a: number, across: number) => (lying ? [a, across] : [across, a]);
  let d = "";
  if (kind === "dither") {
    const rows = Math.max(1, Math.ceil(length / CELL));
    for (let r = 0; r < rows; r++) {
      const on = density(rows > 1 ? r / (rows - 1) : 0);
      for (let c = 0; c < 4; c++) {
        if ((BAYER[(r % 4) * 4 + c] + 0.5) / 16 > on) continue;
        const [x, y] = put(along(r * CELL, CELL), c * CELL);
        d += `M${fx(x)},${fx(y)}h${CELL}v${CELL}h${-CELL}z`;
      }
    }
    return { d, across: 4 * CELL };
  }
  // Dots on a staggered grid; the odd rows sit on the tile's edges, drawn on both, so the halves meet.
  for (let y = DOT / 2, row = 0; y < length; y += DOT, row++) {
    const r = fx(Math.max(0.3, (DOT / 2) * 0.9 * Math.sqrt(density(y / length))));
    for (const x of row % 2 ? [0, 2 * DOT] : [DOT]) {
      const [cx, cy] = put(along(y, 0), x);
      d += `M${fx(cx - r)},${fx(cy)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
    }
  }
  return { d, across: 2 * DOT };
}

/** A smooth path through points that never overshoots them (monotone cubic, Fritsch and Carlson). */
function monotone(pts: Array<[number, number]>, lead: "M" | "L" = "M") {
  const n = pts.length;
  if (!n) return "";
  let d = `${lead}${fx(pts[0][0])},${fx(pts[0][1])}`;
  if (n === 1) return d;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${fx(pts[i][0] + h)},${fx(pts[i][1] + t[i] * h)},${fx(pts[i + 1][0] - h)},${fx(pts[i + 1][1] - t[i + 1] * h)},${fx(pts[i + 1][0])},${fx(pts[i + 1][1])}`;
  }
  return d;
}

const straight = (pts: Array<[number, number]>, lead: "M" | "L" = "M") => pts.map(([x, y], i) => `${i ? "L" : lead}${fx(x)},${fx(y)}`).join("");

/** The container's width, kept current as it resizes. 0 until it's measured, so the server draws nothing to mismatch. */
function useWidth(ref: RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/**
 * Numbers that spring toward their targets together, on one frame loop: the y range, and each
 * series' weight as it's turned off (1) or on (0). With reduced motion they jump.
 */
function useSprings(targets: number[], still: boolean) {
  const [values, setValues] = useState(targets);
  const state = useRef<{ x: number[]; v: number[] } | null>(null);
  const key = targets.join("|");
  useEffect(() => {
    const goal = key.split("|").map(Number);
    if (!state.current || state.current.x.length !== goal.length || still) {
      state.current = { x: goal.slice(), v: goal.map(() => 0) };
      const id = requestAnimationFrame(() => setValues(goal));
      return () => cancelAnimationFrame(id);
    }
    const s = state.current;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.034, (now - last) / 1000) : 1 / 60;
      last = now;
      let moving = false;
      for (let i = 0; i < goal.length; i++) {
        s.v[i] += (-SOFT.stiffness * (s.x[i] - goal[i]) - SOFT.damping * s.v[i]) * dt;
        s.x[i] += s.v[i] * dt;
        const eps = Math.max(1e-4, Math.abs(goal[i]) * 1e-4);
        if (Math.abs(s.x[i] - goal[i]) > eps || Math.abs(s.v[i]) > eps * 10) moving = true;
      }
      if (!moving) goal.forEach((g, i) => ((s.x[i] = g), (s.v[i] = 0)));
      setValues(s.x.slice());
      if (moving) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, still]);
  return values;
}

/*
 * While it loads: a quiet wave in the track gray with a band of fine dots passing through it, the
 * library's skeleton shimmer, set once for every chart on the page.
 */
const SWEEP = `@keyframes bd-ui-chart-sweep{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0% 0;mask-position:0% 0}}.bd-ui-chart-sweep{background-image:radial-gradient(circle,rgb(var(--bd-ink)/.22) .7px,transparent 1.1px);background-size:4px 4px;-webkit-mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);-webkit-mask-size:300% 100%;mask-size:300% 100%;animation:bd-ui-chart-sweep 1.9s cubic-bezier(.45,0,.55,1) infinite}@media (prefers-reduced-motion:reduce){.bd-ui-chart-sweep{animation:none;opacity:0}}`;
const WAVE = [0.58, 0.46, 0.5, 0.34, 0.4, 0.26, 0.32, 0.2];

export type AreaChartProps = {
  data: ChartDatum[];
  /** The field that holds each point's place along the bottom: a date, a label or a number. */
  x: string;
  series: ChartSeries[];
  /** Pile the series on each other, so the top edge is their total. */
  stacked?: boolean;
  /** Smooth curves, or straight lines between points. */
  curve?: "smooth" | "linear";
  /** Height in pixels; the width follows the container. */
  height?: number;
  format?: ValueFormat;
  currency?: string;
  locale?: string;
  decimals?: number;
  /** How a point's place reads, on the bottom axis and in the card. Dates read as "Mar 4" by default. */
  formatX?: (value: ChartDatum[string], index: number) => string;
  /** About how many lines across. */
  ticks?: number;
  grid?: boolean;
  /** Shown above the chart; on by default when there's more than one series. */
  legend?: boolean;
  /** Anything under the lines at all. False is the same as pattern "none". */
  fill?: boolean;
  /**
   * How the color under each line is drawn: a wash fading toward the baseline, flat, an ordered
   * pixel dither or halftone dots that thin toward the baseline, fine diagonal lines, or nothing.
   */
  pattern?: ChartPattern;
  /** The values up the side. Off, the chart is only its lines, for a figure that already says the number. */
  yAxis?: boolean;
  /** A dot on each line's last point, pulsing: for figures that are still coming in. */
  live?: boolean;
  /** Told which point is pointed at, or null when none is, so a figure beside the chart can follow it. */
  onActiveChange?: (index: number | null) => void;
  /** Draw in from the left the first time it's seen. */
  animate?: boolean;
  loading?: boolean;
  /** What to say when there's nothing to draw. */
  empty?: ReactNode;
  /** What the chart shows, for its label and the summary a screen reader hears. */
  title?: string;
  /** A table of every value, read by screen readers and hidden from sight. */
  dataTable?: boolean;
  className?: string;
};

export function AreaChart({
  data,
  x,
  series,
  stacked = false,
  curve = "smooth",
  height = 260,
  format = "number",
  currency = "USD",
  locale = "en-US",
  decimals,
  formatX,
  ticks = 4,
  grid = true,
  legend,
  fill = true,
  pattern = "gradient",
  yAxis = true,
  live = false,
  onActiveChange,
  animate = true,
  loading = false,
  empty,
  title,
  dataTable = false,
  className,
}: AreaChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const box = useRef<HTMLDivElement>(null);
  const W = useWidth(box);
  const reduce = !!useReducedMotion();
  const seen = useInView(box, { once: true, amount: 0.35 });
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActiveState] = useState<number | null>(null);
  const setActive = (i: number | null) => {
    setActiveState(i);
    if (i !== active) onActiveChange?.(i);
  };
  const [byKeys, setByKeys] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [revealed, setRevealed] = useState(!animate);

  const fmt = useMemo(() => formatter(format, locale, currency, decimals), [format, locale, currency, decimals]);
  const n = data.length;
  const colors = series.map((s, i) => s.color ?? PALETTE[i % PALETTE.length]);
  const label = (i: number) => {
    const v = data[i]?.[x];
    if (formatX) return formatX(v, i);
    if (v instanceof Date) return v.toLocaleDateString(locale, { month: "short", day: "numeric" });
    return String(v ?? "");
  };

  // Where the y range should be, from what's showing: the tallest point, or the tallest pile when stacked.
  const goalMax = useMemo(() => {
    let hi = 0;
    for (const d of data) {
      let pile = 0;
      for (const s of series) {
        if (hidden.includes(s.key)) continue;
        pile = stacked ? pile + num(d[s.key]) : Math.max(pile, num(d[s.key]));
      }
      hi = Math.max(hi, pile);
    }
    return hi;
  }, [data, series, hidden, stacked]);
  const goalMin = useMemo(() => (stacked ? 0 : Math.min(0, ...data.flatMap((d) => series.filter((s) => !hidden.includes(s.key)).map((s) => num(d[s.key]))))), [data, series, hidden, stacked]);
  const goalDomain = niceDomain(goalMin, goalMax, ticks);
  const sprung = useSprings([goalDomain.lo, goalDomain.hi, ...series.map((s) => (hidden.includes(s.key) ? 0 : 1))], reduce);
  const [lo, hi] = sprung;
  const weights = sprung.slice(2);
  const wKey = weights.join("|");

  // The frame: room on the left for the widest tick, and below for the dates.
  const tickValues = useMemo(() => {
    const out: number[] = [];
    for (let v = goalDomain.lo; v <= goalDomain.hi + goalDomain.step / 2; v += goalDomain.step) out.push(+v.toFixed(10));
    return out;
  }, [goalDomain.lo, goalDomain.hi, goalDomain.step]);
  const axisFmt = useMemo(() => (format === "number" && goalDomain.hi >= 10000 ? formatter("compact", locale, currency) : fmt), [format, goalDomain.hi, locale, currency, fmt]);
  const left = yAxis ? Math.max(30, Math.max(...tickValues.map((v) => axisFmt.format(v).length)) * 6.6 + 14) : 6;
  const m = { top: 10, right: 10, bottom: 26, left };
  const iw = Math.max(1, W - m.left - m.right);
  const ih = Math.max(1, height - m.top - m.bottom);
  const px = (i: number) => m.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const py = (v: number) => m.top + ih - ((v - lo) / (hi - lo || 1)) * ih;

  // Every series' line and area, worked out again only when the frame or the springs move.
  const shapes = useMemo(() => {
    if (!W || !n) return [];
    const base = data.map(() => 0);
    const path = curve === "smooth" ? monotone : straight;
    return series.map((s, k) => {
      const w = weights[k] ?? 1;
      const top = data.map((d, i) => (stacked ? base[i] : 0) + num(d[s.key]) * w);
      const below = stacked ? base.slice() : data.map(() => 0);
      if (stacked) top.forEach((v, i) => (base[i] = v));
      const upper = top.map((v, i) => [px(i), py(v)] as [number, number]);
      const lower = below.map((v, i) => [px(i), py(v)] as [number, number]).reverse();
      const line = path(upper);
      const area = `${line}${path(lower, "L")}Z`;
      return { line, area, top, weight: w };
    });
    // px and py are rebuilt each render from the values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, n, data, series, stacked, curve, lo, hi, wKey, height, m.left]);

  // The x labels, spread out so they never crowd: about one per 90px, first and last pinned.
  const xTicks = useMemo(() => {
    if (!n) return [];
    const count = Math.max(2, Math.min(n, Math.floor(iw / 90)));
    const step = Math.max(1, Math.round((n - 1) / (count - 1)));
    const out: number[] = [];
    for (let i = 0; i < n; i += step) out.push(i);
    if (out[out.length - 1] !== n - 1) {
      if (n - 1 - out[out.length - 1] < step / 2) out.pop();
      out.push(n - 1);
    }
    return out;
  }, [n, iw]);

  const visible = series.filter((s) => !hidden.includes(s.key));
  const valueAt = (i: number, s: ChartSeries) => num(data[i]?.[s.key]);
  const describe = (i: number) => `${label(i)}: ${visible.map((s) => `${s.label} ${fmt.format(valueAt(i, s))}`).join(", ")}${stacked && visible.length > 1 ? `, total ${fmt.format(visible.reduce((t, s) => t + valueAt(i, s), 0))}` : ""}`;
  const summary = useMemo(() => {
    if (!n) return `${title ?? "Area chart"}: no data yet.`;
    const parts = series.map((s) => {
      const vals = data.map((d) => num(d[s.key]));
      return `${s.label} from ${fmt.format(vals[0])} to ${fmt.format(vals[vals.length - 1])}, highest ${fmt.format(Math.max(...vals))}`;
    });
    return `${title ?? "Area chart"}, ${n} points from ${label(0)} to ${label(n - 1)}. ${parts.join(". ")}.`;
    // label reads data and formatX, both listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, n, title, fmt, formatX, x, locale]);

  const pick = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !n) return;
    const t = (clientX - r.left - m.left) / iw;
    setActive(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
    setByKeys(false);
  };
  const step = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    setActive(next);
    setByKeys(true);
    setAnnounce(describe(next));
  };
  const onKey = (e: KeyboardEvent) => {
    if (!n) return;
    const cur = active ?? (e.key === "ArrowLeft" || e.key === "End" ? n : -1);
    const big = Math.max(1, Math.round(n / 10));
    const moves: Record<string, number> = { ArrowRight: cur + (e.shiftKey ? big : 1), ArrowLeft: cur - (e.shiftKey ? big : 1), Home: 0, End: n - 1, PageUp: cur + big, PageDown: cur - big };
    if (e.key in moves) {
      e.preventDefault();
      step(moves[e.key]);
    } else if (e.key === "Escape" && active !== null) {
      e.preventDefault();
      setActive(null);
    }
  };
  const toggle = (key: string) => setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : series.length - h.length > 1 ? [...h, key] : h));

  // New data (another range, say) draws in again from the left; a resize never does.
  const dataKey = `${n}|${label(0)}|${label(n - 1)}`;
  const [drawnKey, setDrawnKey] = useState(dataKey);
  const [again, setAgain] = useState(false);
  if (drawnKey !== dataKey) {
    setDrawnKey(dataKey);
    setAgain(true);
  }
  const redraw = again && animate && !reduce;

  const showLegend = legend ?? series.length > 1;
  const look: ChartPattern = fill ? pattern : "none";
  // One tile serves every series: the same density down the plot, each in its own color.
  const tile = useMemo(() => (look === "dither" || look === "dots" ? patternTile(look, Math.max(1, Math.round(ih))) : { d: "", across: 1 }), [look, ih]);
  const drawn = revealed || reduce || !animate;
  const settled = drawn && !redraw;
  const ax = active !== null ? px(active) : 0;
  const side = ax > m.left + iw * 0.62 ? "left" : "right";

  return (
    <div className={cx("w-full", className)}>
      {showLegend && (
        <div role="group" aria-label="Series" className="mb-3 flex flex-wrap gap-1">
          {series.map((s, i) => {
            const off = hidden.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={!off}
                onClick={() => toggle(s.key)}
                className="inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-xs font-medium text-[var(--bd-fg)] transition-[background-color,opacity] duration-200 hover:bg-[rgb(var(--bd-ink)/0.05)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.97]"
              >
                <span className={cx("size-2.5 rounded-full transition-[background-color,box-shadow] duration-200", off && "!bg-transparent")} style={{ background: colors[i], boxShadow: off ? `inset 0 0 0 1.5px ${colors[i]}` : undefined }} />
                <span className={cx("transition-opacity duration-200", off && "opacity-45")}>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <div
        ref={box}
        tabIndex={n ? 0 : -1}
        role="group"
        aria-roledescription="chart"
        aria-label={`${title ?? "Area chart"}. Arrow keys move through the points.`}
        onKeyDown={onKey}
        onBlur={() => byKeys && setActive(null)}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => !byKeys && setActive(null)}
        className="relative rounded-[10px] outline-none focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]"
        style={{ height, touchAction: "pan-y" }}
      >
        {W > 0 && (
          <svg width={W} height={height} role="img" aria-label={loading ? `${title ?? "Area chart"}, loading` : summary} className="block select-none overflow-visible">
            <defs>
              {/* The patterns: dither or dots down the plot's height, or lines that fade on the way down. */}
              {(look === "dither" || look === "dots") &&
                series.map((s, i) => (
                  <pattern key={`p${s.key}`} id={`${uid}-p${i}`} patternUnits="userSpaceOnUse" x={0} y={m.top} width={tile.across} height={ih}>
                    <path d={tile.d} fill={colors[i]} />
                  </pattern>
                ))}
              {look === "lines" && (
                <>
                  {series.map((s, i) => (
                    <pattern key={`l${s.key}`} id={`${uid}-l${i}`} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
                      <rect width={1.4} height={5} fill={colors[i]} />
                    </pattern>
                  ))}
                  <linearGradient id={`${uid}-fadeg`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
                    <stop offset="1" stopColor="#fff" stopOpacity={0.05} />
                  </linearGradient>
                  <mask id={`${uid}-fade`} maskUnits="userSpaceOnUse" x={0} y={m.top} width={W} height={ih}>
                    <rect x={0} y={m.top} width={W} height={ih} fill={`url(#${uid}-fadeg)`} />
                  </mask>
                </>
              )}
              {/* Each series' color, strong under its line and gone by the baseline. */}
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`${uid}-w${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: colors[i], stopOpacity: stacked ? 0.34 : 0.3 }} />
                  <stop offset="0.6" style={{ stopColor: colors[i], stopOpacity: stacked ? 0.16 : 0.08 }} />
                  <stop offset="1" style={{ stopColor: colors[i], stopOpacity: stacked ? 0.08 : 0 }} />
                </linearGradient>
              ))}
              <clipPath id={`${uid}-clip`}>
                <motion.rect
                  key={dataKey}
                  x={m.left - 6}
                  y={0}
                  height={height}
                  initial={{ width: redraw ? 0 : drawn ? iw + 12 : 0 }}
                  animate={{ width: drawn || seen ? iw + 12 : 0 }}
                  transition={redraw ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : drawn ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={() => {
                    if (seen && !revealed) setRevealed(true);
                    if (again) setAgain(false);
                  }}
                />
              </clipPath>
            </defs>

            {/* The grid and the values up the side. */}
            {tickValues.map((v) => (
              <g key={v} className="transition-opacity duration-300">
                {grid && <line x1={m.left} x2={m.left + iw} y1={fx(py(v)) + 0.5} y2={fx(py(v)) + 0.5} className={cx(v === 0 ? "stroke-[var(--bd-line)]" : "stroke-[var(--bd-line-subtle)] [stroke-opacity:0.6]")} />}
                {yAxis && (
                  <text x={m.left - 10} y={py(v)} dy="0.32em" textAnchor="end" className="fill-[var(--bd-subtle)] text-[11px] tabular-nums">
                    {axisFmt.format(v)}
                  </text>
                )}
              </g>
            ))}

            {loading ? (
              <path d={monotone(WAVE.map((f, i) => [m.left + (i / (WAVE.length - 1)) * iw, m.top + ih * f])) + `L${m.left + iw},${m.top + ih}L${m.left},${m.top + ih}Z`} className="fill-[var(--bd-ui-track)]" />
            ) : (
              <g clipPath={`url(#${uid}-clip)`}>
                {look !== "none" &&
                  shapes.map((sh, k) => (
                    <g key={`a${series[k].key}`} style={{ opacity: sh.weight }}>
                      {look === "solid" ? (
                        <path d={sh.area} fill={colors[k]} fillOpacity={0.2} />
                      ) : (
                        // The wash, under every pattern at half its strength so each area keeps its shape.
                        <path d={sh.area} fill={`url(#${uid}-w${k})`} opacity={look === "gradient" ? 1 : 0.45} />
                      )}
                      {(look === "dither" || look === "dots") && <path d={sh.area} fill={`url(#${uid}-p${k})`} />}
                      {look === "lines" && <path d={sh.area} fill={`url(#${uid}-l${k})`} mask={`url(#${uid}-fade)`} />}
                    </g>
                  ))}
                {shapes.map((sh, k) => (
                  <g key={`l${series[k].key}`} style={{ opacity: sh.weight }}>
                    {/* A soft glow, then the line itself. */}
                    <path d={sh.line} fill="none" stroke={colors[k]} strokeWidth={8} strokeOpacity={0.14} strokeLinejoin="round" strokeLinecap="round" style={{ filter: "blur(4px)" }} />
                    <path d={sh.line} fill="none" stroke={colors[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  </g>
                ))}
              </g>
            )}

            {/* The dates along the bottom. */}
            {!loading &&
              xTicks.map((i, j) => (
                <text key={i} x={px(i)} y={height - 6} textAnchor={j === 0 ? "start" : j === xTicks.length - 1 ? "end" : "middle"} className="fill-[var(--bd-subtle)] text-[11px] tabular-nums">
                  {label(i)}
                </text>
              ))}

            {/* Each line's last point, with a ring of the surface around it; pulsing when it's live. */}
            {!loading && settled && n > 0 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: active === null ? 1 : 0 }} transition={{ duration: 0.18 }}>
                {live && (
                  <style href="bd-ui-chart-pulse" precedence="medium">
                    {PULSE}
                  </style>
                )}
                {shapes.map((sh, k) =>
                  sh.weight > 0.5 ? (
                    <g key={series[k].key}>
                      {live && <circle cx={px(n - 1)} cy={py(sh.top[n - 1] ?? 0)} r={4} fill={colors[k]} className="bd-ui-chart-pulse" />}
                      <circle cx={px(n - 1)} cy={py(sh.top[n - 1] ?? 0)} r={4} fill={colors[k]} className="stroke-[var(--bd-surface)]" strokeWidth={2} />
                    </g>
                  ) : null,
                )}
              </motion.g>
            )}

            {/* Where the pointer is: a line down through the point, and a dot on each series. */}
            <AnimatePresence>
              {active !== null && !loading && n > 0 && (
                <motion.g key="cross" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <motion.line initial={false} animate={{ x1: ax, x2: ax }} transition={reduce ? { duration: 0 } : SNAPPY} y1={m.top} y2={m.top + ih} className="stroke-[var(--bd-line-strong)]" />
                  {shapes.map((sh, k) =>
                    sh.weight > 0.5 ? (
                      <motion.circle
                        key={series[k].key}
                        r={5}
                        initial={false}
                        animate={{ cx: ax, cy: py(sh.top[active] ?? 0) }}
                        transition={reduce ? { duration: 0 } : SNAPPY}
                        fill={colors[k]}
                        className="stroke-[var(--bd-surface)]"
                        strokeWidth={2.5}
                      />
                    ) : null,
                  )}
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
        )}

        {loading && W > 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            <style href="bd-ui-chart-sweep" precedence="medium">
              {SWEEP}
            </style>
            <span className="bd-ui-chart-sweep absolute inset-0" style={{ clipPath: `path('${monotone(WAVE.map((f, i) => [m.left + (i / (WAVE.length - 1)) * iw, m.top + ih * f]))}L${m.left + iw},${m.top + ih}L${m.left},${m.top + ih}Z')` }} />
          </span>
        )}

        {!loading && n === 0 && W > 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" style={{ paddingLeft: m.left, paddingBottom: m.bottom }}>
            <span className="flex items-center gap-2 rounded-full bg-[var(--bd-surface)] px-3.5 py-2 text-sm text-[var(--bd-muted)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
              <ChartLineIcon size={16} weight="duotone" />
              {empty ?? "No data yet"}
            </span>
          </div>
        )}

        {/* The card: what's at the point, each series and, stacked, their total. It follows the crosshair. */}
        <AnimatePresence>
          {active !== null && !loading && n > 0 && (
            <motion.div key="tip" aria-hidden initial={{ opacity: 0, x: ax }} animate={{ opacity: 1, x: ax }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={reduce ? { duration: 0 } : { x: SNAPPY, opacity: { duration: 0.12 } }} className="pointer-events-none absolute left-0 z-10" style={{ top: m.top + 2 }}>
              <div className="transition-transform duration-200 ease-[var(--bd-ease)]" style={{ transform: side === "left" ? "translateX(calc(-100% - 14px))" : "translateX(14px)" }}>
                <div className="min-w-[150px] whitespace-nowrap rounded-[12px] bg-[var(--bd-surface)] px-3 py-2.5 text-xs text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]">
                  <p className="mb-1.5 font-medium">{label(active)}</p>
                  <div className="grid gap-1">
                    {series.map((s, i) =>
                      hidden.includes(s.key) ? null : (
                        <p key={s.key} className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: colors[i] }} />
                          <span className="flex-1 text-[var(--bd-muted)]">{s.label}</span>
                          <span className="pl-3 font-medium tabular-nums">{fmt.format(valueAt(active, s))}</span>
                        </p>
                      ),
                    )}
                    {stacked && visible.length > 1 && (
                      <p className="mt-1 flex items-center gap-2 border-t border-[var(--bd-line)] pt-1.5">
                        <span className="flex-1 text-[var(--bd-muted)]">Total</span>
                        <span className="pl-3 font-semibold tabular-nums">{fmt.format(visible.reduce((t, s) => t + valueAt(active, s), 0))}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      {dataTable && n > 0 && (
        // In a div: a table ignores the 1px box sr-only gives it, and would still stretch whatever scrolls around the chart.
        <div className="sr-only">
          <table>
            <caption>{title ?? "Area chart"}</caption>
            <thead>
              <tr>
                <th scope="col">{x}</th>
                {series.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <th scope="row">{label(i)}</th>
                  {series.map((s) => (
                    <td key={s.key}>{fmt.format(num(d[s.key]))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
