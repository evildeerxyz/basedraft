"use client";

import { ChartDonutIcon } from "@phosphor-icons/react";
import { animate as tween, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

/*
 * Parts of a whole as a ring: the segments sweep in around it the first time it's seen, and the
 * total rolls up in the middle. Point at a segment (or its row in the legend, or step with the
 * arrow keys) and it slides out a little while the others step back, and the middle shows its
 * share. The legend lists every part with its value and share, and turns parts off and on; what's
 * left closes the gap on a spring. Pure SVG, sized to its container, light and dark from the theme.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type ValueFormat = "number" | "compact" | "currency" | "percent";
export type DonutDatum = {
  label: string;
  value: number;
  /** Any CSS color. The default palette is ink, then a few quiet hues and grays. */
  color?: string;
};

/* The theme's data colors, in their checked order, then its neutral for the rest; the fallbacks are its light steps. */
const PALETTE = ["var(--bd-ui-viz-1, oklch(56% 0.16 290))", "var(--bd-ui-viz-2, oklch(63% 0.12 166))", "var(--bd-ui-viz-3, oklch(66% 0.15 55))", "var(--bd-ui-viz-4, oklch(62% 0.13 236))", "var(--bd-ui-viz-5, oklch(58% 0.17 10))", "var(--bd-ui-viz-6, oklch(72% 0.01 265))"];
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { stiffness: 300, damping: 35 };

const formatter = (format: ValueFormat, locale: string, currency: string, decimals?: number) =>
  new Intl.NumberFormat(locale, {
    ...(format === "currency" && { style: "currency", currency, maximumFractionDigits: decimals ?? 0 }),
    ...(format === "compact" && { notation: "compact", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "percent" && { style: "percent", maximumFractionDigits: decimals ?? 0 }),
    ...(format === "number" && { maximumFractionDigits: decimals ?? 0 }),
  });
const shareFmt = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

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
        if (Math.abs(s.x[i] - goal[i]) > 1e-4 || Math.abs(s.v[i]) > 1e-3) moving = true;
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

/** One digit of the rolling total: a reel of 0 to 9 springing to its place behind a one-digit window. */
function Reel({ digit, delay, still }: { digit: number; delay: number; still: boolean }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden">
      <span className="invisible">0</span>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-digit}em` }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 22, mass: 0.9, delay }}>
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1em]">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Roll({ text, still }: { text: string; still: boolean }) {
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

const SWEEP = `@keyframes bd-ui-chart-sweep{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0% 0;mask-position:0% 0}}.bd-ui-chart-sweep{background-image:radial-gradient(circle,rgb(var(--bd-ink)/.22) .7px,transparent 1.1px);background-size:4px 4px;-webkit-mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);-webkit-mask-size:300% 100%;mask-size:300% 100%;animation:bd-ui-chart-sweep 1.9s cubic-bezier(.45,0,.55,1) infinite}@media (prefers-reduced-motion:reduce){.bd-ui-chart-sweep{animation:none;opacity:0}}`;

export type DonutChartProps = {
  data: DonutDatum[];
  /** The ring's largest width in pixels; it shrinks to fit a narrow container. */
  size?: number;
  /** How thick the ring is. */
  thickness?: number;
  format?: ValueFormat;
  currency?: string;
  locale?: string;
  decimals?: number;
  /** What the middle says under the total. */
  centerLabel?: string;
  /** The middle's number, if it isn't the sum of the parts. */
  centerValue?: number;
  /** Beside the ring, under it, or none. Auto puts it beside when there's room. */
  legend?: "auto" | "right" | "bottom" | false;
  /** The space between segments, in pixels. */
  gap?: number;
  /** Sweep in the first time it's seen. */
  animate?: boolean;
  loading?: boolean;
  empty?: ReactNode;
  /** What the chart shows, for its label and the summary a screen reader hears. */
  title?: string;
  /** A table of every value, read by screen readers and hidden from sight. */
  dataTable?: boolean;
  className?: string;
};

export function DonutChart({
  data,
  size = 220,
  thickness = 16,
  format = "number",
  currency = "USD",
  locale = "en-US",
  decimals,
  centerLabel = "Total",
  centerValue,
  legend = "auto",
  gap = 5,
  animate = true,
  loading = false,
  empty,
  title,
  dataTable = false,
  className,
}: DonutChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const W = useWidth(box);
  const reduce = !!useReducedMotion();
  const seen = useInView(ring, { once: true, amount: 0.4 });
  const [hidden, setHidden] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [byKeys, setByKeys] = useState(false);
  const [announce, setAnnounce] = useState("");
  const fmt = useMemo(() => formatter(format, locale, currency, decimals), [format, locale, currency, decimals]);
  const colors = data.map((d, i) => d.color ?? PALETTE[i % PALETTE.length]);

  // How far the sweep has come round, 0 to 1. It runs once, when the ring is first seen.
  const sweep = useMotionValue(animate && !reduce ? 0 : 1);
  const [progress, setProgress] = useState(animate && !reduce ? 0 : 1);
  useMotionValueEvent(sweep, "change", setProgress);
  useEffect(() => {
    if (!seen || sweep.get() >= 1) return;
    const c = tween(sweep, 1, { duration: 1.15, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [seen, sweep]);

  // Each part's weight springs to 0 as it's turned off, so the rest close the gap rather than jump.
  const weights = useSprings(
    data.map((_, i) => (hidden.includes(i) ? 0 : 1)),
    reduce,
  );
  const values = data.map((d, i) => Math.max(0, d.value) * (weights[i] ?? 1));
  const sum = values.reduce((t, v) => t + v, 0);
  const total = centerValue ?? data.reduce((t, d, i) => t + (hidden.includes(i) ? 0 : Math.max(0, d.value)), 0);
  const shareOf = (i: number) => {
    const t = data.reduce((acc, d, j) => acc + (hidden.includes(j) ? 0 : Math.max(0, d.value)), 0);
    return t ? Math.max(0, data[i].value) / t : 0;
  };

  // The layout: beside the ring when there's room for a legend, under it otherwise.
  const side = legend === "auto" ? (W >= size + 230 ? "right" : "bottom") : legend;
  const D = Math.max(120, Math.min(size, side === "right" ? W - 230 : W));
  const r = (D - thickness) / 2 - 8;
  const C = 2 * Math.PI * r;
  const several = data.filter((_, i) => !hidden.includes(i)).length > 1;
  const gapShare = several ? gap / C : 0;
  // Round ends reach past a dash by half the ring's thickness each side, so with several parts each dash is drawn that much shorter.
  const capShare = several ? thickness / C : 0;

  // Each segment's start and length around the ring, as shares of it, inside its round ends.
  const segs: Array<{ start: number; len: number }> = [];
  for (let i = 0, at = 0; i < values.length; i++) {
    const f = sum ? values[i] / sum : 0;
    const len = f - gapShare - capShare;
    // A part too small for its ends is drawn as a dot at its middle.
    segs.push(len > 0 ? { start: at + capShare / 2, len } : { start: at + Math.max(0, f - gapShare) / 2, len: f > 0 ? 0.0006 : 0 });
    at += f;
  }

  const visibleIdx = data.map((_, i) => i).filter((i) => !hidden.includes(i) && data[i].value > 0);
  const describe = (i: number) => `${data[i].label}: ${fmt.format(data[i].value)}, ${shareFmt.format(shareOf(i))}`;
  const summary = data.length ? `${title ?? "Donut chart"}, ${centerLabel.toLowerCase()} ${fmt.format(total)}. ${data.map((d, i) => `${d.label} ${fmt.format(d.value)}, ${shareFmt.format(shareOf(i))}`).join("; ")}.` : `${title ?? "Donut chart"}: no data yet.`;

  const step = (i: number) => {
    setActive(i);
    setByKeys(true);
    setAnnounce(describe(i));
  };
  const onKey = (e: KeyboardEvent) => {
    if (!visibleIdx.length) return;
    const pos = active === null ? -1 : visibleIdx.indexOf(active);
    const len = visibleIdx.length;
    const moves: Record<string, number> = { ArrowRight: pos + 1, ArrowDown: pos + 1, ArrowLeft: pos - 1, ArrowUp: pos - 1, Home: 0, End: len - 1 };
    if (e.key in moves) {
      e.preventDefault();
      const next = active === null && (e.key === "ArrowLeft" || e.key === "ArrowUp") ? len - 1 : (moves[e.key] + len) % len;
      step(visibleIdx[next]);
    } else if (e.key === "Escape" && active !== null) {
      e.preventDefault();
      setActive(null);
    }
  };
  const toggle = (i: number) => {
    if (!hidden.includes(i) && data.length - hidden.length <= 1) return;
    if (!hidden.includes(i) && active === i) setActive(null);
    setHidden((h) => (h.includes(i) ? h.filter((k) => k !== i) : [...h, i]));
  };

  const still = reduce || !animate;
  const center = D / 2;
  const hasData = data.length > 0 && data.some((d) => d.value > 0);
  // The middle's type scales with the ring.
  const big = Math.round(D * 0.13);

  return (
    <div ref={box} className={cx("w-full", className)}>
      <div className={cx("flex gap-6", side === "right" ? "items-center" : "flex-col items-center")}>
        <div
          ref={ring}
          tabIndex={hasData && !loading ? 0 : -1}
          role="group"
          aria-roledescription="chart"
          aria-label={`${title ?? "Donut chart"}. Arrow keys move through the parts.`}
          onKeyDown={onKey}
          onBlur={() => byKeys && setActive(null)}
          onPointerLeave={() => !byKeys && setActive(null)}
          className="relative shrink-0 rounded-full outline-none focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]"
          style={{ width: D, height: D }}
        >
          {W > 0 && (
            <svg width={D} height={D} role="img" aria-label={loading ? `${title ?? "Donut chart"}, loading` : summary} className="block overflow-visible">
              {/* The track, only while there's nothing on it yet. */}
              {(loading || !hasData) && <circle cx={center} cy={center} r={r} fill="none" strokeWidth={thickness} className="stroke-[var(--bd-ui-track)]" />}
              {!loading && hasData && (
                <g transform={`rotate(-90 ${center} ${center})`}>
                  {segs.map((s, i) => {
                    // How much of this segment the sweep has reached.
                    const shown = Math.max(0, Math.min(s.len, progress - s.start));
                    if (shown <= 0.0005) return null;
                    const mid = (s.start + s.len / 2) * 2 * Math.PI;
                    const out = active === i ? 6 : 0;
                    return (
                      <motion.g key={i} initial={false} animate={{ x: Math.cos(mid) * out, y: Math.sin(mid) * out, opacity: active !== null && active !== i ? 0.4 : 1 }} transition={reduce ? { duration: 0 } : { ...SNAPPY, opacity: { duration: 0.2 } }}>
                        <circle
                          cx={center}
                          cy={center}
                          r={r}
                          fill="none"
                          stroke={colors[i]}
                          strokeWidth={thickness}
                          strokeLinecap={several ? "round" : "butt"}
                          pathLength={1000}
                          strokeDasharray={`${shown * 1000} ${1000 - shown * 1000}`}
                          strokeDashoffset={-s.start * 1000}
                          pointerEvents="stroke"
                          onPointerEnter={() => {
                            setActive(i);
                            setByKeys(false);
                          }}
                          className="cursor-default"
                        />
                      </motion.g>
                    );
                  })}
                </g>
              )}
            </svg>
          )}

          {loading && W > 0 && (
            <span aria-hidden className="pointer-events-none absolute inset-0">
              <style href="bd-ui-chart-sweep" precedence="medium">
                {SWEEP}
              </style>
              <span
                className="bd-ui-chart-sweep absolute inset-0"
                style={{ clipPath: `path(evenodd, 'M${center - r - thickness / 2},${center}a${r + thickness / 2},${r + thickness / 2} 0 1,0 ${2 * r + thickness},0a${r + thickness / 2},${r + thickness / 2} 0 1,0 ${-(2 * r + thickness)},0ZM${center - r + thickness / 2},${center}a${r - thickness / 2},${r - thickness / 2} 0 1,0 ${2 * r - thickness},0a${r - thickness / 2},${r - thickness / 2} 0 1,0 ${-(2 * r - thickness)},0Z')` }}
              />
            </span>
          )}

          {/* The middle: the total, or the share of the part under the pointer. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {loading ? null : !hasData ? (
                <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1.5 text-sm text-[var(--bd-muted)]">
                  <ChartDonutIcon size={18} weight="duotone" />
                  {empty ?? "No data yet"}
                </motion.span>
              ) : active === null ? (
                <motion.span key="total" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="flex flex-col items-center">
                  <span className="font-semibold tabular-nums tracking-[-0.02em] text-[var(--bd-fg)]" style={{ fontSize: big }}>
                    <Roll text={progress < 0.05 && !still ? fmt.format(0) : fmt.format(total)} still={still} />
                  </span>
                  <span className="mt-1.5 text-xs text-[var(--bd-muted)]">{centerLabel}</span>
                </motion.span>
              ) : (
                <motion.span key={`a${active}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="flex max-w-[70%] flex-col items-center">
                  <span className="font-semibold tabular-nums tracking-[-0.02em] text-[var(--bd-fg)]" style={{ fontSize: big }}>
                    {shareFmt.format(shareOf(active))}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-[var(--bd-muted)]">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: colors[active] }} />
                    {data[active].label}
                  </span>
                  <span className="mt-0.5 text-xs font-medium tabular-nums text-[var(--bd-fg)]">{fmt.format(data[active].value)}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Every part with its value and share. Pointing at a row lights its segment; pressing it turns the part off or on. */}
        {side && hasData && !loading && (
          <div role="group" aria-label="Parts" className={cx("grid min-w-0 gap-0.5", side === "right" ? "flex-1" : "w-full max-w-[360px]")} onPointerLeave={() => !byKeys && setActive(null)}>
            {data.map((d, i) => {
              const off = hidden.includes(i);
              return (
                <button
                  key={d.label}
                  type="button"
                  aria-pressed={!off}
                  onClick={() => toggle(i)}
                  onPointerEnter={() => !off && (setActive(i), setByKeys(false))}
                  onFocus={() => !off && setActive(i)}
                  onBlur={() => setActive(null)}
                  className={cx(
                    "relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm transition-[background-color,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.99]",
                    active === i ? "bg-[color-mix(in_oklab,var(--bd-ui-track)_55%,var(--bd-surface))]" : "hover:bg-[color-mix(in_oklab,var(--bd-ui-track)_55%,var(--bd-surface))]",
                  )}
                >
                  <span className="size-2.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-200" style={{ background: off ? "transparent" : colors[i], boxShadow: off ? `inset 0 0 0 1.5px ${colors[i]}` : undefined }} />
                  <span className={cx("min-w-0 flex-1 truncate text-[var(--bd-fg)] transition-opacity duration-200", off && "opacity-45")}>{d.label}</span>
                  <span className={cx("tabular-nums text-[var(--bd-muted)] transition-opacity duration-200", off && "opacity-45")}>{fmt.format(d.value)}</span>
                  <span className={cx("w-12 text-right text-xs font-medium tabular-nums text-[var(--bd-fg)] transition-opacity duration-200", off && "opacity-0")}>{shareFmt.format(shareOf(i))}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      {dataTable && data.length > 0 && (
        <table className="sr-only">
          <caption>{title ?? "Donut chart"}</caption>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Value</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{fmt.format(d.value)}</td>
                <td>{shareFmt.format(shareOf(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
