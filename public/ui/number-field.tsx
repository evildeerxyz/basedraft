"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/*
 * A number in a pill pressed into the page, a raised − and + at its ends. Press one and it steps;
 * hold it and it keeps stepping, faster the longer you hold. Drag the label left or right to scrub
 * the value, the way a design tool does, with Shift for big steps. The arrows step it too, Shift
 * by ten, and the wheel does while it has focus. Each new value rolls in from the side it's
 * heading, and at its limit it nudges and goes no further. Click the number to type one.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SIZES = {
  sm: { pill: "h-9 p-[3px] gap-1 text-[13px]", button: "size-[30px]", icon: 12, label: "text-[12px]" },
  md: { pill: "h-11 p-1 gap-1.5 text-sm", button: "size-9", icon: 14, label: "text-[13px]" },
} as const;
/* How far the pointer moves for one step while scrubbing. */
const PX_PER_STEP = 6;

export type NumberFieldProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** How much one press, one arrow or one scrub step moves it. */
  step?: number;
  /** How much Shift with an arrow, Page Up and Page Down, or Shift while scrubbing moves it. Ten steps unless set. */
  bigStep?: number;
  /** How the number reads: Intl.NumberFormat options, for currency, percent, units and decimals. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** A word before the number; drag it to scrub the value. Also names it for screen readers. */
  label?: string;
  /** A quiet word after the number: seats, px, sections. */
  unit?: string;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  /** With a name, a hidden input carries the number in a form. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
};

const decimalsOf = (n: number) => (Number.isInteger(n) ? 0 : (String(n).split(".")[1] ?? "").length);

export function NumberField({ value, defaultValue = 0, onValueChange, min = -Infinity, max = Infinity, step = 1, bigStep, format, locale = "en-US", label, unit, size = "md", disabled, name, id, className, ...aria }: NumberFieldProps) {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  // While someone types, the field shows what they typed; otherwise it shows the number, formatted.
  const [typed, setTyped] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  // Which way the last change went, so the new number rolls in from that side.
  const [dir, setDir] = useState(1);
  const nudge = useAnimationControls();
  const s = SIZES[size];
  const big = bigStep ?? step * 10;
  const places = Math.max(decimalsOf(step), decimalsOf(big));
  const fmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: Math.max(places, format?.maximumFractionDigits ?? 0), ...format }), [locale, places, format]);
  const shown = fmt.format(current);
  const latest = useRef(current);
  const input = useRef<HTMLInputElement>(null);
  const repeat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ x: number; v: number; moved: boolean } | null>(null);
  const wheel = useRef(0);

  useEffect(() => {
    latest.current = current;
  }, [current]);

  const clamp = (n: number) => Math.min(max, Math.max(min, Number(n.toFixed(places))));

  // Sets a new value; one that would cross a limit stops at it, and a press past it nudges instead.
  const set = (next: number, push?: number) => {
    const v = clamp(next);
    if (v === latest.current) {
      if (push && !reduced) void nudge.start({ x: [0, push * 4, 0], transition: { duration: 0.24, ease: "easeOut" } });
      return;
    }
    setDir(v > latest.current ? 1 : -1);
    latest.current = v;
    setInner(v);
    onValueChange?.(v);
  };
  const by = (amount: number) => set(latest.current + amount, Math.sign(amount));

  // A held button steps at once, waits, then steps faster and faster until it's let go.
  const hold = (amount: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    input.current?.focus({ preventScroll: true });
    setTyped(null);
    by(amount);
    let wait = 340;
    const tick = () => {
      const was = latest.current;
      by(amount);
      // At a limit it nudges once and stops, rather than shaking for as long as it's held.
      if (latest.current === was) return;
      wait = Math.max(32, wait * 0.8);
      repeat.current = setTimeout(tick, wait);
    };
    repeat.current = setTimeout(tick, 420);
  };
  const letGo = () => clearTimeout(repeat.current);
  useEffect(() => () => clearTimeout(repeat.current), []);

  // The wheel steps it only while it has focus, so a page scrolling past it doesn't change it.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== el || disabled) return;
      e.preventDefault();
      wheel.current += e.deltaY;
      if (Math.abs(wheel.current) < 24) return;
      setTyped(null);
      by((wheel.current < 0 ? 1 : -1) * (e.shiftKey ? big : step));
      wheel.current = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // A typed number is read as it's shown (50 is 50% when it reads as a percent) and kept to the step.
  const commit = () => {
    if (typed === null) return;
    const n = parseFloat(typed.replace(/[^\d.-]/g, "")) / (format?.style === "percent" ? 100 : 1);
    const base = Number.isFinite(min) ? min : 0;
    setTyped(null);
    if (Number.isFinite(n)) set(base + Math.round((n - base) / step) * step);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // The first digit typed starts a new number in place of the one shown, wherever the caret was.
    if (typed === null && e.key.length === 1 && /[\d.,-]/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      setTyped(e.key);
      return;
    }
    const amount = e.shiftKey ? big : step;
    const keys: Record<string, () => void> = {
      ArrowUp: () => by(amount),
      ArrowDown: () => by(-amount),
      PageUp: () => by(big),
      PageDown: () => by(-big),
      Home: () => Number.isFinite(min) && set(min),
      End: () => Number.isFinite(max) && set(max),
    };
    if (keys[e.key] && (typed === null || e.key.startsWith("Arrow") || e.key.startsWith("Page"))) {
      e.preventDefault();
      if (typed !== null) commit();
      keys[e.key]();
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape" && typed !== null) {
      e.preventDefault();
      setTyped(null);
    }
  };

  // Dragging the label scrubs: every few pixels is a step, Shift makes them big ones. A press without a drag puts you in the number instead.
  const scrubStart = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // The field it's scrubbing takes focus, so it's rimmed while it changes and the keys carry on from it.
    input.current?.focus({ preventScroll: true });
    drag.current = { x: e.clientX, v: latest.current, moved: false };
    setTyped(null);
  };
  const scrubMove = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 3) return;
    if (!d.moved) {
      d.moved = true;
      setScrubbing(true);
    }
    const n = d.v + Math.round(dx / PX_PER_STEP) * (e.shiftKey ? big : step);
    const v = clamp(n);
    if (v !== latest.current) set(v);
  };
  const scrubEnd = () => {
    const d = drag.current;
    drag.current = null;
    setScrubbing(false);
    if (d && !d.moved) {
      input.current?.focus();
      input.current?.select();
    }
  };

  const atMin = current <= min;
  const atMax = current >= max;
  const button = (amount: number, off: boolean, word: string) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={word}
      disabled={disabled || off}
      onPointerDown={hold(amount)}
      onPointerUp={letGo}
      onPointerCancel={letGo}
      onLostPointerCapture={letGo}
      onContextMenu={(e) => e.preventDefault()}
      className={cx(
        "grid shrink-0 touch-none select-none place-items-center rounded-full text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]",
        "transition-[scale,opacity,box-shadow] duration-100 ease-out active:scale-[0.92] active:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.14),inset_0_0_0_1px_rgb(var(--bd-ink)/0.08)] disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100",
        s.button,
      )}
    >
      {amount < 0 ? <MinusIcon size={s.icon} weight="regular" /> : <PlusIcon size={s.icon} weight="regular" />}
    </button>
  );

  const invalid = aria["aria-invalid"] === true || aria["aria-invalid"] === "true";
  const text = typed ?? shown;
  // As wide as the widest number it can show, so the pill holds still as it counts past 9 or 99.
  const widest = Math.max(text.length, ...[min, max].filter(Number.isFinite).map((n) => fmt.format(n).length));

  return (
    <div
      className={cx(
        "inline-flex w-fit items-center rounded-full bg-[var(--bd-ui-field)] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
        "focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
        invalid && "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
        disabled && "opacity-50",
        s.pill,
        className,
      )}
    >
      {button(-step, atMin, `Less, by ${fmt.format(step)}`)}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1.5">
        {label && (
          <span
            aria-hidden
            onPointerDown={scrubStart}
            onPointerMove={scrubMove}
            onPointerUp={scrubEnd}
            onPointerCancel={scrubEnd}
            title="Drag to change"
            className={cx("shrink-0 cursor-ew-resize touch-none select-none text-[var(--bd-muted)] transition-colors duration-150 hover:text-[var(--bd-fg)]", scrubbing && "text-[var(--bd-fg)]", s.label)}
          >
            {label}
          </span>
        )}
        <motion.span animate={nudge} className="relative inline-grid place-items-center overflow-hidden">
          <input
            ref={input}
            id={id}
            role="spinbutton"
            inputMode="decimal"
            aria-label={label}
            aria-labelledby={aria["aria-labelledby"]}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={invalid || undefined}
            aria-valuenow={current}
            aria-valuemin={Number.isFinite(min) ? min : undefined}
            aria-valuemax={Number.isFinite(max) ? max : undefined}
            aria-valuetext={`${shown}${unit ? ` ${unit}` : ""}`}
            disabled={disabled}
            value={text}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setTyped(e.target.value)}
            onPaste={(e) => {
              if (typed !== null) return;
              e.preventDefault();
              setTyped(e.clipboardData.getData("text").trim());
            }}
            onKeyDown={onKey}
            onBlur={commit}
            style={{ width: `${Math.max(2, widest) + 0.6}ch` }}
            className={cx("col-start-1 row-start-1 bg-transparent text-center font-medium tabular-nums outline-none", typed === null && "text-transparent caret-transparent selection:bg-[rgb(var(--bd-ink)/0.12)] selection:text-[var(--bd-fg)]")}
          />
          {/* The number as it reads, rolling in from the side it moved toward; the field under it takes the clicks. */}
          {typed === null && (
            <span aria-hidden className="pointer-events-none col-start-1 row-start-1 grid place-items-center font-medium tabular-nums">
              <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                <motion.span
                  key={shown}
                  custom={dir}
                  variants={{ enter: (d: number) => ({ y: reduced ? 0 : d > 0 ? "70%" : "-70%", opacity: 0 }), at: { y: 0, opacity: 1 }, leave: (d: number) => ({ y: reduced ? 0 : d > 0 ? "-70%" : "70%", opacity: 0 }) }}
                  initial="enter"
                  animate="at"
                  exit="leave"
                  transition={reduced ? { duration: 0 } : SNAPPY}
                  className="col-start-1 row-start-1"
                >
                  {shown}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </motion.span>
        {unit && <span className={cx("shrink-0 text-[var(--bd-subtle)]", s.label)}>{unit}</span>}
      </div>
      {button(step, atMax, `More, by ${fmt.format(step)}`)}
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
    </div>
  );
}
