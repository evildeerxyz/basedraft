"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

/*
 * Rows that share one time axis, each with what happened to it as marks along its own lane: an
 * ink tick for what shipped, a short gray one for what was tried, a red dot for what failed, and a
 * ring that breathes for what's running now. A hairline marks now down through every lane, and
 * weekends are faintly shaded so a quiet Saturday doesn't read as trouble. The marks sweep in from
 * the left the first time it's seen; point at one for what it was and when. A row can be picked.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const DAY = 86_400_000;

export type LaneKind = "ship" | "try" | "fail" | "run";
export type LaneEvent = { id: string; /** When, in milliseconds since 1970. */ at: number; kind: LaneKind; /** What it was, for its tip: "Promoted 7c2e9a1". */ label: string };
export type LaneRow = {
  id: string;
  label: ReactNode;
  /** A line under the label. */
  sub?: ReactNode;
  /** Before the label: an icon tile, a logo. */
  lead?: ReactNode;
  /** At the row's end: a figure, a face. */
  aside?: ReactNode;
  events: LaneEvent[];
  /** Read to screen readers in place of the label, when the label isn't text. */
  name?: string;
};

export type LanesProps = {
  rows: LaneRow[];
  /** The axis, in milliseconds since 1970. */
  from: number;
  to: number;
  /** Where the now line stands. */
  now: number;
  /** What the row ends show, over them. */
  aside?: string;
  selected?: string | null;
  /** Makes each row pickable. */
  onSelect?: (id: string) => void;
  /** Shade Saturdays and Sundays. */
  weekends?: boolean;
  /** What the rows are, for screen readers: "Projects". */
  label?: string;
  className?: string;
};

const WORDS: Record<LaneKind, [string, string]> = { ship: ["release", "releases"], try: ["preview", "previews"], fail: ["failure", "failures"], run: ["build running", "builds running"] };
const when = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const dayName = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** One mark on a lane, at its place: a tick, a dot, or a breathing ring. */
function Mark({ e, left, delay, seen, still, onPoint }: { e: LaneEvent; left: number; delay: number; seen: boolean; still: boolean; onPoint: (e: LaneEvent | null) => void }) {
  const shape =
    e.kind === "ship" ? "h-4 w-[3px] rounded-full bg-[var(--bd-fg)]" : e.kind === "try" ? "h-2.5 w-[2px] rounded-full bg-[rgb(var(--bd-ink)/0.28)]" : e.kind === "fail" ? "size-[8px] rounded-full bg-[var(--bd-ui-stop)] shadow-[0_0_0_2px_var(--bd-surface)]" : "size-[9px] rounded-full border-2 border-[var(--bd-fg)] bg-[var(--bd-surface)]";
  return (
    // A wider strip than the mark to point at, so a 2px tick is easy to find.
    <span className="absolute inset-y-0 z-[1] w-3 -translate-x-1/2" style={{ left: `${left}%` }} onPointerEnter={() => onPoint(e)} onPointerLeave={() => onPoint(null)}>
      <motion.span
        aria-hidden
        className={cx("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", shape)}
        initial={false}
        animate={{ opacity: seen ? 1 : 0, scale: seen ? 1 : 0.4 }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 26, delay: seen ? delay : 0 }}
      />
      {e.kind === "run" && !still && <motion.span aria-hidden className="absolute left-1/2 top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bd-fg)]" animate={{ scale: [1, 2.2], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />}
    </span>
  );
}

export function Lanes({ rows, from, to, now, aside, selected, onSelect, weekends = true, label = "Lanes", className }: LanesProps) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.15 });
  const still = !!useReducedMotion();
  const [tip, setTip] = useState<{ row: string; e: LaneEvent } | null>(null);
  const span = to - from;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - from) / span) * 100));

  // The days, for the shading and the dates over the lanes.
  const first = Math.floor(from / DAY) * DAY;
  const days: number[] = [];
  for (let d = first; d < to; d += DAY) if (d + DAY > from) days.push(d);
  const step = days.length > 21 ? 7 : days.length > 10 ? 2 : 1;
  // A date a day and a half clear of now, so the two never meet.
  const ticks = days.filter((d, i) => i % step === 0 && d >= from && Math.abs(d + DAY / 2 - now) > DAY * 1.5);

  // The same columns, and the same inset, for the dates, the ground and every row, so they line up.
  const ROW = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-2 @2xl/lanes:grid-cols-[minmax(0,210px)_minmax(0,1fr)_96px] @2xl/lanes:gap-x-6";

  // Weekend shade and the now line, drawn once down the lane column of every row. Narrow, a lane
  // carries only its now line: shaded days in every row read as blocks.
  const ground = (shade: boolean) => (
    <>
      {weekends &&
        shade &&
        days
          .filter((d) => [0, 6].includes(new Date(d).getUTCDay()))
          .map((d) => <span key={d} className="absolute inset-y-0 bg-[rgb(var(--bd-ink)/0.028)]" style={{ left: `${pct(d)}%`, width: `${pct(d + DAY) - pct(d)}%` }} />)}
      <span className="absolute inset-y-0 w-px bg-[var(--bd-fg)] opacity-30" style={{ left: `${pct(now)}%` }} />
    </>
  );

  return (
    <div ref={box} role="group" aria-label={label} className={cx("@container/lanes relative", className)}>
      {/* The dates over the lanes, and what the row ends show. */}
      <div aria-hidden className={cx(ROW, "h-8 items-end pb-2 text-[12px] text-[var(--bd-subtle)]")}>
        <span />
        <span className="relative hidden h-4 @2xl/lanes:block">
          {ticks.map((d, i) => (
            // Where the lanes are narrow, every other date gives way.
            <span key={d} className={cx("absolute bottom-0 -translate-x-1/2 whitespace-nowrap tabular-nums", i % 2 === 1 && "@max-4xl/lanes:hidden")} style={{ left: `${pct(d + DAY / 2)}%` }}>
              {dayName(d)}
            </span>
          ))}
          <span className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap font-medium text-[var(--bd-fg)]" style={{ left: `${pct(now)}%` }}>
            Now
          </span>
        </span>
        <span className="text-right">{aside}</span>
      </div>

      <div className="relative">
        {/* The ground, on a grid of the same columns, so it lines up with every lane. */}
        <div aria-hidden className={cx(ROW, "pointer-events-none absolute inset-0 hidden @2xl/lanes:grid")}>
          <span />
          <span className="relative">{ground(true)}</span>
          <span />
        </div>

        <ul className="relative border-t border-[var(--bd-line-subtle)]">
          {rows.map((r) => {
            const on = selected === r.id;
            const counts = (Object.keys(WORDS) as LaneKind[]).map((k) => [k, r.events.filter((e) => e.kind === k).length] as const).filter(([, n]) => n);
            const last = r.events.reduce((m, e) => Math.max(m, e.at), 0);
            const said = `${r.name ?? (typeof r.label === "string" ? r.label : "")}: ${counts.map(([k, n]) => `${n} ${WORDS[k][n === 1 ? 0 : 1]}`).join(", ") || "nothing"} since ${dayName(from)}${last ? `, the last ${dayName(last)}` : ""}.`;
            const inner = (
              <>
                <span className="flex min-w-0 items-center gap-3">
                  {r.lead}
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-[14.5px] text-[var(--bd-fg)]">{r.label}</span>
                    {r.sub && <span className="block truncate text-[13px] text-[var(--bd-muted)]">{r.sub}</span>}
                  </span>
                </span>
                {/* The lane. */}
                <span aria-hidden className="relative order-last col-span-2 h-7 @2xl/lanes:order-none @2xl/lanes:col-span-1 @2xl/lanes:h-full">
                  {/* Narrow, each lane carries its own ground. */}
                  <span className="absolute inset-0 overflow-hidden @2xl/lanes:hidden">{ground(false)}</span>
                  <span className="absolute inset-x-0 top-1/2 h-px bg-[rgb(var(--bd-ink)/0.08)]" />
                  {r.events.map((e) => (
                    <Mark key={e.id} e={e} left={pct(e.at)} delay={(pct(e.at) / 100) * 0.7} seen={seen} still={still} onPoint={(x) => setTip(x ? { row: r.id, e: x } : null)} />
                  ))}
                  {tip?.row === r.id && (
                    <span className={cx("pointer-events-none absolute bottom-[calc(50%+14px)] z-10 whitespace-nowrap rounded-full bg-[var(--bd-raised)] px-2.5 py-1 text-[12px] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_6px_16px_-6px_rgb(var(--bd-shade)/0.3)]", pct(tip.e.at) > 75 ? "-translate-x-full" : pct(tip.e.at) < 25 ? "" : "-translate-x-1/2")} style={{ left: `${pct(tip.e.at)}%` }}>
                      <span className={tip.e.kind === "fail" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-fg)]"}>{tip.e.label}</span> <span className="tabular-nums text-[var(--bd-muted)]">{when(tip.e.at)}</span>
                    </span>
                  )}
                </span>
                <span className="text-right text-[13.5px] tabular-nums">{r.aside}</span>
              </>
            );
            const rowClass = cx(ROW, "relative w-full items-center gap-y-2.5 border-b border-[var(--bd-line-subtle)] py-3 text-left outline-none transition-colors @2xl/lanes:h-[60px] @2xl/lanes:py-0", onSelect && "cursor-pointer hover:bg-[rgb(var(--bd-ink)/0.025)] focus-visible:bg-[rgb(var(--bd-ink)/0.04)]", on && "bg-[rgb(var(--bd-ink)/0.045)] hover:bg-[rgb(var(--bd-ink)/0.05)]");
            return (
              <li key={r.id}>
                {onSelect ? (
                  <button type="button" aria-pressed={on} aria-label={said} onClick={() => onSelect(r.id)} className={rowClass}>
                    {inner}
                  </button>
                ) : (
                  <div aria-label={said} className={rowClass}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
