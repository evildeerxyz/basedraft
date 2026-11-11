"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/*
 * How many make it from one step to the next: visited, signed up, published, paid. Each step is a
 * bar as tall as the people who reached it, and over it, as tall as the ones lost since the step
 * before, a ghost of what it could have been, dissolving through an ordered dither, or held as a
 * faint wash without it. A band carries the flow from each bar to the next. The bars rise in one
 * after another, and pointing at a step, or reaching it with the arrow keys, says what it kept.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: the ghost's dots, thinning as they rise. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const fx = (n: number) => Math.round(n * 100) / 100;

export type FunnelStep = { label: string; value: number };

export type FunnelProps = {
  steps: FunnelStep[];
  /** What it shows, for a screen reader. */
  label: string;
  /** How tall the bars can stand, in pixels. */
  height?: number;
  /** The bars' color: any CSS color. */
  color?: string;
  /** The ones lost dissolve as dots over each bar; off, they're a faint wash. */
  dither?: boolean;
  /** The counts as they read. Grouped with commas by default. */
  format?: (value: number) => string;
  className?: string;
};

const number = new Intl.NumberFormat("en-US");
const pct = (v: number) => `${v >= 0.1 ? Math.round(v * 100) : Math.round(v * 1000) / 10}%`;

export function Funnel({ steps, label, height = 200, color = "var(--bd-ui-viz-1)", dither = true, format = (v) => number.format(v), className }: FunnelProps) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.3 });
  const still = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [byKeys, setByKeys] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = steps.length;
  const top = Math.max(1, steps[0]?.value ?? 1);
  const gap = Math.max(14, Math.min(44, w / (n * 3.2)));
  const bar = n ? (w - gap * (n - 1)) / n : 0;
  const x = (i: number) => i * (bar + gap);
  const y = (v: number) => height - (v / top) * height;
  const r = Math.min(6, bar / 6);

  // The ghost's fill: a column of cells, most lit at the bar and thinning to nothing up top.
  let ghost = "";
  const rows = Math.ceil(height / 3);
  for (let row = 0; row < rows; row++) {
    const lit = 0.75 * (row / rows) ** 1.4;
    for (let c = 0; c < 4; c++) if ((BAYER[(row % 4) * 4 + c] + 0.5) / 16 <= lit) ghost += `M${c * 3},${row * 3}h3v3h-3z`;
  }

  const move = (to: number) => {
    setByKeys(true);
    setActive(Math.max(0, Math.min(n - 1, to)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") move((active ?? -1) + 1);
    else if (e.key === "ArrowLeft") move((active ?? n) - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(n - 1);
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };
  const on = active != null ? steps[active] : null;
  const say = (i: number) => {
    const s = steps[i];
    const prev = steps[i - 1];
    return `${s.label}: ${format(s.value)}, ${pct(s.value / top)} of ${steps[0].label.toLowerCase()}${prev ? `, ${pct(s.value / prev.value)} of ${prev.label.toLowerCase()}` : ""}`;
  };
  const overall = n > 1 ? steps[n - 1].value / top : 1;

  return (
    <div className={cx("w-full", className)}>
      <div
        ref={box}
        tabIndex={n ? 0 : -1}
        role="group"
        aria-label={label}
        aria-roledescription="funnel"
        onKeyDown={onKey}
        onBlur={() => byKeys && setActive(null)}
        onPointerLeave={() => !byKeys && setActive(null)}
        className="relative w-full rounded-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bd-ui-focus)]"
      >
        {w > 0 && (
          <svg width={w} height={height} role="img" aria-label={`${label}: ${steps.map((s) => `${s.label} ${format(s.value)}`).join(", ")}. ${pct(overall)} made it through.`} className="block overflow-visible" style={{ color }}>
            <defs>
              <pattern id={`${uid}-ghost`} width={12} height={rows * 3} patternUnits="userSpaceOnUse" y={0}>
                <path d={ghost} fill="currentColor" />
              </pattern>
            </defs>
            {steps.map((s, i) => {
              const next = steps[i + 1];
              const prev = steps[i - 1];
              const lost = prev ? prev.value - s.value : 0;
              const dim = active != null && active !== i;
              return (
                <g key={s.label} onPointerEnter={() => (setByKeys(false), setActive(i))} style={{ opacity: dim ? 0.45 : 1, transition: "opacity 200ms" }}>
                  {/* The column, faint, as a place to point at. */}
                  <rect x={x(i)} y={0} width={bar} height={height} rx={r} className="fill-[var(--bd-ui-track)]" opacity={0.5} />
                  {/* The ones lost since the step before: a ghost over the bar. */}
                  {lost > 0 && (
                    <motion.rect
                      x={x(i)}
                      width={bar}
                      rx={r}
                      fill={dither ? `url(#${uid}-ghost)` : "currentColor"}
                      opacity={dither ? 0.85 : 0.14}
                      initial={false}
                      animate={{ y: seen || still ? y(prev!.value) : height, height: seen || still ? y(s.value) - y(prev!.value) : 0 }}
                      transition={still ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22, delay: i * 0.08 + 0.15 }}
                    />
                  )}
                  {/* The flow on to the next step. */}
                  {next && (
                    <motion.path
                      d={`M${fx(x(i) + bar)},${fx(y(s.value))}L${fx(x(i + 1))},${fx(y(next.value))}L${fx(x(i + 1))},${height}L${fx(x(i) + bar)},${height}Z`}
                      fill="currentColor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: seen || still ? 0.08 : 0 }}
                      transition={{ duration: 0.5, delay: still ? 0 : i * 0.08 + 0.35 }}
                    />
                  )}
                  <motion.rect
                    x={x(i)}
                    width={bar}
                    rx={r}
                    fill="currentColor"
                    initial={false}
                    animate={{ y: seen || still ? y(s.value) : height, height: seen || still ? height - y(s.value) : 0 }}
                    transition={still ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22, delay: i * 0.08 }}
                  />
                  {active === i && <rect x={x(i) - 3} y={-3} width={bar + 6} height={height + 6} rx={r + 3} fill="none" strokeWidth={1.5} className="pointer-events-none stroke-[var(--bd-fg)]" opacity={0.25} />}
                </g>
              );
            })}
          </svg>
        )}
        <AnimatePresence>
          {on && active != null && (
            <motion.div
              key="card"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14 }}
              className="pointer-events-none absolute top-2 z-10 w-[200px] rounded-[14px] bg-[var(--bd-surface)] p-3 text-xs shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
              style={{ left: Math.min(Math.max(x(active) + bar / 2, 100), Math.max(100, w - 100)), translate: "-50% 0" }}
            >
              <p className="font-medium text-[var(--bd-fg)]">{on.label}</p>
              <p className="mt-1 text-[18px] font-medium tabular-nums tracking-[-0.02em] text-[var(--bd-fg)]">{format(on.value)}</p>
              <dl className="mt-2 grid gap-1 border-t border-[var(--bd-line-subtle)] pt-2 text-[var(--bd-muted)]">
                <div className="flex justify-between gap-3">
                  <dt>Of {steps[0].label.toLowerCase()}</dt>
                  <dd className="tabular-nums text-[var(--bd-fg)]">{pct(on.value / top)}</dd>
                </div>
                {active > 0 && (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt>Kept from {steps[active - 1].label.toLowerCase()}</dt>
                      <dd className="tabular-nums text-[var(--bd-fg)]">{pct(on.value / steps[active - 1].value)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Lost</dt>
                      <dd className="tabular-nums text-[var(--bd-fg)]">{format(steps[active - 1].value - on.value)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Under each bar: its name, its count, and what it kept from the step before. */}
      <div aria-hidden className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: gap }}>
        {steps.map((s, i) => (
          <div key={s.label} className={cx("min-w-0 transition-opacity duration-200", active != null && active !== i && "opacity-45")}>
            <p className="truncate text-[12.5px] text-[var(--bd-muted)]">{s.label}</p>
            <p className="text-[15px] font-medium tabular-nums tracking-[-0.01em] text-[var(--bd-fg)]">{format(s.value)}</p>
            <p className="text-[11.5px] tabular-nums text-[var(--bd-subtle)]">{i === 0 ? "100%" : `${pct(s.value / steps[i - 1].value)} kept`}</p>
          </div>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {active != null && byKeys ? say(active) : ""}
      </span>
    </div>
  );
}
