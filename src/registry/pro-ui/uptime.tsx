"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/*
 * A service's days, a slim bar each, the way a status page shows them. A good day is solid green;
 * a day that was partly slow or down isn't painted one flat color but mixed through an ordered
 * dither, amber or red dots over the green in proportion to how much of it went wrong, so a short
 * blip reads differently from a lost afternoon. It fits as many days as its width holds, ending
 * today, and each day opens a card with its uptime and its incidents, by pointer or by keys.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: the order the dots of a bad day light in. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A tile of dots, 4 by 4 cells of 2px, with `lit` of its 16 cells on, as a mask. */
const tile = (lit: number) => {
  let rects = "";
  BAYER.forEach((b, i) => {
    if (b < lit) rects += `<rect x='${(i % 4) * 2}' y='${Math.floor(i / 4) * 2}' width='2' height='2'/>`;
  });
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>${rects}</svg>`)}")`;
};
const TILES = Array.from({ length: 17 }, (_, n) => tile(n));

/** How much of a bar a share of the day covers in dots: even a few minutes shows, a whole day is solid. */
const dots = (share: number) => (share <= 0 ? 0 : Math.max(4, Math.min(16, Math.round(4 + Math.sqrt(share) * 24))));

const short = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export type UptimeIncident = { title: string; /** How long, in minutes. */ minutes: number; /** Slow (warn) or down (stop). */ tone?: "warn" | "stop" };

export type UptimeDay = {
  /** YYYY-MM-DD. */
  date: string;
  /** The share of the day it was up and well, from 0 to 1. Leave it out for a day with no data. */
  up?: number;
  /** The share of the day it was up but slow, from 0 to 1. The rest was down. */
  degraded?: number;
  incidents?: UptimeIncident[];
};

export type UptimeProps = {
  /** The service: API, Dashboard, Builds. */
  name: string;
  /** Its days, oldest first. */
  days: UptimeDay[];
  /** How it is right now. */
  status?: "up" | "degraded" | "down";
  /** How many days. As many as fit its width by default. */
  span?: number;
  /** Runs when a day is clicked, or chosen with Enter. */
  onSelect?: (day: UptimeDay) => void;
  /** A bad day mixes its color in as dots, by how much went wrong; off, it's painted in its worst state. */
  dither?: boolean;
  className?: string;
};

const STATUS = {
  up: { word: "Operational", dot: "bg-[var(--bd-ui-ok)]", text: "text-[var(--bd-ui-ok)]" },
  degraded: { word: "Degraded", dot: "bg-[var(--bd-ui-wait)]", text: "text-[var(--bd-ui-wait)]" },
  down: { word: "Down", dot: "bg-[var(--bd-ui-stop)]", text: "text-[var(--bd-ui-stop)]" },
} as const;

/* A bar's least width, and the gap between bars. */
const BAR = 4;
const GAP = 2;
const pct = (v: number) => `${(Math.floor(v * 10000) / 100).toFixed(2)}%`;

export function Uptime({ name, days, status, span, onSelect, dither = true, className }: UptimeProps) {
  const box = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.3 });
  const still = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  // The bars rise in a wave once, the first time they're seen; after that they answer at once.
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    if (!seen) return;
    const t = setTimeout(() => setRisen(true), 1000);
    return () => clearTimeout(t);
  }, [seen]);
  // Where the active day's bar is across the row, for its card.
  const [center, setCenter] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fits = Math.max(7, Math.floor((width + GAP) / (BAR + GAP)));
  const shown = days.slice(-Math.min(days.length, span ?? (width ? fits : 0)));
  const known = shown.filter((d) => d.up != null);
  const uptime = known.length ? known.reduce((s, d) => s + (d.up ?? 0) + (d.degraded ?? 0), 0) / known.length : 1;
  const s = STATUS[status ?? "up"];
  const on = active != null ? shown[active] : null;

  const focus = (i: number) => {
    const to = Math.max(0, Math.min(shown.length - 1, i));
    setActive(to);
    row.current?.querySelectorAll<HTMLButtonElement>("button")[to]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = active ?? shown.length - 1;
    if (e.key === "ArrowLeft") focus(at - 1);
    else if (e.key === "ArrowRight") focus(at + 1);
    else if (e.key === "Home") focus(0);
    else if (e.key === "End") focus(shown.length - 1);
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };
  const describe = (d: UptimeDay) => {
    if (d.up == null) return `${short.format(Date.parse(`${d.date}T00:00:00Z`))}: no data`;
    const n = d.incidents?.length ?? 0;
    return `${short.format(Date.parse(`${d.date}T00:00:00Z`))}: ${pct((d.up ?? 0) + (d.degraded ?? 0))} up, ${n ? `${n} ${n === 1 ? "incident" : "incidents"}` : "no incidents"}`;
  };
  const cardLeft = Math.min(Math.max(center, 110), Math.max(110, width - 110));
  const point = (i: number, el: HTMLElement) => {
    setActive(i);
    setCenter(el.offsetLeft + el.offsetWidth / 2);
  };

  return (
    <div className={cx("w-full", className)}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="relative grid size-2 shrink-0 place-items-center">
            <span className={cx("absolute inset-0 rounded-full animate-[bd-ui-pulse_1.8s_ease-out_infinite] motion-reduce:hidden", s.dot)} />
            <span className={cx("relative size-2 rounded-full", s.dot)} />
          </span>
          <span className="truncate text-sm font-medium text-[var(--bd-fg)]">{name}</span>
          <span className={cx("shrink-0 text-[13px]", s.text)}>{s.word}</span>
        </div>
        <span className="shrink-0 text-[13px] tabular-nums text-[var(--bd-muted)]">{pct(uptime)} uptime</span>
      </div>
      <div ref={box} className="relative" onPointerLeave={() => setActive(null)}>
        <div ref={row} role="group" aria-label={`${name}, the last ${shown.length} days`} onKeyDown={onKey} className="flex h-9 items-end" style={{ gap: GAP }}>
          {shown.map((d, i) => {
            const ok = d.up != null;
            const degraded = d.degraded ?? 0;
            const down = ok ? Math.max(0, 1 - (d.up ?? 0) - degraded) : 0;
            const lit = active === i;
            return (
              <button
                key={d.date}
                type="button"
                tabIndex={(active ?? shown.length - 1) === i ? 0 : -1}
                aria-label={describe(d)}
                onPointerEnter={(e) => point(i, e.currentTarget)}
                onFocus={(e) => point(i, e.currentTarget)}
                onClick={() => onSelect?.(d)}
                className={cx("relative h-full min-w-0 flex-1 origin-bottom overflow-hidden rounded-[2px] outline-none transition-[scale,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]", active != null && !lit && "opacity-55", lit && "scale-y-[1.12]")}
                style={{ scale: seen || still ? undefined : "1 0", transitionDelay: seen && !still && !risen ? `${Math.min(i, 120) * 6}ms` : undefined }}
              >
                <span className={cx("absolute inset-0", !ok ? "bg-[var(--bd-ui-track)]" : dither ? "bg-[var(--bd-ui-ok)]" : down > 0.0005 ? "bg-[var(--bd-ui-stop)]" : degraded > 0 ? "bg-[var(--bd-ui-wait)]" : "bg-[var(--bd-ui-ok)]")} />
                {dither && degraded > 0 && <span className="absolute inset-0 bg-[var(--bd-ui-wait)]" style={{ maskImage: TILES[dots(degraded)], WebkitMaskImage: TILES[dots(degraded)] }} />}
                {dither && down > 0.0005 && <span className="absolute inset-0 bg-[var(--bd-ui-stop)]" style={{ maskImage: TILES[dots(down)], WebkitMaskImage: TILES[dots(down)] }} />}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {on && (
            <motion.div
              key="card"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14 }}
              className="pointer-events-none absolute bottom-[calc(100%+10px)] z-10 w-[220px] rounded-[14px] bg-[var(--bd-surface)] p-3 text-xs shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
              style={{ left: cardLeft, translate: "-50% 0" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-[var(--bd-fg)]">{short.format(Date.parse(`${on.date}T00:00:00Z`))}</span>
                <span className="tabular-nums text-[var(--bd-muted)]">{on.up == null ? "No data" : `${pct((on.up ?? 0) + (on.degraded ?? 0))} up`}</span>
              </div>
              {on.up != null &&
                (on.incidents?.length ? (
                  <ul className="mt-2 grid gap-1.5 border-t border-[var(--bd-line-subtle)] pt-2">
                    {on.incidents.map((inc, k) => (
                      <li key={k} className="flex items-start gap-2">
                        <span className={cx("mt-[5px] size-1.5 shrink-0 rounded-full", inc.tone === "warn" ? "bg-[var(--bd-ui-wait)]" : "bg-[var(--bd-ui-stop)]")} />
                        <span className="min-w-0 flex-1 text-[var(--bd-fg)]">{inc.title}</span>
                        <span className="shrink-0 tabular-nums text-[var(--bd-subtle)]">{inc.minutes < 60 ? `${inc.minutes}m` : `${Math.floor(inc.minutes / 60)}h ${inc.minutes % 60}m`}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[var(--bd-muted)]">No incidents</p>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div aria-hidden className="mt-2 flex justify-between text-[11px] text-[var(--bd-subtle)]">
        <span>{shown.length} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
