"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ComponentProps } from "react";

/*
 * A number that rolls to its value, a digit at a time: each digit is a reel of 0 to 9 that springs
 * to its place, the ones on the right a beat before the ones on the left, the way an odometer
 * turns over. Commas, currency signs and letters stay put. It rolls up from zero the first time it
 * comes into view, then from wherever it was each time the value changes. A screen reader hears
 * the number itself, not the reels. It's called RollingNumber so it never hides JavaScript's Number.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type NumberFormat = "number" | "currency" | "compact" | "percent";

export type RollingNumberProps = Omit<ComponentProps<"span">, "children"> & {
  value: number;
  /** number: 1,240. currency: $1,240. compact: 1.2K. percent: 42%, from 0.42. */
  format?: NumberFormat;
  /** For currency, the ISO code. */
  currency?: string;
  /** Digits after the point, at most. */
  decimals?: number;
  locale?: string;
  /** Any other Intl.NumberFormat options; these win over format's own. */
  options?: Intl.NumberFormatOptions;
  /** Roll up from zero the first time it's seen. Off, it starts at its value. */
  rollIn?: boolean;
  /** Say each new value to screen readers as it changes, for numbers that update live. */
  live?: boolean;
};

const formatter = (format: NumberFormat, locale: string, currency: string, decimals: number | undefined, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(locale, {
    ...(format === "currency" && { style: "currency", currency, maximumFractionDigits: decimals ?? 0 }),
    ...(format === "compact" && { notation: "compact", maximumFractionDigits: decimals ?? 1 }),
    ...(format === "percent" && { style: "percent", maximumFractionDigits: decimals ?? 0 }),
    ...(format === "number" && { maximumFractionDigits: decimals ?? 0 }),
    ...options,
  });

/** One digit: a reel of 0 to 9 behind a one-digit window, springing to its place. */
function Reel({ digit, delay, still }: { digit: number; delay: number; still: boolean }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden">
      {/* Holds the window at a digit's width; the reel turns behind it. */}
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

export function RollingNumber({ value, format = "number", currency = "USD", decimals, locale = "en-US", options, rollIn = true, live = false, className, ...props }: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const fmt = formatter(format, locale, currency, decimals, options);
  const text = fmt.format(value);
  // Until it's been seen, every digit shows 0, so it can roll up from there.
  const shown = rollIn && !seen && !reduce ? text.replace(/\d/g, "0") : text;
  const chars = [...shown];
  return (
    <span ref={ref} className={cx("inline-flex items-baseline whitespace-nowrap leading-none tabular-nums", className)} {...props}>
      <span className="sr-only" aria-live={live ? "polite" : undefined}>
        {text}
      </span>
      <span aria-hidden className="inline-flex leading-none">
        {chars.map((ch, i) => {
          // Keyed from the right, so the ones stay the ones when the number grows a digit.
          const fromEnd = chars.length - i;
          return /\d/.test(ch) ? <Reel key={`d${fromEnd}`} digit={+ch} delay={fromEnd * 0.035} still={!!reduce} /> : <span key={`c${fromEnd}`}>{ch}</span>;
        })}
      </span>
    </span>
  );
}
