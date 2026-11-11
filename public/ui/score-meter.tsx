"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/*
 * A score out of a hundred as a row of capsules: as many lit as the score reaches, the last one
 * filled only as far as it does, all in the tone of the band the score falls in (low, fair or
 * strong). They light one after another the first time the meter is seen, and slide to a new
 * score when it changes. The number sits beside them, with the band's word when you want it read.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = {
  sm: { cap: "h-3 w-[4px]", gap: "gap-[2px]", text: "text-[12.5px]" },
  md: { cap: "h-4 w-[5px]", gap: "gap-[3px]", text: "text-[13.5px]" },
  lg: { cap: "h-6 w-[7px]", gap: "gap-1", text: "text-[15px]" },
} as const;

const TONES = { low: "var(--bd-ui-stop)", fair: "var(--bd-ui-wait)", strong: "var(--bd-ui-ok)" } as const;
export type ScoreBand = keyof typeof TONES;

export type ScoreMeterProps = {
  /** The score, from 0 to max. */
  value: number;
  max?: number;
  /** How many capsules the meter is made of. */
  segments?: number;
  /** Where fair starts and where strong starts, as scores. */
  bands?: [number, number];
  /** What each band is called, low to strong. */
  words?: [string, string, string];
  /** Beside the capsules: the number, the number and its band's word, or nothing. */
  show?: "value" | "word" | "none";
  /** What's scored, for screen readers: "Fit score". */
  label?: string;
  size?: keyof typeof SIZES;
  className?: string;
};

/** The band a score falls in. */
export const bandOf = (value: number, bands: [number, number] = [40, 70]): ScoreBand => (value >= bands[1] ? "strong" : value >= bands[0] ? "fair" : "low");

export function ScoreMeter({ value, max = 100, segments = 10, bands = [40, 70], words = ["Low", "Fair", "Strong"], show = "value", label = "Score", size = "md", className }: ScoreMeterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const still = useReducedMotion();
  const v = Math.max(0, Math.min(max, value));
  const band = bandOf((v / max) * 100, bands);
  const word = words[band === "low" ? 0 : band === "fair" ? 1 : 2];
  // How many capsules the score fills, as a count with a part: 7.2 lights seven and a fifth of the eighth.
  const filled = (v / max) * segments;
  const s = SIZES[size];

  return (
    <span
      ref={ref}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(v)}
      aria-valuetext={`${Math.round(v)} of ${max}, ${word.toLowerCase()}`}
      className={cx("inline-flex items-center gap-2.5", className)}
    >
      <span aria-hidden className={cx("flex items-center", s.gap)}>
        {Array.from({ length: segments }, (_, i) => {
          const part = Math.max(0, Math.min(1, filled - i));
          return (
            <span key={i} className={cx("relative overflow-hidden rounded-full bg-[var(--bd-ui-track)]", s.cap)}>
              <motion.span
                className="absolute inset-0 origin-bottom rounded-full"
                style={{ background: TONES[band] }}
                initial={false}
                animate={{ scaleY: seen ? part : 0, opacity: seen && part > 0 ? 1 : 0 }}
                transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32, delay: seen ? i * 0.028 : 0 }}
              />
            </span>
          );
        })}
      </span>
      {show !== "none" && (
        <span className={cx("flex items-baseline gap-1.5 whitespace-nowrap leading-none", s.text)}>
          <span className="font-medium tabular-nums text-[var(--bd-fg)]">{Math.round(v)}</span>
          {show === "word" && <span className="text-[var(--bd-muted)]">{word}</span>}
        </span>
      )}
    </span>
  );
}
