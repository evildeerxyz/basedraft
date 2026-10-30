"use client";

import { ArrowDownRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/*
 * One number that matters, on a card: what it is, its value rolling to each new figure, how far it
 * moved and whether that's good news, and a sparkline under it that draws itself in the first time
 * it's seen. Point along the line, or arrow along it with the keys, and a cursor rides it, showing
 * that point's figure. Up is good for revenue and down is good for refunds, so the tone follows
 * `good`, not the direction alone.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;

export type StatFormat = "number" | "currency" | "compact" | "percent";

export type StatProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the number is: "Revenue", "Visitors". */
  label: ReactNode;
  value: number;
  /** number: 18,240. currency: $48,210. compact: 18.2K. percent: 1.2%, from 0.012. */
  format?: StatFormat;
  /** For currency, the ISO code. */
  currency?: string;
  /** Digits after the point, at most. */
  decimals?: number;
  locale?: string;
  /** How far it moved, as a fraction: 0.124 is up 12.4%. */
  delta?: number;
  /** What the change is measured against, after it: "vs last month". */
  deltaLabel?: ReactNode;
  /** Which way is good news. Up for revenue, down for refunds. */
  good?: "up" | "down";
  /** The figures behind the sparkline, oldest first. Two or more draw it. */
  data?: number[];
  /**
   * How the color under the sparkline is drawn: a wash fading to the card's edge, flat, an ordered
   * pixel dither or halftone dots that thin toward the edge, fine diagonal lines, or nothing.
   */
  pattern?: ChartPattern;
  /** A name for each point, shown with its figure on the cursor: dates, weeks, months. */
  points?: string[];
  /** A small icon beside the label. */
  icon?: ReactNode;
  /** Say each new value to screen readers as it changes, for a figure that updates live. */
  live?: boolean;
};

const formatter = (format: StatFormat, locale: string, currency: string, decimals: number | undefined) =>
  new Intl.NumberFormat(locale, {
    ...(format === "currency" && { style: "currency", currency, maximumFractionDigits: decimals ?? 0 }),
    ...(format === "compact" && { notation: "compact", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "percent" && { style: "percent", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "number" && { maximumFractionDigits: decimals ?? 0 }),
  });

/** One digit: a reel of 0 to 9 behind a one-digit window, springing to its place. */
function Reel({ digit, delay, still }: { digit: number; delay: number; still: boolean }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden">
      <span className="invisible">0</span>
      <motion.span data-reel="" className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-digit}em` }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 22, mass: 0.9, delay }}>
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1em]">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** The figure as reels, keyed from the right so the ones stay the ones when it grows a digit. */
function Rolling({ text, still }: { text: string; still: boolean }) {
  const chars = [...text];
  return (
    <span aria-hidden className="inline-flex leading-none">
      {chars.map((ch, i) => {
        const fromEnd = chars.length - i;
        return /\d/.test(ch) ? <Reel key={`d${fromEnd}`} digit={+ch} delay={fromEnd * 0.035} still={still} /> : <span key={`c${fromEnd}`}>{ch}</span>;
      })}
    </span>
  );
}

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

/*
 * A smooth line through the points that never overshoots them (monotone cubic, Fritsch and
 * Carlson), so a flat week stays flat and a peak isn't drawn taller than it was.
 */
function curve(pts: Array<[number, number]>) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = pts.slice(1).map(([x], i) => x - pts[i][0]);
  const m = pts.slice(1).map(([, y], i) => (y - pts[i][1]) / dx[i]);
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

const HEIGHT = 64;
const PAD = 6;
/* The line's color: the theme's first data color; the fallback is its light step. */
const INK = "var(--bd-ui-viz-1, oklch(56% 0.16 290))";

/** The sparkline: drawn in once, then a cursor that rides it under the pointer or the arrow keys. */
function Spark({ data, points, fmt, label, pattern }: { data: number[]; points?: string[]; fmt: Intl.NumberFormat; label: string; pattern: ChartPattern }) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const gradient = useId();
  const [width, setWidth] = useState(0);
  const [at, setAt] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // The pill centers on the cursor, and keeps inside the card near either end.
  const flip = useTransform(x, (v) => (v < 56 ? "translateX(0)" : v > width - 56 ? "translateX(-100%)" : "translateX(-50%)"));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = useMemo<Array<[number, number]>>(() => {
    const lo = Math.min(...data);
    const hi = Math.max(...data);
    const span = hi - lo || 1;
    // Room under the line's lowest point, so the field of dots always has some depth.
    return data.map((v, i) => [(i / (data.length - 1)) * width, PAD + (1 - (v - lo) / span) * (HEIGHT - PAD - 22)]);
  }, [data, width]);
  const line = width ? curve(pts) : "";
  const tile = useMemo(() => (pattern === "dither" || pattern === "dots" ? patternTile(pattern, HEIGHT) : { d: "", across: 1 }), [pattern]);

  // The cursor springs from point to point, rather than jumping, as the pointer or the keys move it.
  const go = (i: number | null) => {
    setAt(i);
    if (i === null) return;
    const [px, py] = pts[i];
    if (reduce) {
      x.set(px);
      y.set(py);
    } else {
      animate(x, px, SNAPPY);
      animate(y, py, SNAPPY);
    }
  };
  const nearest = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    return Math.max(0, Math.min(data.length - 1, Math.round(((clientX - r.left) / r.width) * (data.length - 1))));
  };
  const onMove = (e: PointerEvent) => {
    const i = nearest(e.clientX);
    if (at === null) {
      // The first time in, it appears where the pointer is rather than travelling from the start.
      x.set(pts[i][0]);
      y.set(pts[i][1]);
    }
    if (i !== at) go(i);
  };
  const onKey = (e: KeyboardEvent) => {
    const last = data.length - 1;
    const next = e.key === "ArrowRight" ? Math.min(last, (at ?? -1) + 1) : e.key === "ArrowLeft" ? Math.max(0, (at ?? last + 1) - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : e.key === "Escape" ? null : undefined;
    if (next === undefined) return;
    e.preventDefault();
    go(next);
  };
  const said = at === null ? "" : `${points?.[at] ? `${points[at]}: ` : ""}${fmt.format(data[at])}`;

  return (
    <div
      ref={box}
      tabIndex={0}
      role="group"
      aria-label={`${label}, ${data.length} points, from ${fmt.format(data[0])} to ${fmt.format(data[data.length - 1])}. Arrow keys move along it.`}
      onPointerMove={onMove}
      onPointerLeave={() => setAt(null)}
      onKeyDown={onKey}
      onBlur={() => setAt(null)}
      className="relative -mx-5 -mb-5 mt-5 h-16 cursor-crosshair touch-none select-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
    >
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
      {width > 0 && (
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden className="overflow-visible">
          <defs>
            {/* The line's color, strong under it and gone by the card's edge. */}
            <linearGradient id={`${gradient}w`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: INK, stopOpacity: 0.32 }} />
              <stop offset="100%" style={{ stopColor: INK, stopOpacity: 0 }} />
            </linearGradient>
            {(pattern === "dither" || pattern === "dots") && (
              <pattern id={`${gradient}p`} patternUnits="userSpaceOnUse" x={0} y={0} width={tile.across} height={HEIGHT}>
                <path d={tile.d} fill={INK} />
              </pattern>
            )}
            {pattern === "lines" && (
              <>
                <pattern id={`${gradient}l`} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
                  <rect width={1.4} height={5} fill={INK} />
                </pattern>
                <linearGradient id={`${gradient}fg`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
                  <stop offset="1" stopColor="#fff" stopOpacity={0.05} />
                </linearGradient>
                <mask id={`${gradient}f`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={HEIGHT}>
                  <rect width={width} height={HEIGHT} fill={`url(#${gradient}fg)`} />
                </mask>
              </>
            )}
          </defs>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: seen || reduce ? 1 : 0 }} transition={{ duration: 0.6, delay: reduce ? 0 : 0.5 }}>
            {pattern === "solid" && <path d={`${line} L${width},${HEIGHT} L0,${HEIGHT} Z`} fill={INK} fillOpacity={0.2} />}
            {pattern !== "solid" && pattern !== "none" && <path d={`${line} L${width},${HEIGHT} L0,${HEIGHT} Z`} fill={`url(#${gradient}w)`} opacity={pattern === "gradient" ? 1 : 0.45} />}
            {(pattern === "dither" || pattern === "dots") && <path d={`${line} L${width},${HEIGHT} L0,${HEIGHT} Z`} fill={`url(#${gradient}p)`} />}
            {pattern === "lines" && <path d={`${line} L${width},${HEIGHT} L0,${HEIGHT} Z`} fill={`url(#${gradient}l)`} mask={`url(#${gradient}f)`} />}
          </motion.g>
          <motion.path d={line} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: seen || reduce ? 1 : 0 }} transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }} />
          {/* The latest point, on a ring of the card's face; it steps back while the cursor rides the line. */}
          <motion.circle cx={pts[pts.length - 1]?.[0] - 4} cy={pts[pts.length - 1]?.[1]} r={3.5} fill={INK} stroke="var(--bd-surface)" strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: (seen || reduce) && at === null ? 1 : 0 }} transition={{ duration: 0.25, delay: at === null && !reduce ? 0.9 : 0 }} />
          <motion.g initial={false} animate={{ opacity: at === null ? 0 : 1 }} transition={{ duration: 0.15 }}>
            <motion.line x1={0} x2={0} y1={0} y2={HEIGHT} stroke="var(--bd-fg)" strokeOpacity={0.18} strokeDasharray="2 3" style={{ x }} />
            <motion.circle r={4.5} fill={INK} stroke="var(--bd-surface)" strokeWidth={2} style={{ x, y }} />
          </motion.g>
        </svg>
      )}
      {/* The figure under the cursor, in a small ink pill above the line that turns at the far edge. */}
      <motion.div aria-hidden className="pointer-events-none absolute -top-9 left-0" style={{ x }} initial={false} animate={{ opacity: at === null ? 0 : 1, scale: at === null ? 0.96 : 1 }} transition={{ duration: 0.15 }}>
        <motion.span className="block whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-[var(--bd-ui-ink-text)] shadow-[0_6px_16px_-6px_rgb(var(--bd-shade)/0.45)] [background:var(--bd-ui-ink)]" style={{ transform: flip }}>
          {said || " "}
        </motion.span>
      </motion.div>
    </div>
  );
}

export function Stat({ label, value, format = "number", currency = "USD", decimals, locale = "en-US", delta, deltaLabel, good = "up", data, points, pattern = "gradient", icon, live = false, className, ...props }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const fmt = useMemo(() => formatter(format, locale, currency, decimals), [format, locale, currency, decimals]);
  const text = fmt.format(value);
  // Until it's been seen, every digit shows 0, so it can roll up from there.
  const shown = !seen && !reduce ? text.replace(/\d/g, "0") : text;
  const up = (delta ?? 0) > 0;
  const flat = !delta;
  const tone = flat ? "text-[var(--bd-muted)]" : up === (good === "up") ? "text-[var(--bd-ui-ok)]" : "text-[var(--bd-ui-stop)]";
  const Mark = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  const change = delta === undefined ? null : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(delta);
  const name = typeof label === "string" ? label : "Value";
  return (
    <div ref={ref} className={cx("flex w-full flex-col overflow-hidden rounded-[22px] bg-[var(--bd-surface)] p-5 text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[var(--bd-muted)]">
          {icon && <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[color-mix(in_oklab,var(--bd-ui-track)_60%,var(--bd-surface))] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.05)] [&_svg]:size-4">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        {/* How far it moved, as a pill in the tone of the news: green when it's good, red when it isn't. */}
        {change && (
          <span className={cx("inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums", tone, flat ? "bg-[var(--bd-ui-track)]" : up === (good === "up") ? "bg-[color-mix(in_oklab,var(--bd-ui-ok)_13%,var(--bd-surface))]" : "bg-[color-mix(in_oklab,var(--bd-ui-stop)_12%,var(--bd-surface))]")}>
            {!flat && <Mark size={12} weight="regular" aria-hidden />}
            {change}
          </span>
        )}
      </div>
      <span className="mt-4 text-[34px] font-semibold leading-none tracking-[-0.035em] tabular-nums">
        <span className="sr-only" aria-live={live ? "polite" : undefined}>
          {text}
        </span>
        <Rolling text={shown} still={!!reduce} />
      </span>
      {deltaLabel && change && <span className="mt-2 text-[12.5px] text-[var(--bd-subtle)]">{deltaLabel}</span>}
      {data && data.length > 1 && <Spark data={data} points={points} fmt={fmt} label={name} pattern={pattern} />}
    </div>
  );
}
