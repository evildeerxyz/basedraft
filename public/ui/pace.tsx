"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/*
 * Where each allowance stands now and where it lands by the period's end, on one scale with the
 * plan's line running down through all of them. A dot for now, a ring for the end at this pace and
 * a ghost between; past the plan's line the ghost and the ring turn amber, so the one that will
 * cost more finds you before you look for it. The dots run out from zero the first time it's seen.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const EASE = [0.16, 1, 0.3, 1] as const;

export type PaceItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Used so far. */
  used: number;
  /** What the plan includes. */
  limit: number;
  /** Where it lands by the period's end at this pace. */
  projected: number;
  /** After the figures: min, GB. */
  unit?: string;
};

export type PaceProps = {
  items: PaceItem[];
  /** The period's last day, as it's read: "Nov 30". */
  end: string;
  /** How the figures read. Grouped with commas, and millions shortened, by default. */
  format?: (n: number) => string;
  /** What it shows, for screen readers. */
  label?: string;
  className?: string;
};

const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M` : n.toLocaleString("en-US", { maximumFractionDigits: 0 }));

export function Pace({ items, end, format = short, label = "Allowances", className }: PaceProps) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.3 });
  const still = useReducedMotion();
  // The scale runs a little past the furthest ring, and never stops short of a fifth past the plan.
  const scale = Math.max(1.2, ...items.map((i) => (i.projected / i.limit) * 1.08));
  const pct = (share: number) => (Math.min(share, scale) / scale) * 100;
  const at = (share: number) => `${pct(share)}%`;
  const plan = at(1);
  const move = (delay: number) => (still ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: seen ? delay : 0 });

  const ROW = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 @xl/pace:grid-cols-[minmax(0,190px)_minmax(0,1fr)_92px] @xl/pace:gap-x-6";

  return (
    <div ref={box} role="group" aria-label={label} className={cx("@container/pace", className)}>
      {/* The scale's head: what the marks are, and the plan's line named where it starts. */}
      <div aria-hidden className={cx(ROW, "h-7 items-end pb-1.5 text-[12px] text-[var(--bd-subtle)]")}>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-[7px] rounded-full bg-[var(--bd-fg)]" />
            Now
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-[7px] rounded-full border-[1.5px] border-[rgb(var(--bd-ink)/0.45)]" />
            At this pace
          </span>
        </span>
        <span className="relative hidden h-4 @xl/pace:block">
          <span className="absolute bottom-0 -translate-x-1/2 font-medium text-[var(--bd-fg)]" style={{ left: plan }}>
            Plan
          </span>
        </span>
        <span className="text-right">By {end}</span>
      </div>

      <div className="relative">
      <div aria-hidden className={cx(ROW, "pointer-events-none absolute inset-0 hidden @xl/pace:grid")}>
        <span />
        <span className="relative">
          <span className="absolute inset-y-0 w-px bg-[rgb(var(--bd-ink)/0.22)]" style={{ left: plan }} />
        </span>
        <span />
      </div>
      <ul>
        {items.map((it, n) => {
          const now = it.used / it.limit;
          const then = it.projected / it.limit;
          const over = then > 1;
          const said = `${it.label}: ${format(it.used)} of ${format(it.limit)}${it.unit ? ` ${it.unit}` : ""} so far, heading for ${format(it.projected)} by ${end}${over ? ", past the plan" : ""}.`;
          return (
            <li key={it.id} aria-label={said} className={cx(ROW, "items-center gap-y-3 py-3.5 @xl/pace:h-[68px] @xl/pace:py-0")}>
              <div className="flex min-w-0 items-center gap-3">
                {it.icon && <span className="shrink-0 text-[var(--bd-muted)] [&_svg]:size-[18px]">{it.icon}</span>}
                <div className="min-w-0">
                  <p className="truncate text-[14.5px]">{it.label}</p>
                  <p className="truncate text-[13px] tabular-nums text-[var(--bd-muted)]">
                    {format(it.used)}
                    {it.unit ? ` ${it.unit}` : ""} so far
                  </p>
                </div>
              </div>

              {/* The line: used in ink, the ghost to where it lands, the plan's line through it. */}
              <div aria-hidden className="relative order-last col-span-2 h-6 @xl/pace:order-none @xl/pace:col-span-1 @xl/pace:h-full">
                <span className="absolute inset-x-0 top-1/2 h-px bg-[rgb(var(--bd-ink)/0.08)]" />
                <span className="absolute inset-y-0 w-px bg-[rgb(var(--bd-ink)/0.22)] @xl/pace:hidden" style={{ left: plan }} />
                <motion.span className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[rgb(var(--bd-ink)/0.16)]" initial={false} animate={{ left: seen ? at(now) : "0%", width: seen ? `${Math.max(0, pct(Math.min(then, 1)) - pct(now))}%` : "0%" }} transition={move(0.35 + n * 0.06)} />
                {over && <motion.span className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--bd-ui-wait)]/60" initial={false} animate={{ left: plan, width: seen ? `${pct(then) - pct(1)}%` : "0%" }} transition={move(0.75 + n * 0.06)} />}
                <motion.span className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--bd-fg)]" initial={false} animate={{ width: seen ? at(now) : "0%" }} transition={move(n * 0.06)} />
                <motion.span className={cx("absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--bd-surface)]", over ? "border-[var(--bd-ui-wait)]" : "border-[rgb(var(--bd-ink)/0.4)]")} initial={false} animate={{ left: seen ? at(then) : "0%", opacity: seen ? 1 : 0 }} transition={move(0.35 + n * 0.06)} />
                <motion.span className="absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bd-fg)] shadow-[0_0_0_3px_var(--bd-surface)]" initial={false} animate={{ left: seen ? at(now) : "0%" }} transition={move(n * 0.06)} />
              </div>

              <div className="text-right">
                <p className={cx("text-[14.5px] font-medium tabular-nums", over && "text-[var(--bd-ui-wait)]")}>{Math.round(then * 100)}%</p>
                <p className="whitespace-nowrap text-[13px] tabular-nums text-[var(--bd-muted)]">
                  of {format(it.limit)}
                  {it.unit ? ` ${it.unit}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
