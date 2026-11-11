"use client";

import { CalendarPlusIcon, CaretLeftIcon, CaretRightIcon, CircleNotchIcon, ClockIcon, GlobeIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/*
 * Booking a time with someone: who and what on the left, a month in the middle where the days with
 * room are lit and a pill glides to the one you pick, and that day's times on the right. Picking a
 * time splits it in two, the time and a Confirm beside it, so nothing is booked by a stray click.
 * Then the card turns to a confirmation with a check that draws itself, an .ics to add to a calendar,
 * and a way to book another. It lays itself out by its own width: three columns, two, or one.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ---------- Dates, as YYYY-MM-DD, in UTC so the server and the browser agree ---------- */

const DAY = 86_400_000;
const at = (d: string) => Date.parse(`${d}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => iso(at(d) + n * DAY);
const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
const addMonths = (d: string, n: number) => {
  const [y, m] = d.split("-").map(Number);
  return iso(Date.UTC(y, m - 1 + n, 1));
};
/** Monday is 0. */
const weekday = (d: string) => (new Date(at(d)).getUTCDay() + 6) % 7;
const daysIn = (d: string) => {
  const [y, m] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
const MONTH = f({ month: "long", year: "numeric" });
const DAY_LONG = f({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const DAY_FULL = f({ weekday: "long", month: "long", day: "numeric" });
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- Times, as HH:mm ---------- */

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const clock = (t: string, h12: boolean) => {
  if (!h12) return t;
  const n = minutes(t);
  const h = Math.floor(n / 60);
  return `${h % 12 || 12}:${String(n % 60).padStart(2, "0")}${h >= 12 ? "pm" : "am"}`;
};

/* ---------- The dots under the confirmation's check ---------- */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const tile = (lit: number) => {
  let rects = "";
  BAYER.forEach((v, i) => {
    if (v < lit) rects += `<rect x='${(i % 4) * 2}' y='${Math.floor(i / 4) * 2}' width='2' height='2'/>`;
  });
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>${rects}</svg>`)}")`;
};
const FADE = [12, 8, 5, 3, 1].map(tile);

export type Booking = { date: string; time: string; duration: number };

export type SchedulerProps = {
  /** The times free on a day, as HH:mm: a map by YYYY-MM-DD, or a function of the day and the length. */
  slots: Record<string, string[]> | ((date: string, duration: number) => string[]);
  /** Today, YYYY-MM-DD: days before it can't be picked, and it opens on its month. */
  today: string;
  /** A day to open with picked, its times showing. */
  defaultDate?: string;
  /** The lengths on offer, in minutes. One shows as a line; more as chips. */
  durations?: number[];
  defaultDuration?: number;
  /** Books it. Return a promise to show it working; throw to say the time was taken. */
  onBook?: (booking: Booking) => void | Promise<void>;
  /** Who it's with. */
  host?: { name: string; avatar?: string };
  /** What it is: "Intro call". */
  title?: string;
  /** Where: "Video call", an address. */
  location?: string;
  /** The zone the times are in, shown under the details. */
  timeZone?: string;
  /** 12-hour times to start; a switch over the times changes it. */
  hourCycle?: 12 | 24;
  className?: string;
};

export function Scheduler({ slots, today, defaultDate, durations = [30], defaultDuration, onBook, host, title = "Meeting", location, timeZone, hourCycle = 12, className }: SchedulerProps) {
  const [duration, setDuration] = useState(defaultDuration ?? durations[0]);
  const [month, setMonth] = useState(monthStart(defaultDate ?? today));
  const [dir, setDir] = useState(1);
  const [day, setDay] = useState<string | null>(defaultDate ?? null);
  const [focus, setFocus] = useState(defaultDate ?? today);
  const [time, setTime] = useState<string | null>(null);
  const [h12, setH12] = useState(hourCycle === 12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const byKeys = useRef(false);
  const still = useReducedMotion();
  const id = useId();

  const timesOn = (d: string) => (d < today ? [] : typeof slots === "function" ? slots(d, duration) : (slots[d] ?? []));
  const thisMonth = monthStart(today);
  const lead = weekday(month);
  const cells = Array.from({ length: Math.ceil((lead + daysIn(month)) / 7) * 7 }, (_, i) => (i < lead || i >= lead + daysIn(month) ? null : addDays(month, i - lead)));
  const times = day ? timesOn(day) : [];

  // After a key moves the focus, the day it landed on takes it.
  useEffect(() => {
    if (!byKeys.current) return;
    byKeys.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, month]);

  const goMonth = (n: number) => {
    const next = addMonths(month, n);
    if (next < thisMonth) return;
    setDir(n);
    setMonth(next);
  };
  const pick = (d: string) => {
    setDay(d);
    setFocus(d);
    setTime(null);
    setError(null);
  };
  const keys = (e: KeyboardEvent) => {
    const moves: Record<string, number | "home" | "end" | "pgup" | "pgdn"> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: "home", End: "end", PageUp: "pgup", PageDown: "pgdn" };
    const m = moves[e.key];
    if (m === undefined) return;
    e.preventDefault();
    let next = focus;
    if (typeof m === "number") next = addDays(focus, m);
    else if (m === "home") next = addDays(focus, -weekday(focus));
    else if (m === "end") next = addDays(focus, 6 - weekday(focus));
    else next = addMonths(focus, m === "pgup" ? -1 : 1).slice(0, 8) + String(Math.min(Number(focus.slice(8)), daysIn(addMonths(focus, m === "pgup" ? -1 : 1)))).padStart(2, "0");
    if (next < today) next = today;
    byKeys.current = true;
    setFocus(next);
    if (monthStart(next) !== month) {
      setDir(next > month ? 1 : -1);
      setMonth(monthStart(next));
    }
  };
  const confirm = async () => {
    if (!day || !time) return;
    const b = { date: day, time, duration };
    setBusy(true);
    setError(null);
    try {
      await onBook?.(b);
      setBooked(b);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "That time was just taken. Pick another.");
    } finally {
      setBusy(false);
    }
  };
  const ics = () => {
    if (!booked) return;
    const start = `${booked.date.replaceAll("-", "")}T${booked.time.replace(":", "")}00`;
    const end = minutes(booked.time) + booked.duration;
    const endDate = end >= 1440 ? addDays(booked.date, 1) : booked.date;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//basedraft//Scheduler//EN", "BEGIN:VEVENT", `UID:${stamp}-${booked.date}@scheduler`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${endDate.replaceAll("-", "")}T${hhmm(end).replace(":", "")}00`, `SUMMARY:${title}${host ? ` with ${host.name}` : ""}`, location ? `LOCATION:${location}` : "", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
    a.download = `${title.toLowerCase().replace(/\W+/g, "-")}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 460, damping: 38 };
  const ICON_BTN = "grid size-8 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:pointer-events-none disabled:opacity-30";

  const info = (
    <div className="grid content-start gap-3 @[520px]:@max-[720px]:flex @[520px]:@max-[720px]:flex-wrap @[520px]:@max-[720px]:items-center @[520px]:@max-[720px]:gap-x-5">
      {host && (
        <div className="flex items-center gap-2.5">
          {host.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={host.avatar} alt="" className="size-9 rounded-full object-cover shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]" />
          ) : (
            <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[rgb(var(--bd-ink)/0.07)] text-[13px] font-semibold text-[var(--bd-muted)]">
              {host.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
          )}
          <span className="text-[13px] text-[var(--bd-muted)]">{host.name}</span>
        </div>
      )}
      <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">{title}</h3>
      <div className="grid gap-2 text-[13px] text-[var(--bd-muted)] @[520px]:@max-[720px]:flex @[520px]:@max-[720px]:gap-4">
        {durations.length > 1 ? (
          <div role="radiogroup" aria-label="Length" className="flex flex-wrap items-center gap-1.5">
            <ClockIcon weight="duotone" className="mr-0.5 size-4 shrink-0" />
            {durations.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={duration === d}
                onClick={() => {
                  setDuration(d);
                  setTime(null);
                }}
                className={cx("h-7 rounded-full px-2 text-[12.5px] font-medium tabular-nums outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", duration === d ? "bg-[rgb(var(--bd-ink)/0.09)] text-[var(--bd-fg)]" : "text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] hover:text-[var(--bd-fg)]")}
              >
                {d}m
              </button>
            ))}
          </div>
        ) : (
          <span className="flex items-center gap-2">
            <ClockIcon weight="duotone" className="size-4 shrink-0" />
            {duration} min
          </span>
        )}
        {location && (
          <span className="flex items-center gap-2">
            <VideoCameraIcon weight="duotone" className="size-4 shrink-0" />
            {location}
          </span>
        )}
        {timeZone && (
          <span className="flex items-center gap-2">
            <GlobeIcon weight="duotone" className="size-4 shrink-0" />
            {timeZone}
          </span>
        )}
      </div>
    </div>
  );

  const calendar = (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between pl-1.5">
        <h4 aria-live="polite" className="text-[14px] font-medium">
          {MONTH.format(new Date(at(month)))}
        </h4>
        <span className="flex gap-0.5">
          <button type="button" aria-label="Previous month" disabled={month <= thisMonth} onClick={() => goMonth(-1)} className={ICON_BTN}>
            <CaretLeftIcon weight="bold" className="size-3.5" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => goMonth(1)} className={ICON_BTN}>
            <CaretRightIcon weight="bold" className="size-3.5" />
          </button>
        </span>
      </div>
      <div role="grid" aria-label={MONTH.format(new Date(at(month)))} onKeyDown={keys} className="relative overflow-hidden">
        <div role="row" className="grid grid-cols-7">
          {WEEK.map((w) => (
            <span key={w} role="columnheader" aria-label={w} className="pb-1.5 text-center text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]">
              {w.slice(0, 2)}
            </span>
          ))}
        </div>
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={month}
            ref={grid}
            custom={dir}
            variants={{ in: (d: number) => ({ x: still ? 0 : d * 40, opacity: 0 }), at: { x: 0, opacity: 1 }, out: (d: number) => ({ x: still ? 0 : d * -40, opacity: 0 }) }}
            initial="in"
            animate="at"
            exit="out"
            transition={{ x: spring, opacity: { duration: 0.18 } }}
            className="grid gap-1"
          >
            {Array.from({ length: cells.length / 7 }, (_, r) => (
              <div key={r} role="row" className="grid grid-cols-7 gap-1">
                {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
                  if (!d) return <span key={c} role="gridcell" />;
                  const open = timesOn(d).length > 0;
                  const on = d === day;
                  return (
                    <span key={d} role="gridcell" aria-selected={on}>
                      <button
                        type="button"
                        data-date={d}
                        tabIndex={d === focus ? 0 : -1}
                        aria-disabled={!open}
                        aria-label={`${DAY_FULL.format(new Date(at(d)))}${d === today ? ", today" : ""}${open ? "" : ", no times"}`}
                        onClick={() => open && pick(d)}
                        onFocus={() => setFocus(d)}
                        className={cx(
                          "relative grid aspect-square w-full place-items-center rounded-[12px] text-[13px] tabular-nums outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]",
                          open ? "font-medium" : "cursor-default text-[var(--bd-subtle)] opacity-60",
                          open && !on && "bg-[rgb(var(--bd-ink)/0.055)] text-[var(--bd-fg)] hover:bg-[rgb(var(--bd-ink)/0.1)]",
                          on && "text-[var(--bd-ui-ink-text)]",
                        )}
                      >
                        {on && <motion.span layoutId={`${id}-day`} transition={spring} className="absolute inset-0 rounded-[12px] [background:var(--bd-ui-ink)] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]" />}
                        <span className="relative">{Number(d.slice(8))}</span>
                        {d === today && <span aria-hidden className={cx("absolute bottom-[5px] size-1 rounded-full", on ? "bg-current" : "bg-[var(--bd-fg)]")} />}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const list = (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex h-8 items-center justify-between gap-2 pl-1">
        <h4 className="truncate text-[14px] font-medium">{day ? `${WEEK[weekday(day)]} ${Number(day.slice(8))}` : "Times"}</h4>
        <div role="radiogroup" aria-label="Clock" className="flex rounded-full bg-[var(--bd-ui-track)] p-0.5 shadow-[var(--bd-ui-well)]">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={h12 === v}
              onClick={() => setH12(v)}
              className={cx("relative h-6 rounded-full px-2 text-[11px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", h12 === v ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)]")}
            >
              {h12 === v && <motion.span layoutId={`${id}-h`} transition={spring} className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift)]" />}
              <span className="relative">{v ? "12h" : "24h"}</span>
            </button>
          ))}
        </div>
      </div>
      {!day ? (
        <p className="grid flex-1 place-items-center rounded-[14px] px-4 py-8 text-center text-[13px] text-[var(--bd-subtle)] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] @[520px]:min-h-[220px]">Pick a day to see its times.</p>
      ) : !times.length ? (
        <p className="grid flex-1 place-items-center px-4 py-8 text-center text-[13px] text-[var(--bd-subtle)]">No times this day.</p>
      ) : (
        <div role="listbox" aria-label={`Times on ${DAY_FULL.format(new Date(at(day)))}`} className="-mx-1 grid max-h-[284px] grid-cols-3 gap-1.5 overflow-y-auto px-1 pb-1 @[520px]:grid-cols-1 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]">
          {times.map((t, k) => {
            const on = t === time;
            return (
              <motion.div key={`${day}-${t}`} role="option" aria-selected={on} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: still ? 0 : Math.min(k, 10) * 0.025, duration: 0.2, layout: spring }} className={cx("flex h-10 gap-1.5", on && "col-span-3 @[520px]:col-span-1")}>
                <motion.button
                  layout
                  type="button"
                  onClick={() => {
                    setTime(on ? null : t);
                    setError(null);
                  }}
                  transition={spring}
                  className={cx(
                    "h-full min-w-0 flex-1 rounded-[12px] text-[13px] font-medium tabular-nums outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
                    on ? "bg-[rgb(var(--bd-ink)/0.1)] text-[var(--bd-fg)]" : "text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line)] hover:shadow-[inset_0_0_0_1.5px_var(--bd-line-strong)]",
                  )}
                >
                  {clock(t, h12)}
                </motion.button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.button
                      key="confirm"
                      type="button"
                      onClick={confirm}
                      disabled={busy}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "50%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={spring}
                      className="grid h-full shrink-0 place-items-center overflow-hidden whitespace-nowrap rounded-[12px] text-[13px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_6px_14px_-8px_rgb(0_0_0/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                    >
                      {busy ? <CircleNotchIcon weight="bold" className="size-4 animate-spin" aria-label="Booking" /> : "Confirm"}
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {error && (
          <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2 text-[12.5px] text-[var(--bd-ui-stop)]">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <section aria-label={`Book ${title}`} className={cx("@container overflow-hidden rounded-[24px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!booked ? (
          <motion.div key="pick" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18 }} className="grid gap-5 p-5 @[520px]:grid-cols-[minmax(0,1fr)_168px] @[720px]:grid-cols-[200px_minmax(0,1fr)_176px] @[720px]:gap-6">
            <div className="@[520px]:col-span-2 @[520px]:@max-[720px]:border-b @[520px]:@max-[720px]:border-[var(--bd-line-subtle)] @[520px]:@max-[720px]:pb-4 @[720px]:col-span-1 @[720px]:border-r @[720px]:border-[var(--bd-line-subtle)] @[720px]:pr-5">{info}</div>
            {calendar}
            {list}
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="relative grid justify-items-center gap-4 px-6 pb-7 pt-9 text-center">
            {/* A field of green dots that thins out downward, under the check. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 grid">
              {FADE.map((m, k) => (
                <motion.span key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: still ? 0 : 0.15 + k * 0.06 }} className="h-4 bg-[var(--bd-ui-ok)] opacity-40" style={{ maskImage: m, WebkitMaskImage: m, maskSize: "8px 8px", WebkitMaskSize: "8px 8px" }} />
              ))}
            </div>
            <span className="relative grid size-14 place-items-center rounded-full bg-[var(--bd-ui-ok)] text-white shadow-[0_8px_24px_-8px_var(--bd-ui-ok),inset_0_1px_0_rgb(255_255_255/0.3)]">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path d="M5 12.5 10 17.5 19 7.5" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.45, ease: [0.65, 0, 0.35, 1] }} />
              </svg>
            </span>
            <div className="relative grid gap-1">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em]">You&apos;re booked</h3>
              <p className="text-[13.5px] text-[var(--bd-muted)]">{host ? `${host.name} has it too, with an invite on the way.` : "An invite is on the way."}</p>
            </div>
            <dl className="relative grid w-full max-w-[360px] gap-2.5 rounded-[16px] p-4 text-left text-[13px] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
              {[
                ["What", `${title}${host ? ` with ${host.name}` : ""}`],
                ["When", `${DAY_LONG.format(new Date(at(booked.date)))}, ${clock(booked.time, h12)} to ${clock(hhmm(minutes(booked.time) + booked.duration), h12)}`],
                ...(location ? [["Where", location]] : []),
                ...(timeZone ? [["Zone", timeZone]] : []),
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[56px_1fr] gap-3">
                  <dt className="text-[var(--bd-subtle)]">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="relative flex flex-wrap justify-center gap-2">
              <button type="button" onClick={ics} className="flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                <CalendarPlusIcon weight="bold" className="size-4" />
                Add to calendar
              </button>
              <button
                type="button"
                onClick={() => {
                  setBooked(null);
                  setTime(null);
                }}
                className="h-9 rounded-full px-4 text-[13px] font-medium text-[var(--bd-fg)] outline-none shadow-[inset_0_0_0_1px_var(--bd-line-strong)] hover:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
              >
                Book another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
