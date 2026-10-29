"use client";

import { CaretDownIcon, CheckIcon, ClockIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

/*
 * A time, typed or picked. Type it the way you'd say it, "930", "9:30p", "21:30", "noon", and it
 * reads it when you press Enter or move on; or open the list of times in steps, already scrolled to
 * the one you have. Given a start time, each time in the list says how long after it is, so an end
 * time reads "10:30 AM, 1 hr". 12 or 24 hours, and a min and max for hours that are open.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

const DAY = 24 * 60;
/** "HH:mm" to minutes after midnight. */
const toMin = (v?: string | null) => {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  return m ? Math.min(DAY - 1, Number(m[1]) * 60 + Number(m[2])) : null;
};
/** Minutes after midnight to "HH:mm". */
const toValue = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** Minutes as the time reads: "9:30 AM", or "09:30". */
const show = (m: number, cycle: 12 | 24) => {
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  if (cycle === 24) return `${String(h).padStart(2, "0")}:${mm}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? "AM" : "PM"}`;
};
/** How long after the start: "30 min", "1 hr", "1.5 hrs". */
const span = (d: number) => (d < 60 ? `${d} min` : `${Math.round((d / 60) * 100) / 100} ${d === 60 ? "hr" : "hrs"}`);

/** A time the way people type it, to minutes after midnight, or null. */
export function parseTime(input: string): number | null {
  const t = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  if (t === "noon") return 12 * 60;
  if (t === "midnight") return 0;
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?(a|am|p|pm)?$/.exec(t) ?? /^(\d{1,2})(\d{2})(a|am|p|pm)?$/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (min > 59) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    if (m[3].startsWith("p") && h !== 12) h += 12;
    if (m[3].startsWith("a") && h === 12) h = 0;
  } else if (h > 23) return null;
  return h * 60 + min;
}

export type TimePickerProps = {
  /** "HH:mm", 24-hour. Leave it out and the picker keeps it, starting from defaultValue. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Minutes between the times in the list. */
  step?: number;
  /** 12 hours with AM and PM, or 24. */
  hourCycle?: 12 | 24;
  /** The earliest and latest times, "HH:mm". */
  min?: string;
  max?: string;
  /** A start time, "HH:mm": the list begins after it and says how long after it each time is. */
  from?: string | null;
  placeholder?: string;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
};

export function TimePicker({ value, defaultValue = null, onValueChange, step = 30, hourCycle = 12, min, max, from, placeholder = "Pick a time", label, name, id, disabled, className, ...aria }: TimePickerProps) {
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const cur = toMin(current);
  const [text, setText] = useState(cur == null ? "" : show(cur, hourCycle));
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [place, setPlace] = useState<{ left: number; top: number; bottom: number; width: number; up: boolean; scope: Scope } | null>(null);
  const shell = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useMounted();
  const auto = useId();
  const field = id ?? auto;
  const listId = `${field}-times`;

  const lo = Math.max(toMin(min) ?? 0, from != null && toMin(from) != null ? toMin(from)! + step : 0);
  const hi = toMin(max) ?? DAY - 1;
  const start = Math.ceil(lo / step) * step;
  const times: number[] = [];
  for (let m = start; m <= hi; m += step) times.push(m);
  const fromMin = toMin(from);

  // What the field says: the value as it reads, unless someone is typing.
  const shown = typing ? text : cur == null ? "" : show(cur, hourCycle);

  const commit = (m: number) => {
    const clamped = Math.min(hi, Math.max(lo, m));
    const v = toValue(clamped);
    if (value === undefined) setInner(v);
    onValueChange?.(v);
    setTyping(false);
  };
  const nearest = (m: number | null) => {
    if (!times.length) return null;
    if (m == null) return 0;
    let best = 0;
    times.forEach((t, i) => Math.abs(t - m) < Math.abs(times[best] - m) && (best = i));
    return best;
  };
  const openList = () => {
    if (disabled || open) return;
    const r = shell.current?.getBoundingClientRect();
    if (r) {
      const room = innerHeight - r.bottom;
      setPlace({ left: r.left, top: r.bottom, bottom: innerHeight - r.top, width: Math.max(r.width, 200), up: room < 280 && r.top > room, scope: scopeOf(shell.current) });
    }
    setActive(nearest(cur));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setActive(null);
  };

  // While open: follow the field as the page moves, close on a click elsewhere, and show the active time.
  useEffect(() => {
    if (!open) return;
    const follow = () => {
      const r = shell.current?.getBoundingClientRect();
      if (r) setPlace((p) => p && { ...p, left: r.left, top: r.bottom, bottom: innerHeight - r.top, width: Math.max(r.width, 200) });
    };
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !shell.current?.contains(n)) setOpen(false);
    };
    addEventListener("scroll", follow, true);
    addEventListener("resize", follow);
    document.addEventListener("pointerdown", away);
    return () => {
      removeEventListener("scroll", follow, true);
      removeEventListener("resize", follow);
      document.removeEventListener("pointerdown", away);
    };
  }, [open]);
  useEffect(() => {
    if (!open || active == null) return;
    const frame = requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" }));
    return () => cancelAnimationFrame(frame);
  }, [open, active]);
  // On opening, the chosen time sits in the middle of the list.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const el = list.current?.querySelector<HTMLElement>(`[data-i="${nearest(cur) ?? 0}"]`);
      const box = list.current?.querySelector<HTMLElement>("[data-scroll]");
      if (el && box) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
    // Only when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      const n = times.length;
      setActive((a) => (a == null ? 0 : (a + (e.key === "ArrowDown" ? 1 : -1) + n) % n));
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(times.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const typed = typing ? parseTime(text) : null;
      if (typed != null) commit(typed);
      else if (open && active != null) commit(times[active]);
      close();
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
      setTyping(false);
    } else if (e.key === "Tab") close();
  };

  return (
    <>
      <span
        ref={shell}
        className={cx(
          "flex h-11 w-full items-center gap-2.5 rounded-full bg-[var(--bd-ui-field)] pl-4 pr-2 text-sm text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
          "hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
          "has-[[aria-invalid=true]]:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        <ClockIcon weight="duotone" className="size-4 shrink-0 text-[var(--bd-subtle)]" />
        <input
          ref={input}
          id={field}
          role="combobox"
          aria-label={aria["aria-labelledby"] ? undefined : label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="none"
          aria-activedescendant={open && active != null ? `${listId}-${active}` : undefined}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          aria-labelledby={aria["aria-labelledby"]}
          disabled={disabled}
          value={shown}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setTyping(true);
            setText(e.target.value);
            const m = parseTime(e.target.value);
            if (m != null && open) setActive(nearest(m));
          }}
          onClick={openList}
          onKeyDown={onKey}
          onBlur={() => {
            if (!typing) return;
            const m = parseTime(text);
            if (m != null) commit(m);
            else setTyping(false);
          }}
          className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-[var(--bd-subtle)]"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close();
            else {
              input.current?.focus();
              openList();
            }
          }}
          className="grid size-7 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]"
        >
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }} className="grid place-items-center">
            <CaretDownIcon weight="bold" className="size-3" />
          </motion.span>
        </button>
        {name && <input type="hidden" name={name} value={current ?? ""} />}
      </span>
      {mounted &&
        createPortal(
          <div {...(place?.scope ?? {})} style={{ display: "contents" }}>
            <AnimatePresence>
              {open && place && (
                <motion.div
                  ref={list}
                  initial={still ? { opacity: 0 } : { opacity: 0, y: place.up ? 4 : -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: "spring", stiffness: 600, damping: 38 }}
                  style={{ position: "fixed", left: place.left, width: place.width, ...(place.up ? { bottom: place.bottom + 6 } : { top: place.top + 6 }), transformOrigin: place.up ? "bottom" : "top" }}
                  className="z-[90] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
                >
                  <div data-scroll="" id={listId} role="listbox" aria-label={label ?? "Times"} className="relative max-h-[240px] overflow-y-auto overscroll-contain">
                    {times.length === 0 && <p className="px-3 py-2.5 text-[13px] text-[var(--bd-muted)]">No times in range</p>}
                    {times.map((t, i) => {
                      const picked = t === cur;
                      return (
                        <div
                          key={t}
                          id={`${listId}-${i}`}
                          data-i={i}
                          role="option"
                          aria-selected={picked}
                          onPointerMove={() => active !== i && setActive(i)}
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => {
                            commit(t);
                            close();
                          }}
                          className={cx("flex h-9 cursor-default select-none items-center gap-2 rounded-[10px] px-2.5 text-[13.5px] tabular-nums", active === i && "bg-[rgb(var(--bd-ink)/0.06)]", picked ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-fg)]")}
                        >
                          <span className="flex-1">
                            {show(t, hourCycle)}
                            {fromMin != null && <span className="ml-2 font-normal text-[var(--bd-subtle)]">{span(t - fromMin)}</span>}
                          </span>
                          {picked && <CheckIcon weight="bold" className="size-3.5 text-[var(--bd-fg)]" />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
}
