"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

/*
 * The time left until a moment: a launch, a sale's end, an event. Days, hours, minutes and seconds
 * on raised tiles, each digit rolling down as it changes, the way a departures board turns over;
 * or the same, inline in a sentence. It reads the clock only in the browser, ticking once a second,
 * and at zero it hands over to whatever you give it to say then.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* One clock for every countdown on the page, ticking on the second. The server has no time, so it shows dashes. */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
function tick() {
  now = Math.floor(Date.now() / 1000);
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  if (!timer) tick();
  return () => {
    listeners.delete(fn);
    if (!listeners.size && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
};
const read = () => {
  if (!now) now = Math.floor(Date.now() / 1000);
  return now;
};

const UNITS = { days: 86400, hours: 3600, minutes: 60, seconds: 1 } as const;
type Unit = keyof typeof UNITS;
const LABEL: Record<Unit, [string, string]> = { days: ["day", "days"], hours: ["hour", "hours"], minutes: ["minute", "minutes"], seconds: ["second", "seconds"] };
const SHORT: Record<Unit, string> = { days: "d", hours: "h", minutes: "m", seconds: "s" };

export type CountdownProps = {
  /** The moment it counts down to: a Date, a time in ms, or a date string. */
  to: Date | number | string;
  /** Which units it shows, largest first. Time past the largest is folded into it, so 30 hours shows as 30 with no days. */
  units?: Unit[];
  /** Tiles, or inline in a line of text: 3d 4h 12m. */
  variant?: "tiles" | "inline";
  /** What it says at zero, in place of the numbers. */
  done?: ReactNode;
  /** Runs once, when it reaches zero. */
  onComplete?: () => void;
  /** What it's counting down to, for screen readers: "Zuno for teams launches". */
  label?: string;
  className?: string;
};

/** A digit that rolls down to its new value. */
function Digit({ d }: { d: string }) {
  const still = useReducedMotion();
  return (
    <span className="relative inline-grid h-[1em] w-[0.62em] overflow-hidden [&>*]:[grid-area:1/1]">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={d} initial={still ? { opacity: 0 } : { y: "-100%" }} animate={{ y: 0, opacity: 1 }} exit={still ? { opacity: 0 } : { y: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="block text-center leading-[1]">
          {d}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Countdown({ to, units = ["days", "hours", "minutes", "seconds"], variant = "tiles", done, onComplete, label, className }: CountdownProps) {
  const t = useSyncExternalStore(subscribe, read, () => null);
  const end = Math.floor(new Date(to).getTime() / 1000);
  const left = t === null ? null : Math.max(0, end - t);
  const fired = useRef(false);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onComplete?.();
    }
  }, [left, onComplete]);

  // Each unit's number: the largest takes everything above it.
  const parts = units.map((u, k) => {
    if (left === null) return { u, n: null as number | null };
    const above = k === 0 ? Infinity : UNITS[units[k - 1]];
    return { u, n: Math.floor((left % above) / UNITS[u]) };
  });
  const said = left === null ? undefined : parts.map((p) => `${p.n} ${LABEL[p.u][p.n === 1 ? 0 : 1]}`).join(", ");

  if (left === 0 && done) return <div className={className}>{done}</div>;

  if (variant === "inline") {
    return (
      <span role="timer" aria-label={label ? `${label} in ${said ?? "a moment"}` : said} className={cx("inline-flex items-baseline gap-1.5 font-medium tabular-nums", className)}>
        {parts.map((p) => (
          <span key={p.u} aria-hidden className="inline-flex items-baseline">
            {p.n === null ? "--" : String(p.n).padStart(2, "0").split("").map((d, k) => <Digit key={k} d={d} />)}
            <span className="ml-px text-[0.85em] text-[var(--bd-muted)]">{SHORT[p.u]}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <div role="timer" aria-label={label ? `${label} in ${said ?? "a moment"}` : said} className={cx("inline-flex items-start gap-1.5 sm:gap-2", className)}>
      {parts.map((p, k) => (
        <div key={p.u} aria-hidden className="flex items-start gap-1.5 sm:gap-2">
          {k > 0 && <span className="pt-[15px] text-[22px] font-medium leading-none sm:pt-[18px] sm:text-[26px] text-[var(--bd-subtle)] opacity-60">:</span>}
          <div className="grid justify-items-center gap-2">
            <span className="flex h-[56px] min-w-[56px] items-center justify-center rounded-[14px] px-2 text-[30px] font-medium sm:h-[68px] sm:min-w-[68px] sm:rounded-[16px] sm:px-2.5 sm:text-[38px] tracking-[-0.03em] tabular-nums text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
              {p.n === null ? <span className="text-[var(--bd-subtle)]">--</span> : String(p.n).padStart(2, "0").split("").map((d, i) => <Digit key={i} d={d} />)}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bd-subtle)]">{LABEL[p.u][p.n === 1 ? 0 : 1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
