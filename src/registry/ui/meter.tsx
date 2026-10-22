"use client";

import { useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/*
 * How far along something is, drawn in dots: ink dots up to the value, faint ones after it, and
 * between them an edge that dissolves through an ordered dither, the way a printed gradient does.
 * When the value changes, the edge springs to it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: where each dot falls in the edge between filled and empty. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export type MeterProps = {
  value: number;
  max?: number;
  /** What it measures, shown above it. */
  label?: string;
  /** The value as it reads, beside the label. A percent by default. */
  valueLabel?: string;
  /** How many dots across and down. */
  cols?: number;
  rows?: number;
  className?: string;
};

export function Meter({ value, max = 100, label, valueLabel, cols = 40, rows = 4, className }: MeterProps) {
  const target = Math.max(0, Math.min(1, value / max));
  const spring = useSpring(target, { stiffness: 90, damping: 22 });
  const [p, setP] = useState(target);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  useMotionValueEvent(spring, "change", setP);
  // How many columns the dithered edge spreads across.
  const spread = 7 / cols;
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueLabel} aria-label={label} className={cx("w-full", className)}>
      {(label || valueLabel) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="font-medium text-[var(--bd-fg)]">{label}</span>
          <span className="tabular-nums text-[var(--bd-muted)]">{valueLabel ?? `${Math.round(target * 100)}%`}</span>
        </div>
      )}
      <div aria-hidden className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = (c + 0.5) / cols;
          const threshold = (BAYER[(r % 4) * 4 + (c % 4)] + 0.5) / 16;
          // Filled well behind the value, empty well past it, and dithered across the edge between.
          const on = x + (threshold - 0.5) * spread < p * (1 + spread) - spread / 2;
          return <span key={i} className={cx("aspect-square rounded-full transition-colors duration-150", on ? "bg-[var(--bd-ui-ink-solid)]" : "bg-[var(--bd-ui-track)]")} />;
        })}
      </div>
    </div>
  );
}
