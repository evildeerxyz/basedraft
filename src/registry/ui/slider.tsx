"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

/*
 * A value along a track: ink fills it up to a bead you drag, a small ink bubble over the bead says
 * the value while you hold or focus it, and marks under the track show the stops that matter. A
 * real range input sits over it all, so dragging, the arrow keys and screen readers work as usual.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const THUMB = 22;

export type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Its name, shown above it with the value. */
  label?: string;
  /** How a value reads: "96 px", "40%". */
  format?: (value: number) => string;
  /** Values to mark under the track, each with its number. */
  ticks?: number[];
  disabled?: boolean;
  className?: string;
};

export function Slider({ min = 0, max = 100, step = 1, value, defaultValue, onValueChange, label, format = String, ticks, disabled, className }: SliderProps) {
  const [inner, setInner] = useState(defaultValue ?? min);
  const [held, setHeld] = useState(false);
  const [focused, setFocused] = useState(false);
  const id = useId();
  const v = value ?? inner;
  const share = (v - min) / (max - min);
  // The bead's center runs from half a bead in at either end, so it never leaves the track.
  const at = (s: number) => `calc(${s * 100}% + ${(0.5 - s) * THUMB}px)`;
  return (
    <div className={cx("w-full", disabled && "opacity-45", className)}>
      {label && (
        <div className="mb-3 flex items-baseline justify-between gap-4 text-sm">
          <label htmlFor={id} className="font-medium text-[var(--bd-fg)]">
            {label}
          </label>
          <span className="tabular-nums text-[var(--bd-muted)]">{format(v)}</span>
        </div>
      )}
      <div className="relative h-7">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          disabled={disabled}
          aria-valuetext={format(v)}
          onChange={(e) => {
            const n = Number(e.target.value);
            setInner(n);
            onValueChange?.(n);
          }}
          onPointerDown={() => setHeld(true)}
          onPointerUp={() => setHeld(false)}
          // The bubble stays up for the keyboard; for a pointer it shows only while held.
          onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
          onBlur={() => {
            setFocused(false);
            setHeld(false);
          }}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--bd-surface-2)] shadow-[var(--bd-ui-well)]" />
        <span className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full [background:var(--bd-ui-ink)]" style={{ width: at(share) }} />
        <span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full [background:var(--bd-ui-bead)] shadow-[0_1px_1px_rgb(var(--bd-shade)/0.2),0_3px_8px_-2px_rgb(var(--bd-shade)/0.3),inset_0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-[scale] duration-200 peer-active:scale-110 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--bd-ui-focus)]"
          style={{ left: at(share), width: THUMB, height: THUMB }}
        >
          <AnimatePresence>
            {(held || focused) && (
              <motion.span
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 600, damping: 32 }}
                className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-[8px] px-2 py-1 text-[11.5px] font-medium tabular-nums text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[var(--bd-shadow-float)]"
              >
                {format(v)}
                <span aria-hidden className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1 rotate-45 rounded-[1px] bg-[var(--bd-ui-ink-solid)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
      {ticks && ticks.length > 0 && (
        <div className="relative mt-1 h-6">
          {ticks.map((t) => {
            const s = (t - min) / (max - min);
            return (
              <span key={t} className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1" style={{ left: at(s) }}>
                <span className={cx("h-1.5 w-px rounded-full", t <= v ? "bg-[var(--bd-fg)]" : "bg-[var(--bd-line-strong)]")} />
                <span className="text-[10.5px] tabular-nums text-[var(--bd-subtle)]">{t}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
