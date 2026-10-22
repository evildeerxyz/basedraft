"use client";

import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

/*
 * Days, chosen from a month that slides in from the side you're heading. Calendar is the month
 * on its own: the arrows walk the days, Page Up and Page Down turn the month, today wears a small
 * dot, and the chosen day sits on an ink circle that glides to the next one you choose. In range
 * mode the first press sets the start, and a band follows the pointer to show the range before
 * the second press ends it. DatePicker is a field that opens the month in a card over the page,
 * with Today and Clear at its foot.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
/* Today, known only in the browser: null on the server and while hydrating, so a page rendered ahead of time never keeps the day it was made on. */
const todayStamp = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const useToday = () => {
  const t = useSyncExternalStore(noop, todayStamp, () => null);
  return useMemo(() => (t === null ? null : new Date(t)), [t]);
};

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const GAP = 6;

export type DateRange = { from: Date; to: Date };

/* Days without hours, so comparing two of them is comparing dates. */
const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
};
const monthOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const order = (a: Date, b: Date): [Date, Date] => (a <= b ? [a, b] : [b, a]);
/* The first day from d on that can be chosen, within a year; d itself if none can. */
const firstOpen = (d: Date, off: (d: Date) => boolean) => Array.from({ length: 366 }, (_, i) => addDays(d, i)).find((n) => !off(n)) ?? d;

type Base = {
  /** The earliest day that can be chosen. */
  min?: Date;
  /** The latest day that can be chosen. */
  max?: Date;
  /** Days that can't be chosen, besides those outside min and max: weekends, booked days. */
  isDisabled?: (day: Date) => boolean;
  /** 0 starts the week on Sunday, 1 on Monday. */
  weekStartsOn?: 0 | 1;
  locale?: string;
};
type Single = { mode?: "single"; value?: Date | null; defaultValue?: Date | null; onValueChange?: (day: Date | null) => void };
type Range = { mode: "range"; value?: DateRange | null; defaultValue?: DateRange | null; onValueChange?: (range: DateRange | null) => void };

export type CalendarProps = Base &
  (Single | Range) & {
    /** The month it opens on; the chosen day's month, or this month, unless set. */
    defaultMonth?: Date;
    /** Puts focus on the chosen day (or today) as it appears. */
    autoFocus?: boolean;
    /** Called after a choice is complete: a day, or a range's end. DatePicker closes on it. */
    onDone?: () => void;
    /** In range mode, called with the range so far while it's being chosen (the start, to the day pointed at), and with null once it's complete. */
    onPending?: (range: DateRange | null) => void;
    className?: string;
  };

export function Calendar(props: CalendarProps) {
  const today = useToday();
  // Where it opens: the chosen day, the month asked for, or today. Until the browser says what day
  // it is, a calendar with none of them holds its place.
  const chosen = props.mode === "range" ? (props.value ?? props.defaultValue)?.from : (props.value ?? props.defaultValue);
  if (!chosen && !props.defaultMonth && !today) return <div aria-hidden className={cx("h-[306px] w-[280px]", props.className)} />;
  return <Month {...props} today={today} />;
}

function Month(props: CalendarProps & { today: Date | null }) {
  const { min, max, isDisabled, weekStartsOn = 0, locale = "en-US", defaultMonth, autoFocus, onDone, onPending, className, today } = props;
  const range = props.mode === "range";
  const reduced = useReducedMotion();
  const auto = useId();

  const [innerDay, setInnerDay] = useState<Date | null>(range ? null : ((props as Single).defaultValue ?? null));
  const [innerRange, setInnerRange] = useState<DateRange | null>(range ? ((props as Range).defaultValue ?? null) : null);
  const day = range ? null : (props as Single).value !== undefined ? ((props as Single).value ?? null) : innerDay;
  const span = range ? ((props as Range).value !== undefined ? ((props as Range).value ?? null) : innerRange) : null;
  // In range mode, the start chosen so far, waiting for an end; the hovered day previews the band.
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const pend = (a: Date | null, h: Date | null) => {
    setAnchor(a);
    setHover(h);
    const r = a ? order(a, h ?? a) : null;
    onPending?.(r ? { from: r[0], to: r[1] } : null);
  };

  const off = (d: Date) => !!(min && d < dayOf(min)) || !!(max && d > dayOf(max)) || !!isDisabled?.(d);
  // Focus starts on the chosen day, or today, or the first day after it that can be chosen.
  const [focused, setFocused] = useState(() => firstOpen(dayOf((day ?? span?.from ?? today ?? defaultMonth) as Date), off));
  const [month, setMonth] = useState(() => monthOf(defaultMonth ?? focused));
  const [dir, setDir] = useState(1);
  const grid = useRef<HTMLDivElement>(null);
  const byKeys = useRef(!!autoFocus);
  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const fmtDay = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), [locale]);
  const fmtWeekday = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);

  // Six weeks from the start of the week the month begins in, so the grid never changes height.
  const first = addDays(month, -((month.getDay() - weekStartsOn + 7) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const weekdays = days.slice(0, 7).map((d) => fmtWeekday.format(d).slice(0, 2));

  const turn = (to: Date) => {
    const next = monthOf(to);
    if (monthKey(next) === monthKey(month)) return;
    setDir(monthKey(next) > monthKey(month) ? 1 : -1);
    setMonth(next);
  };
  const go = (to: Date) => {
    setFocused(to);
    turn(to);
  };

  // Keyboard focus follows the focused day, once the keys are what's moving it. It's looked for in
  // the month coming in: the one sliding out may show the same day among its spare ones.
  useEffect(() => {
    if (!byKeys.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-month="${monthKey(month)}"] [data-day="${iso(focused)}"]`)?.focus({ preventScroll: true });
  }, [focused, month]);

  const choose = (d: Date) => {
    if (off(d)) return;
    setFocused(d);
    turn(d);
    if (!range) {
      setInnerDay(d);
      (props as Single).onValueChange?.(d);
      onDone?.();
      return;
    }
    if (!anchor) {
      pend(d, null);
      return;
    }
    const [from, to] = order(anchor, d);
    pend(null, null);
    setInnerRange({ from, to });
    (props as Range).onValueChange?.({ from, to });
    onDone?.();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1),
      Home: () => addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() - weekStartsOn + 7) % 7)),
    };
    if (moves[e.key]) {
      e.preventDefault();
      byKeys.current = true;
      const to = moves[e.key]();
      go(to);
      if (anchor) pend(anchor, to);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(focused);
    }
  };

  // What the band covers: the chosen range, or while choosing, the start to the hovered day.
  const band: [Date, Date] | null = anchor ? (hover ? order(anchor, hover) : [anchor, anchor]) : span ? [span.from, span.to] : null;
  const inBand = (d: Date) => !!band && d >= band[0] && d <= band[1];
  const ends = (d: Date) => !!band && (same(d, band[0]) || same(d, band[1]));
  const spring = reduced ? { duration: 0 } : SNAPPY;
  const canBack = !min || monthKey(addMonths(month, -1)) >= monthKey(monthOf(min));
  const canOn = !max || monthKey(addMonths(month, 1)) <= monthKey(monthOf(max));

  const nav = (by: -1 | 1, ok: boolean) => (
    <button
      type="button"
      disabled={!ok}
      aria-label={by < 0 ? "Previous month" : "Next month"}
      onClick={() => {
        byKeys.current = false;
        setDir(by);
        setMonth(addMonths(month, by));
        setFocused(addMonths(focused, by));
      }}
      className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
    >
      {by < 0 ? <CaretLeftIcon size={14} weight="regular" /> : <CaretRightIcon size={14} weight="regular" />}
    </button>
  );

  return (
    <div className={cx("w-[280px] select-none text-[var(--bd-fg)]", className)}>
      <div className="flex items-center justify-between gap-2 pb-2 pl-2">
        <div className="relative h-6 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.p
              key={monthKey(month)}
              id={`${auto}-month`}
              aria-live="polite"
              custom={dir}
              variants={{ enter: (d: number) => ({ y: reduced ? 0 : `${d * 100}%`, opacity: 0 }), at: { y: 0, opacity: 1 }, leave: (d: number) => ({ y: reduced ? 0 : `${d * -100}%`, opacity: 0 }) }}
              initial="enter"
              animate="at"
              exit="leave"
              transition={reduced ? { duration: 0 } : SOFT}
              className="text-sm font-semibold"
            >
              {fmtMonth.format(month)}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0">
          {nav(-1, canBack)}
          {nav(1, canOn)}
        </div>
      </div>
      <div role="grid" aria-labelledby={`${auto}-month`} onKeyDown={onKey}>
        <div role="row" className="grid grid-cols-7 pb-1">
          {weekdays.map((w, i) => (
            <span key={i} role="columnheader" aria-label={fmtWeekday.format(days[i])} className="grid h-7 place-items-center text-[11px] font-medium text-[var(--bd-subtle)]">
              {w}
            </span>
          ))}
        </div>
        <div ref={grid} className="relative h-[234px] overflow-hidden" onPointerLeave={() => anchor && pend(anchor, null)}>
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.div
              key={monthKey(month)}
              data-month={monthKey(month)}
              custom={dir}
              variants={{ enter: (d: number) => ({ x: reduced ? 0 : `${d * 100}%`, opacity: reduced ? 0 : 0.4 }), at: { x: 0, opacity: 1 }, leave: (d: number) => ({ x: reduced ? 0 : `${d * -100}%`, opacity: reduced ? 0 : 0.4 }) }}
              initial="enter"
              animate="at"
              exit="leave"
              transition={reduced ? { duration: 0.12 } : SOFT}
              className="grid grid-cols-7 gap-y-0.5"
            >
              {days.map((d, i) => {
                const inMonth = d.getMonth() === month.getMonth();
                const chosen = range ? ends(d) && !anchor && !!span : same(d, day);
                const startOrEnd = ends(d);
                const banded = inBand(d);
                const col = i % 7;
                const disabled = off(d);
                return (
                  <div key={iso(d)} role="gridcell" aria-selected={chosen || banded || undefined} className="relative grid h-[38px] place-items-center">
                    {banded && band && !same(band[0], band[1]) && (
                      <span
                        aria-hidden
                        className={cx(
                          "absolute inset-y-[3px] bg-[var(--bd-ui-track)] transition-opacity duration-150",
                          anchor && "opacity-70",
                          same(d, band[0]) || col === 0 ? "left-[5px] rounded-l-full" : "left-0",
                          same(d, band[1]) || col === 6 ? "right-[5px] rounded-r-full" : "right-0",
                        )}
                      />
                    )}
                    {(range ? startOrEnd && (!!anchor || !!span) : chosen) && <motion.span layoutId={range ? undefined : `${auto}-chosen`} aria-hidden className="absolute size-[32px] rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.22)] [background:var(--bd-ui-ink)]" transition={spring} />}
                    <button
                      type="button"
                      data-day={iso(d)}
                      tabIndex={same(d, focused) ? 0 : -1}
                      disabled={disabled}
                      aria-label={`${fmtDay.format(d)}${same(d, today) ? ", today" : ""}`}
                      aria-pressed={chosen || undefined}
                      onClick={() => {
                        byKeys.current = false;
                        choose(d);
                      }}
                      onPointerEnter={() => anchor && pend(anchor, d)}
                      onFocus={() => setFocused(d)}
                      className={cx(
                        "relative grid size-[32px] place-items-center rounded-full text-[13px] tabular-nums outline-none transition-[background-color,color,scale] duration-150 active:scale-90",
                        "focus-visible:shadow-[0_0_0_2px_var(--bd-surface),0_0_0_3.5px_var(--bd-ui-focus)]",
                        (range ? startOrEnd && (!!anchor || !!span) : chosen) ? "font-semibold text-[var(--bd-ui-ink-text)]" : banded ? "text-[var(--bd-fg)]" : inMonth ? "text-[var(--bd-fg)] hover:bg-[rgb(var(--bd-ink)/0.06)]" : "text-[var(--bd-subtle)] opacity-60 hover:bg-[rgb(var(--bd-ink)/0.05)]",
                        same(d, today) && "font-semibold",
                        disabled && "cursor-not-allowed line-through opacity-30 hover:bg-transparent",
                      )}
                    >
                      {d.getDate()}
                      {same(d, today) && <span aria-hidden className="absolute bottom-[3px] size-[3px] rounded-full bg-current" />}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** How the chosen day reads in the field. */
  format?: Intl.DateTimeFormatOptions;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  /** Puts Clear in the field once something's chosen, and Today and Clear at the card's foot. */
  clearable?: boolean;
  /** With a name, a hidden input carries the day (2026-10-30) or the range (2026-10-03/2026-10-09) in a form. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
};

export type DatePickerProps = Base & (Single | Range) & FieldProps;

const SIZES = { sm: "h-9 pl-3.5 pr-2 text-[13px] [&_svg]:size-3.5", md: "h-11 pl-4 pr-2.5 text-sm [&_svg]:size-4" } as const;

export function DatePicker(props: DatePickerProps) {
  const { placeholder = "Pick a day", format, label, size = "md", disabled, clearable = true, name, id, className, min, max, isDisabled, weekStartsOn, locale = "en-US" } = props;
  const range = props.mode === "range";
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const auto = useId();
  const [innerDay, setInnerDay] = useState<Date | null>(range ? null : ((props as Single).defaultValue ?? null));
  const [innerRange, setInnerRange] = useState<DateRange | null>(range ? ((props as Range).defaultValue ?? null) : null);
  const day = range ? null : (props as Single).value !== undefined ? ((props as Single).value ?? null) : innerDay;
  const span = range ? ((props as Range).value !== undefined ? ((props as Range).value ?? null) : innerRange) : null;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateRange | null>(null);
  const [place, setPlace] = useState<{ style: CSSProperties; up: boolean; scope: { theme?: string; light?: boolean } } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, format ?? { month: "short", day: "numeric", year: "numeric" }), [locale, format]);
  const fmtShort = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }), [locale]);

  const setDay = (d: Date | null) => {
    setInnerDay(d);
    (props as Single).onValueChange?.(d);
  };
  const setRange = (r: DateRange | null) => {
    setInnerRange(r);
    (props as Range).onValueChange?.(r);
  };

  const text = range ? (span ? (span.from.getFullYear() === span.to.getFullYear() ? `${fmtShort.format(span.from)} to ${fmt.format(span.to)}` : `${fmt.format(span.from)} to ${fmt.format(span.to)}`) : "") : day ? fmt.format(day) : "";
  const count = (r: DateRange) => Math.round((dayOf(r.to).getTime() - dayOf(r.from).getTime()) / 86400000) + 1;
  const nights = pending ? count(pending) : span ? count(span) : 0;

  const measure = () => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tall = card.current?.offsetHeight ?? 380;
    const wide = card.current?.offsetWidth ?? 304;
    const up = innerHeight - r.bottom < tall + GAP + 8 && r.top > innerHeight - r.bottom;
    const scope = el.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    setPlace({
      up,
      style: { position: "fixed", left: Math.max(8, Math.min(r.left, innerWidth - wide - 8)), ...(up ? { bottom: innerHeight - r.top + GAP } : { top: r.bottom + GAP }) },
      scope: { theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) },
    });
  };

  const close = (refocus = true) => {
    setOpen(false);
    setPending(null);
    if (refocus) trigger.current?.focus();
  };

  useLayoutEffect(() => {
    if (open) measure();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!trigger.current?.contains(t) && !card.current?.contains(t)) close(false);
    };
    const follow = () => measure();
    document.addEventListener("pointerdown", away);
    addEventListener("scroll", follow, true);
    addEventListener("resize", follow);
    const frame = requestAnimationFrame(follow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", away);
      removeEventListener("scroll", follow, true);
      removeEventListener("resize", follow);
    };
  }, [open]);

  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const has = range ? !!span : !!day;
  const calendarProps = range ? { mode: "range" as const, value: span, onValueChange: setRange, onPending: setPending } : { mode: "single" as const, value: day, onValueChange: setDay };

  return (
    <>
      <span className={cx("relative flex w-full", className)}>
        <button
          ref={trigger}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${auto}-card` : undefined}
          aria-label={label ? `${label}${text ? `, ${text}` : ""}` : undefined}
          aria-labelledby={props["aria-labelledby"]}
          aria-describedby={props["aria-describedby"]}
          disabled={disabled}
          onClick={() => (open ? close() : setOpen(true))}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              setOpen(true);
            } else if (e.key === "Escape" && open) {
              e.preventDefault();
              close();
            }
          }}
          className={cx(
            "flex w-full items-center gap-2.5 rounded-full text-left text-[var(--bd-fg)] transition-[background-color,box-shadow,scale] duration-200 ease-[var(--bd-ease)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none",
            open
              ? "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]"
              : "bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)] hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-visible:bg-[var(--bd-surface)] focus-visible:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
            invalid && "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
            SIZES[size],
            clearable && has && "pr-10",
          )}
        >
          <CalendarBlankIcon weight="duotone" className="shrink-0 text-[var(--bd-muted)]" />
          <span className={cx("min-w-0 flex-1 truncate tabular-nums", !has && "text-[var(--bd-subtle)]")}>{text || placeholder}</span>
        </button>
        {clearable && has && !disabled && (
          <button
            type="button"
            aria-label="Clear the date"
            onClick={() => {
              if (range) setRange(null);
              else setDay(null);
              trigger.current?.focus();
            }}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[var(--bd-subtle)] transition-[background-color,color,scale] duration-150 hover:bg-[var(--bd-ui-track)] hover:text-[var(--bd-fg)] active:scale-90"
          >
            <XIcon size={12} weight="regular" />
          </button>
        )}
      </span>
      {name && <input type="hidden" name={name} value={range ? (span ? `${iso(span.from)}/${iso(span.to)}` : "") : day ? iso(day) : ""} disabled={disabled} />}
      {mounted &&
        place &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div data-theme={place.scope.theme} className={place.scope.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                <motion.div
                  ref={card}
                  id={`${auto}-card`}
                  role="dialog"
                  aria-modal="false"
                  aria-label={label ?? "Choose a date"}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      close();
                    }
                  }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: place.up ? 6 : -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reduced ? 0 : place.up ? 4 : -4, scale: reduced ? 1 : 0.98, transition: { duration: 0.12 } }}
                  transition={reduced ? { duration: 0.12 } : SOFT}
                  style={{ ...place.style, transformOrigin: place.up ? "bottom left" : "top left" }}
                  className="z-[1000] rounded-[20px] bg-[var(--bd-surface)] p-3 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
                >
                  <Calendar {...calendarProps} min={min} max={max} isDisabled={isDisabled} weekStartsOn={weekStartsOn} locale={locale} autoFocus onDone={() => close()} />
                  {(clearable || range) && (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--bd-line-subtle)] px-1 pt-2.5">
                      <span className="text-[12px] tabular-nums text-[var(--bd-subtle)]">{range ? (pending && same(pending.from, pending.to) ? "Now pick the last day" : pending || span ? `${nights} ${nights === 1 ? "day" : "days"}` : "Pick a start, then an end") : day ? fmt.format(day) : "No day yet"}</span>
                      <span className="flex gap-1">
                        {!range && (
                          <button
                            type="button"
                            disabled={!!isDisabled?.(dayOf(new Date())) || (!!min && dayOf(new Date()) < dayOf(min)) || (!!max && dayOf(new Date()) > dayOf(max))}
                            onClick={() => {
                              setDay(dayOf(new Date()));
                              close();
                            }}
                            className="h-7 rounded-full px-3 text-[12.5px] font-medium transition-[background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] active:scale-95 disabled:opacity-40"
                          >
                            Today
                          </button>
                        )}
                        {clearable && (
                          <button
                            type="button"
                            disabled={!has}
                            onClick={() => {
                              if (range) setRange(null);
                              else setDay(null);
                            }}
                            className="h-7 rounded-full px-3 text-[12.5px] font-medium text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] active:scale-95 disabled:opacity-40"
                          >
                            Clear
                          </button>
                        )}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
