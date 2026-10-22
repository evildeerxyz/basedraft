"use client";

import { ChartBarIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

/*
 * Values side by side as bars: grouped or stacked, standing up or lying down, with negatives hanging
 * below a firm zero line. The bars grow in from the baseline a beat apart the first time they're
 * seen. Point at a category (or step with the arrow keys) and its band lights up with a card of
 * every value in it. Turning a series off in the legend hands its room to the others on a spring.
 * Pure SVG, sized to its container, light and dark from the theme.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type ValueFormat = "number" | "compact" | "currency" | "percent";
export type ChartDatum = Record<string, string | number | Date | null | undefined>;
export type ChartSeries = {
  /** The field in each datum that holds this series' value. */
  key: string;
  label: string;
  /** Any CSS color. The default palette is ink, then a few quiet hues. */
  color?: string;
};

/* The theme's data colors, in their checked order; the fallbacks are its light steps. */
const PALETTE = ["var(--bd-ui-viz-1, oklch(56% 0.16 290))", "var(--bd-ui-viz-2, oklch(63% 0.12 166))", "var(--bd-ui-viz-3, oklch(66% 0.15 55))", "var(--bd-ui-viz-4, oklch(62% 0.13 236))", "var(--bd-ui-viz-5, oklch(58% 0.17 10))"];
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { stiffness: 300, damping: 35 };
/* How a bar grows in: quick to start and settling softly, like the rest of the library. */
const GROW = { type: "spring", stiffness: 260, damping: 30 } as const;

const formatter = (format: ValueFormat, locale: string, currency: string, decimals?: number) =>
  new Intl.NumberFormat(locale, {
    ...(format === "currency" && { style: "currency", currency, maximumFractionDigits: decimals ?? 0 }),
    ...(format === "compact" && { notation: "compact", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "percent" && { style: "percent", maximumFractionDigits: decimals ?? 0 }),
    ...(format === "number" && { maximumFractionDigits: decimals ?? 0 }),
  });

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

/** Numbers that spring toward their targets together on one frame loop; with reduced motion they jump. */
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

const SWEEP = `@keyframes bd-ui-chart-sweep{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0% 0;mask-position:0% 0}}.bd-ui-chart-sweep{background-image:radial-gradient(circle,rgb(var(--bd-ink)/.22) .7px,transparent 1.1px);background-size:4px 4px;-webkit-mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);-webkit-mask-size:300% 100%;mask-size:300% 100%;animation:bd-ui-chart-sweep 1.9s cubic-bezier(.45,0,.55,1) infinite}@media (prefers-reduced-motion:reduce){.bd-ui-chart-sweep{animation:none;opacity:0}}`;
/* The placeholder bars' heights while loading, as shares of the plot. */
const PLACEHOLDER = [0.45, 0.7, 0.55, 0.85, 0.62, 0.38, 0.74];

/** A bar's box, in the plot's pixels, with the side it grows from. */
type Box = { x: number; y: number; w: number; h: number; from: "bottom" | "top" | "left" | "right" };

/** A bar with its data end rounded and the end on the baseline square, so every bar stands on the line. */
function barPath({ x, y, w, h, from }: Box, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const a = (tx: number, ty: number) => `A${fx(r)},${fx(r)} 0 0 1 ${fx(tx)},${fx(ty)}`;
  if (!r) return `M${fx(x)},${fx(y)}H${fx(x + w)}V${fx(y + h)}H${fx(x)}Z`;
  if (from === "bottom") return `M${fx(x)},${fx(y + h)}V${fx(y + r)}${a(x + r, y)}H${fx(x + w - r)}${a(x + w, y + r)}V${fx(y + h)}Z`;
  if (from === "top") return `M${fx(x)},${fx(y)}H${fx(x + w)}V${fx(y + h - r)}${a(x + w - r, y + h)}H${fx(x + r)}${a(x, y + h - r)}Z`;
  if (from === "left") return `M${fx(x)},${fx(y)}H${fx(x + w - r)}${a(x + w, y + r)}V${fx(y + h - r)}${a(x + w - r, y + h)}H${fx(x)}Z`;
  return `M${fx(x + w)},${fx(y)}V${fx(y + h)}H${fx(x + r)}${a(x, y + h - r)}V${fx(y + r)}${a(x + r, y)}Z`;
}

export type BarChartProps = {
  data: ChartDatum[];
  /** The field that names each category. */
  x: string;
  series: ChartSeries[];
  /** Bars standing up (vertical) or lying down (horizontal), for long names or many rows. */
  layout?: "vertical" | "horizontal";
  /** Pile the series into one bar per category. */
  stacked?: boolean;
  /** Height in pixels, standing up. Lying down, the height follows the rows. */
  height?: number;
  /** Each row's height, lying down. */
  rowHeight?: number;
  format?: ValueFormat;
  currency?: string;
  locale?: string;
  decimals?: number;
  /** How a category's name reads. */
  formatX?: (value: ChartDatum[string], index: number) => string;
  ticks?: number;
  grid?: boolean;
  /** Shown above the chart; on by default when there's more than one series. */
  legend?: boolean;
  /** Each bar's value at its end (a stack's total, stacked). */
  valueLabels?: boolean;
  /** How round each bar's corners are. */
  radius?: number;
  /** Grow in the first time they're seen. */
  animate?: boolean;
  loading?: boolean;
  empty?: ReactNode;
  /** What the chart shows, for its label and the summary a screen reader hears. */
  title?: string;
  /** A table of every value, read by screen readers and hidden from sight. */
  dataTable?: boolean;
  className?: string;
};

export function BarChart({
  data,
  x,
  series,
  layout = "vertical",
  stacked = false,
  height: fixedHeight,
  rowHeight = 34,
  format = "number",
  currency = "USD",
  locale = "en-US",
  decimals,
  formatX,
  ticks = 4,
  grid = true,
  legend,
  valueLabels = false,
  radius = 5,
  animate = true,
  loading = false,
  empty,
  title,
  dataTable = false,
  className,
}: BarChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const W = useWidth(box);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = !!useReducedMotion();
  const seen = useInView(box, { once: true, amount: 0.3 });
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [byKeys, setByKeys] = useState(false);
  const [announce, setAnnounce] = useState("");
  const tag = useId();

  const lying = layout === "horizontal";
  const fmt = useMemo(() => formatter(format, locale, currency, decimals), [format, locale, currency, decimals]);
  const n = loading ? PLACEHOLDER.length : data.length;
  const height = fixedHeight ?? (lying ? Math.max(120, n * rowHeight + 36) : 260);
  const colors = series.map((s, i) => s.color ?? PALETTE[i % PALETTE.length]);
  const name = (i: number) => {
    const v = data[i]?.[x];
    return formatX ? formatX(v, i) : v instanceof Date ? v.toLocaleDateString(locale, { month: "short", day: "numeric" }) : String(v ?? "");
  };
  const on = (s: ChartSeries) => !hidden.includes(s.key);

  // The value range from what's showing, with zero always inside it.
  const goal = useMemo(() => {
    let lo = 0;
    let hi = 0;
    for (const d of data) {
      if (stacked) {
        let up = 0;
        let down = 0;
        for (const s of series) {
          if (hidden.includes(s.key)) continue;
          if (num(d[s.key]) >= 0) up += num(d[s.key]);
          else down += num(d[s.key]);
        }
        hi = Math.max(hi, up);
        lo = Math.min(lo, down);
      } else
        for (const s of series) {
          if (hidden.includes(s.key)) continue;
          hi = Math.max(hi, num(d[s.key]));
          lo = Math.min(lo, num(d[s.key]));
        }
    }
    return niceDomain(lo, hi, ticks);
  }, [data, series, hidden, stacked, ticks]);
  const sprung = useSprings([goal.lo, goal.hi, ...series.map((s) => (hidden.includes(s.key) ? 0 : 1))], reduce);
  const [lo, hi] = sprung;
  const weights = sprung.slice(2);
  // The last series still showing: the outermost piece of a stack, the only one with round corners.
  const lastOn = series.reduce((last, s, k) => (on(s) ? k : last), -1);
  const wKey = weights.join("|");

  const tickValues = useMemo(() => {
    const out: number[] = [];
    for (let v = goal.lo; v <= goal.hi + goal.step / 2; v += goal.step) out.push(+v.toFixed(10));
    return out;
  }, [goal.lo, goal.hi, goal.step]);
  const axisFmt = useMemo(() => (format === "number" && Math.max(Math.abs(goal.hi), Math.abs(goal.lo)) >= 10000 ? formatter("compact", locale, currency) : fmt), [format, goal.hi, goal.lo, locale, currency, fmt]);

  // The frame. Standing up, the left margin fits the widest tick; lying down, the longest name, up to two fifths of the width.
  const longestName = lying && !loading ? Math.max(...data.map((_, i) => name(i).length), 1) : 0;
  const left = lying ? Math.min(Math.max(56, longestName * 6.9 + 18), W * 0.4) : Math.max(30, Math.max(...tickValues.map((v) => axisFmt.format(v).length)) * 6.6 + 14);
  const m = { top: valueLabels && !lying ? 18 : 10, right: lying && valueLabels ? 48 : 10, bottom: 26, left };
  const iw = Math.max(1, W - m.left - m.right);
  const ih = Math.max(1, height - m.top - m.bottom);
  const span = hi - lo || 1;
  // Where a value falls along the value axis: up the side standing, across the bottom lying down.
  const at = (v: number) => (lying ? m.left + ((v - lo) / span) * iw : m.top + ih - ((v - lo) / span) * ih);
  const band = (lying ? ih : iw) / Math.max(1, n);
  const bandStart = (i: number) => (lying ? m.top : m.left) + i * band;

  // Every bar's box, worked out again only when the frame or the springs move.
  const bars = useMemo(() => {
    if (!W || loading || !data.length) return [] as Box[][];
    const total = weights.reduce((t, w) => t + w, 0) || 1;
    const zero = at(0);
    return data.map((d, i) => {
      const start = bandStart(i);
      if (stacked) {
        const thick = Math.min(band * 0.58, 30);
        const offset = start + (band - thick) / 2;
        let up = 0;
        let down = 0;
        return series.map((s, k) => {
          const v = num(d[s.key]) * (weights[k] ?? 1);
          const from = v >= 0 ? up : down;
          const to = from + v;
          if (v >= 0) up = to;
          else down = to;
          const a = at(from);
          const b = at(to);
          // A hair of space between segments, taken from the end away from zero.
          const gap = Math.min(1.5, Math.abs(b - a) / 3);
          if (lying) return { x: Math.min(a, b) + (v < 0 ? gap : 0), y: offset, w: Math.max(0, Math.abs(b - a) - gap), h: thick, from: v >= 0 ? "left" : "right" } as Box;
          return { x: offset, y: Math.min(a, b) + (v >= 0 ? gap : 0), w: thick, h: Math.max(0, Math.abs(b - a) - gap), from: v >= 0 ? "bottom" : "top" } as Box;
        });
      }
      // Grouped: each series gets a slot as wide as its weight, so a hidden one gives its room away smoothly.
      const inner = Math.min(band * 0.7, 24 * total);
      let cursor = start + (band - inner) / 2;
      return series.map((s, k) => {
        const w = weights[k] ?? 1;
        const slot = (inner * w) / total;
        const gap = series.length > 1 ? Math.min(4, slot * 0.2) : 0;
        const pos = cursor + gap / 2;
        cursor += slot;
        const v = num(d[s.key]) * w;
        const end = at(v);
        if (lying) return { x: Math.min(zero, end), y: pos, w: Math.abs(end - zero), h: Math.max(0, slot - gap), from: v >= 0 ? "left" : "right" } as Box;
        return { x: pos, y: Math.min(zero, end), w: Math.max(0, slot - gap), h: Math.abs(end - zero), from: v >= 0 ? "bottom" : "top" } as Box;
      });
    });
    // at and bandStart are rebuilt each render from the values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, loading, data, series, stacked, lying, lo, hi, wKey, height, m.left, m.top, m.right, band]);

  const visible = series.filter(on);
  const valueOf = (i: number, s: ChartSeries) => num(data[i]?.[s.key]);
  const totalOf = (i: number) => visible.reduce((t, s) => t + valueOf(i, s), 0);
  const describe = (i: number) => `${name(i)}: ${visible.map((s) => `${s.label} ${fmt.format(valueOf(i, s))}`).join(", ")}${stacked && visible.length > 1 ? `, total ${fmt.format(totalOf(i))}` : ""}`;
  const summary = useMemo(() => {
    if (!data.length) return `${title ?? "Bar chart"}: no data yet.`;
    const parts = series.map((s) => {
      let top = 0;
      data.forEach((d, i) => {
        if (num(d[s.key]) > num(data[top][s.key])) top = i;
      });
      return `${s.label} highest at ${name(top)}, ${fmt.format(num(data[top][s.key]))}`;
    });
    return `${title ?? "Bar chart"}, ${data.length} categories. ${parts.join(". ")}.`;
    // name reads data, x and formatX.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, title, fmt, formatX, x, locale]);

  const pick = (clientX: number, clientY: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !data.length || loading) return;
    const t = lying ? (clientY - r.top - m.top) / band : (clientX - r.left - m.left) / band;
    setActive(Math.max(0, Math.min(data.length - 1, Math.floor(t))));
    setByKeys(false);
  };
  const step = (i: number) => {
    const next = Math.max(0, Math.min(data.length - 1, i));
    setActive(next);
    setByKeys(true);
    setAnnounce(describe(next));
  };
  const onKey = (e: KeyboardEvent) => {
    if (!data.length) return;
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const cur = active ?? (back || e.key === "End" ? data.length : -1);
    const moves: Record<string, number> = { ArrowRight: cur + 1, ArrowDown: cur + 1, ArrowLeft: cur - 1, ArrowUp: cur - 1, Home: 0, End: data.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      step(moves[e.key]);
    } else if (e.key === "Escape" && active !== null) {
      e.preventDefault();
      setActive(null);
    }
  };
  const toggle = (key: string) => setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : series.length - h.length > 1 ? [...h, key] : h));

  const showLegend = legend ?? series.length > 1;
  const grow = animate && !reduce;
  const shown = !grow || seen;
  // The highlighted band, and which side of it the card sits on.
  const bandPos = active !== null ? bandStart(active) : 0;
  const tipAt = lying ? m.left + iw * 0.5 : bandPos + band / 2;
  const tipSide = lying ? "right" : tipAt > m.left + iw * 0.6 ? "left" : "right";
  // Placeholder bars while loading, as one path for the shimmer to pass through.
  const placeholder = loading
    ? PLACEHOLDER.map((f, i) => {
        const b = (lying ? ih : iw) / PLACEHOLDER.length;
        const thick = Math.min(b * 0.55, 40);
        const off = (lying ? m.top : m.left) + i * b + (b - thick) / 2;
        return lying ? { x: m.left, y: off, w: iw * f, h: thick } : { x: off, y: m.top + ih * (1 - f), w: thick, h: ih * f };
      })
    : [];

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
                <span className="size-2.5 rounded-[3px] transition-[background-color,box-shadow] duration-200" style={{ background: off ? "transparent" : colors[i], boxShadow: off ? `inset 0 0 0 1.5px ${colors[i]}` : undefined }} />
                <span className={cx("transition-opacity duration-200", off && "opacity-45")}>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <div
        ref={box}
        tabIndex={data.length && !loading ? 0 : -1}
        role="group"
        aria-roledescription="chart"
        aria-label={`${title ?? "Bar chart"}. Arrow keys move through the categories.`}
        onKeyDown={onKey}
        onBlur={() => byKeys && setActive(null)}
        onPointerMove={(e) => pick(e.clientX, e.clientY)}
        onPointerDown={(e) => pick(e.clientX, e.clientY)}
        onPointerLeave={() => !byKeys && setActive(null)}
        className="relative rounded-[10px] outline-none focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]"
        style={{ height, touchAction: lying ? "pan-x" : "pan-y" }}
      >
        {W > 0 && (
          <svg width={W} height={height} role="img" aria-label={loading ? `${title ?? "Bar chart"}, loading` : summary} className="block select-none overflow-visible">
            <defs>
              {/* Each bar lit toward its end, a little deeper at the baseline. */}
              {series.map((s, k) => (
                <linearGradient key={s.key} id={`${uid}-lit${k}`} x1={lying ? 1 : 0} y1={0} x2={0} y2={lying ? 0 : 1}>
                  <stop offset="0" style={{ stopColor: colors[k] }} />
                  <stop offset="1" style={{ stopColor: colors[k], stopOpacity: 0.78 }} />
                </linearGradient>
              ))}
              {/* The fine dots of the band behind a pointed-at category. */}
              <pattern id={`${uid}-dots`} width={4} height={4} patternUnits="userSpaceOnUse">
                <circle cx={2} cy={2} r={0.9} className="fill-[var(--bd-line-strong)]" />
              </pattern>
            </defs>
            {/* The highlighted band behind the bars. */}
            <AnimatePresence>
              {active !== null && !loading && (
                <motion.rect
                  key="band"
                  initial={{ opacity: 0, ...(lying ? { y: bandPos } : { x: bandPos }) }}
                  animate={{ opacity: 1, ...(lying ? { y: bandPos } : { x: bandPos }) }}
                  exit={{ opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { x: SNAPPY, y: SNAPPY, opacity: { duration: 0.14 } }}
                  {...(lying ? { x: 0, width: W, height: band } : { y: m.top - 6, width: band, height: ih + 6 })}
                  rx={10}
                  fill={`url(#${uid}-dots)`}
                />
              )}
            </AnimatePresence>

            {/* The grid, and the values along the value axis. */}
            {tickValues.map((v) =>
              lying ? (
                <g key={v}>
                  {grid && <line y1={m.top} y2={m.top + ih} x1={fx(at(v))} x2={fx(at(v))} className={v === 0 ? "stroke-[var(--bd-line-strong)]" : "stroke-[var(--bd-line-subtle)]"} />}
                  <text x={at(v)} y={height - 6} textAnchor="middle" className="fill-[var(--bd-subtle)] text-[11px] tabular-nums">
                    {axisFmt.format(v)}
                  </text>
                </g>
              ) : (
                <g key={v}>
                  {grid && <line x1={m.left} x2={m.left + iw} y1={fx(at(v))} y2={fx(at(v))} className={v === 0 ? "stroke-[var(--bd-line-strong)]" : "stroke-[var(--bd-line-subtle)]"} />}
                  <text x={m.left - 10} y={at(v)} dy="0.32em" textAnchor="end" className="fill-[var(--bd-subtle)] text-[11px] tabular-nums">
                    {axisFmt.format(v)}
                  </text>
                </g>
              ),
            )}

            {loading
              ? placeholder.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(radius, b.w / 2, b.h / 2)} className="fill-[var(--bd-ui-track)]" />)
              : bars.map((group, i) =>
                  group.map((b, k) => {
                    // Stacked, only the outermost piece of each pile is rounded; the rest meet square, a hairline of surface apart.
                    const outer = !stacked || k === lastOn;
                    const origin = { bottom: "50% 100%", top: "50% 0%", left: "0% 50%", right: "100% 50%" }[b.from];
                    return (
                      <motion.path
                        key={`${i}-${series[k].key}`}
                        d={barPath(b, outer ? radius : 0)}
                        fill={`url(#${uid}-lit${k})`}
                        initial={grow ? (lying ? { scaleX: 0 } : { scaleY: 0 }) : false}
                        animate={{ ...(lying ? { scaleX: shown ? 1 : 0 } : { scaleY: shown ? 1 : 0 }), opacity: active !== null && active !== i ? 0.42 : 1 }}
                        transition={{ ...GROW, delay: grow ? Math.min(0.6, i * 0.045 + k * 0.02) : 0, opacity: { duration: reduce ? 0 : 0.2 } }}
                        style={{ transformBox: "fill-box", transformOrigin: origin }}
                      />
                    );
                  }),
                )}

            {/* Values at the ends of the bars: each bar's, or a stack's total. */}
            {valueLabels &&
              !loading &&
              bars.map((group, i) => {
                const items = stacked ? [{ v: totalOf(i), b: group.reduce((a, b) => (lying ? (b.x + b.w > a.x + a.w ? b : a) : b.y < a.y ? b : a), group[0]), k: -1 }] : group.map((b, k) => ({ v: valueOf(i, series[k]), b, k })).filter((it) => (weights[it.k] ?? 1) > 0.6);
                return items.map(({ v, b, k }) =>
                  b ? (
                    <motion.text
                      key={`v${i}-${k}`}
                      initial={grow ? { opacity: 0 } : false}
                      animate={{ opacity: shown ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: grow ? Math.min(0.9, 0.35 + i * 0.045) : 0 }}
                      x={lying ? (v >= 0 ? b.x + b.w + 6 : b.x - 6) : b.x + b.w / 2}
                      y={lying ? b.y + b.h / 2 : v >= 0 ? b.y - 6 : b.y + b.h + 13}
                      dy={lying ? "0.32em" : undefined}
                      textAnchor={lying ? (v >= 0 ? "start" : "end") : "middle"}
                      className="fill-[var(--bd-muted)] text-[11px] font-medium tabular-nums"
                    >
                      {axisFmt.format(v)}
                    </motion.text>
                  ) : null,
                );
              })}

            {/* The categories' names. */}
            {!loading &&
              data.map((_, i) =>
                lying ? (
                  <text key={i} x={m.left - 10} y={bandStart(i) + band / 2} dy="0.32em" textAnchor="end" className={cx("text-[12px] transition-[fill] duration-200", active === i ? "fill-[var(--bd-fg)]" : "fill-[var(--bd-muted)]")}>
                    {name(i)}
                  </text>
                ) : band >= 34 || i % Math.ceil(34 / band) === 0 ? (
                  <text key={i} x={bandStart(i) + band / 2} y={height - 6} textAnchor="middle" className={cx("text-[11px] tabular-nums transition-[fill] duration-200", active === i ? "fill-[var(--bd-fg)]" : "fill-[var(--bd-subtle)]")}>
                    {name(i)}
                  </text>
                ) : null,
              )}
          </svg>
        )}

        {loading && W > 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            <style href="bd-ui-chart-sweep" precedence="medium">
              {SWEEP}
            </style>
            <span className="bd-ui-chart-sweep absolute inset-0" style={{ clipPath: `path('${placeholder.map((b) => `M${fx(b.x)},${fx(b.y)}h${fx(b.w)}v${fx(b.h)}h${fx(-b.w)}Z`).join("")}')` }} />
          </span>
        )}

        {!loading && !data.length && W > 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" style={{ paddingLeft: m.left, paddingBottom: m.bottom }}>
            <span className="flex items-center gap-2 rounded-full bg-[var(--bd-surface)] px-3.5 py-2 text-sm text-[var(--bd-muted)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
              <ChartBarIcon size={16} weight="duotone" />
              {empty ?? "No data yet"}
            </span>
          </div>
        )}

        {/* The card for the category under the pointer: each series' value, and the total when stacked. */}
        <AnimatePresence>
          {active !== null && !loading && data.length > 0 && (
            <motion.div
              key={`tip${tag}`}
              aria-hidden
              initial={{ opacity: 0, x: tipAt, y: lying ? bandPos + band : m.top }}
              animate={{ opacity: 1, x: tipAt, y: lying ? bandPos + band : m.top }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduce ? { duration: 0 } : { x: SNAPPY, y: SNAPPY, opacity: { duration: 0.12 } }}
              className="pointer-events-none absolute left-0 top-0 z-10"
            >
              <div className="transition-transform duration-200 ease-[var(--bd-ease)]" style={{ transform: lying ? "translate(-50%, 6px)" : tipSide === "left" ? `translateX(calc(-100% - ${band / 2 + 8}px))` : `translateX(${band / 2 + 8}px)` }}>
                <div className="min-w-[150px] whitespace-nowrap rounded-[12px] bg-[var(--bd-surface)] px-3 py-2.5 text-xs text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]">
                  <p className="mb-1.5 font-medium">{name(active)}</p>
                  <div className="grid gap-1">
                    {series.map((s, i) =>
                      on(s) ? (
                        <p key={s.key} className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-[3px]" style={{ background: colors[i] }} />
                          <span className="flex-1 text-[var(--bd-muted)]">{s.label}</span>
                          <span className="pl-3 font-medium tabular-nums">{fmt.format(valueOf(active, s))}</span>
                        </p>
                      ) : null,
                    )}
                    {stacked && visible.length > 1 && (
                      <p className="mt-1 flex items-center gap-2 border-t border-[var(--bd-line)] pt-1.5">
                        <span className="flex-1 text-[var(--bd-muted)]">Total</span>
                        <span className="pl-3 font-semibold tabular-nums">{fmt.format(totalOf(active))}</span>
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
      {dataTable && data.length > 0 && (
        <table className="sr-only">
          <caption>{title ?? "Bar chart"}</caption>
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
                <th scope="row">{name(i)}</th>
                {series.map((s) => (
                  <td key={s.key}>{fmt.format(num(d[s.key]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
