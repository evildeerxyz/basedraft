"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

/*
 * A trend in the space of a word: a smooth line through the values, a soft wash under it, and a
 * dot on the latest that can pulse while it's live. The line draws in from the left the first time
 * it's seen. The wash is a fading gradient, or with dither, dots that thin out toward the floor.
 * It sizes to its box, so it fits a table cell, a stat or a sentence.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: which cells of the wash stay lit as it thins downward. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const fx = (n: number) => Math.round(n * 100) / 100;

/** A smooth path through the points that never overshoots them (monotone cubic). */
function smooth(pts: Array<[number, number]>) {
  if (pts.length < 2) return pts.length ? `M${fx(pts[0][0])},${fx(pts[0][1])}` : "";
  const n = pts.length;
  const d = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (p[0] - pts[i][0] || 1));
  const m = pts.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  let path = `M${fx(pts[0][0])},${fx(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    path += `C${fx(x0 + h)},${fx(y0 + m[i] * h)} ${fx(x1 - h)},${fx(y1 - m[i + 1] * h)} ${fx(x1)},${fx(y1)}`;
  }
  return path;
}

export type SparklineProps = Omit<ComponentProps<"span">, "children"> & {
  data: number[];
  /** How tall, in pixels. It's as wide as its box. */
  height?: number;
  /** The line's color: any CSS color. */
  color?: string;
  /** A wash under the line. */
  fill?: boolean;
  /** The wash as dots that thin toward the floor, instead of a fading gradient. */
  dither?: boolean;
  /** A dot on the latest value. */
  dot?: boolean;
  /** The dot pulses, for a value that's still coming in. */
  live?: boolean;
  /** What it shows, for a screen reader: "Visitors, last 30 days". */
  label?: string;
};

export function Sparkline({ data, height = 32, color = "var(--bd-ui-viz-1)", fill = true, dither = false, dot = true, live = false, label, className, style, ...props }: SparklineProps) {
  const box = useRef<HTMLSpanElement>(null);
  const seen = useInView(box, { once: true, amount: 0.5 });
  const still = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = dot ? 4 : 1.5;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i): [number, number] => [pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2), pad + (1 - (v - lo) / span) * (height - pad * 2)]);
  const line = smooth(pts);
  const area = pts.length > 1 ? `${line}L${fx(pts.at(-1)![0])},${height}L${fx(pts[0][0])},${height}Z` : "";
  const last = pts.at(-1);
  const first = data[0];
  const end = data.at(-1);
  const summary = label ?? `From ${first?.toLocaleString("en-US")} to ${end?.toLocaleString("en-US")}`;

  // The dithered wash: a column of cells as tall as the line, lit less the lower they sit.
  let dots = "";
  if (dither) {
    const rows = Math.ceil(height / 2);
    for (let r = 0; r < rows; r++) {
      const lit = 0.85 * (1 - r / rows) ** 1.3;
      for (let c = 0; c < 4; c++) if ((BAYER[(r % 4) * 4 + c] + 0.5) / 16 <= lit) dots += `M${c * 2},${r * 2}h2v2h-2z`;
    }
  }

  return (
    <span ref={box} role="img" aria-label={summary} className={cx("relative inline-block w-full align-middle", className)} style={{ height, color, ...style }} {...props}>
      {w > 0 && data.length > 0 && (
        <svg aria-hidden width={w} height={height} className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity={0.28} />
              <stop offset="1" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
            {dither && (
              <pattern id={`${uid}-d`} width={8} height={Math.ceil(height / 2) * 2} patternUnits="userSpaceOnUse">
                <path d={dots} fill="currentColor" opacity={0.55} />
              </pattern>
            )}
            <clipPath id={`${uid}-c`}>
              <motion.rect x={0} y={-4} height={height + 8} initial={{ width: still ? w : 0 }} animate={{ width: seen || still ? w + 8 : 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}-c)`}>
            {fill && <path d={area} fill={dither ? `url(#${uid}-d)` : `url(#${uid}-g)`} />}
            <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {dot && last && (
            <motion.g initial={{ opacity: still ? 1 : 0 }} animate={{ opacity: seen || still ? 1 : 0 }} transition={{ delay: still ? 0 : 0.75, duration: 0.2 }}>
              {live && <circle cx={last[0]} cy={last[1]} r={3} fill="currentColor" className="origin-center animate-[bd-ui-pulse_1.6s_ease-out_infinite] [transform-box:fill-box] motion-reduce:hidden" />}
              <circle cx={last[0]} cy={last[1]} r={3} fill="currentColor" stroke="var(--bd-surface)" strokeWidth={1.5} />
            </motion.g>
          )}
        </svg>
      )}
    </span>
  );
}
