"use client";

import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState, type ComponentProps } from "react";

/*
 * A reading against its limit, as a dial of dots: the Meter bent round. The dots fill to the
 * value in ink, or in the tone of the zone each one sits in, and the edge between full and empty
 * dissolves through an ordered dither, or cuts clean without it. When the value moves, the edge
 * springs to it and the number at the center counts along.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: where each dot falls in the edge between full and empty. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const TONES = { ok: "var(--bd-ui-ok)", warn: "var(--bd-ui-wait)", stop: "var(--bd-ui-stop)" } as const;

/** From `from` up (to the next zone), the dots take this tone. */
export type GaugeZone = { from: number; tone: keyof typeof TONES };

export type GaugeProps = Omit<ComponentProps<"div">, "children"> & {
  value: number;
  min?: number;
  max?: number;
  /** What it measures, under the number, and its name for screen readers. */
  label?: string;
  /** The number as it reads. Rounded by default. */
  format?: (value: number) => string;
  /** Small, after the number: %, ms, GB. */
  unit?: string;
  /** Tones along the dial, by value: the dots in each take its tone. Ink when there are none. */
  zones?: GaugeZone[];
  /** How wide it is, in pixels. */
  size?: number;
  /** How many dots round the dial, and how many deep. */
  ticks?: number;
  rings?: number;
  /** The edge between full and empty dissolves through an ordered dither; off, it's a clean cut. */
  dither?: boolean;
};

/* The dial: 240 degrees, open at the bottom, in a 200 wide box. */
const SWEEP = 240;
const W = 200;
const H = 164;
const CX = 100;
const CY = 100;

export function Gauge({ value, min = 0, max = 100, label, format = (v) => String(Math.round(v)), unit, zones, size = 220, ticks = 42, rings = 4, dither = true, className, ...props }: GaugeProps) {
  const span = max - min || 1;
  const target = Math.max(0, Math.min(1, (value - min) / span));
  const still = useReducedMotion();
  const spring = useSpring(target, { stiffness: 90, damping: 22 });
  const [p, setP] = useState(target);
  useEffect(() => {
    if (still) spring.jump(target);
    else spring.set(target);
  }, [spring, target, still]);
  useMotionValueEvent(spring, "change", setP);
  const sorted = zones ? [...zones].sort((a, b) => a.from - b.from) : [];
  const toneAt = (v: number) => {
    let tone: string | undefined;
    for (const z of sorted) if (v >= z.from) tone = TONES[z.tone];
    return tone;
  };
  // How many dots across the dithered edge spreads.
  const spread = dither ? 6 / ticks : 0;
  const outer = 92;
  const gap = 7.2;
  const dot = 2.35;
  const dots = [];
  for (let k = 0; k < rings; k++) {
    const r = outer - k * gap;
    for (let t = 0; t < ticks; t++) {
      const x = (t + 0.5) / ticks;
      const a = ((-SWEEP / 2 + x * SWEEP) * Math.PI) / 180;
      const threshold = (BAYER[(k % 4) * 4 + (t % 4)] + 0.5) / 16;
      const on = x + (threshold - 0.5) * spread < p * (1 + spread) - spread / 2;
      const tone = toneAt(min + x * span);
      dots.push(<circle key={`${k}-${t}`} cx={(CX + Math.sin(a) * r).toFixed(2)} cy={(CY - Math.cos(a) * r).toFixed(2)} r={dot} fill={on ? (tone ?? "var(--bd-ui-ink-solid)") : "var(--bd-ui-track)"} />);
    }
  }
  const shown = min + p * span;
  return (
    <div
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${format(value)}${unit ? ` ${unit}` : ""}`}
      aria-label={label}
      className={cx("relative shrink-0", className)}
      style={{ width: size, aspectRatio: `${W} / ${H}` }}
      {...props}
    >
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible">
        {dots}
      </svg>
      <div aria-hidden className="absolute inset-x-0 grid justify-items-center" style={{ top: `${((CY - 26) / H) * 100}%` }}>
        <span className="flex items-baseline gap-0.5 font-medium leading-none tracking-[-0.03em] text-[var(--bd-fg)] tabular-nums" style={{ fontSize: size * 0.17 }}>
          {format(shown)}
          {unit && <span className="text-[0.42em] font-normal tracking-normal text-[var(--bd-muted)]">{unit}</span>}
        </span>
        {label && (
          <span className="mt-1.5 max-w-[60%] truncate text-center text-[var(--bd-muted)]" style={{ fontSize: Math.max(11, size * 0.058) }}>
            {label}
          </span>
        )}
      </div>
      {/* The ends' values, each centered under its end of the dial. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 tabular-nums leading-none text-[var(--bd-subtle)]" style={{ fontSize: Math.max(10, size * 0.05) }}>
        <span className="absolute bottom-0 left-[15%] -translate-x-1/2">{format(min)}</span>
        <span className="absolute bottom-0 right-[15%] translate-x-1/2">{format(max)}</span>
      </div>
    </div>
  );
}
