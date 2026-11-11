"use client";

import { CheckIcon, MinusIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * A job's stages as a waterfall, the way a trace is read: a row each, and on one time axis a bar
 * from where the stage started for as long as it took, so the run reads as steps down and across
 * and the long one shows itself. A stage still to come is a ghost where it's expected; the one
 * running grows in ink toward its usual length, with a hairline for now down every row; one that
 * failed is red, and what came after it has no bar. Pick a stage and what it did opens under its
 * row. Each row ends with its time.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type PipelineStatus = "waiting" | "running" | "done" | "failed" | "skipped" | "canceled";

export type PipelineStage = {
  id: string;
  label: string;
  status: PipelineStatus;
  /** How long it took, in milliseconds, once it's over; while it runs, how long it's been going. */
  duration?: number;
  /** When it started (milliseconds since 1970), so a running stage counts up from there by itself. */
  startedAt?: number;
  /** How long it usually takes: where its ghost sits before it runs, and how far the running bar is headed. */
  estimate?: number;
  /** A word on what it did, beside its bar: "1,204 packages", "2 type errors". Red when the stage failed. */
  note?: string;
};

export type PipelineProps = {
  stages: PipelineStage[];
  /** The stage that's picked, when stages can be picked. */
  selected?: string | null;
  /** Makes each row pickable, like a tab: told the stage's id. */
  onSelect?: (id: string) => void;
  /** What the picked stage did (its log, its output), opened under its row. */
  children?: ReactNode;
  /** What the job is, for screen readers: "Build of 7c2e9a1". */
  label?: string;
  className?: string;
};

/** A length of time the way people say it: 8s, 41s, 1m 12s. */
export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

const WORD: Record<PipelineStatus, string> = { waiting: "waiting", running: "running", done: "done", failed: "failed", skipped: "skipped", canceled: "canceled" };
const QUIET = new Set<PipelineStatus>(["waiting", "skipped", "canceled"]);
/* The columns every row shares, the axis's head included: the stage, its stretch of time, its time. */
const ROW = "grid grid-cols-[minmax(76px,128px)_minmax(0,1fr)_minmax(44px,auto)] items-center gap-x-3 px-2.5";

/** The time now, once a second while a stage counts by itself; null until it's on screen (so the server and the page agree). */
function useNow(on: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!on) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [on]);
  return now;
}

/** Round ticks for an axis this long: no more than four, at 1, 2, 5, 10, 15, 20, 30 seconds or whole minutes. */
function ticks(total: number) {
  const s = total / 1000;
  const step = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600].find((n) => s / n <= 4) ?? 1200;
  const out: number[] = [];
  for (let t = 0; t <= s; t += step) out.push(t * 1000);
  return out;
}

/** A stage's mark: a check for done, a turning ring while it runs, a cross for failed, a dash for skipped, an empty ring to come. */
function Glyph({ status }: { status: PipelineStatus }) {
  const still = useReducedMotion();
  if (status === "done")
    return (
      <span className="grid size-3.5 shrink-0 place-items-center rounded-full text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
        <CheckIcon weight="bold" className="size-2" />
      </span>
    );
  if (status === "failed")
    return (
      <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[var(--bd-ui-stop)] text-white">
        <XIcon weight="bold" className="size-2" />
      </span>
    );
  if (status === "running")
    return (
      <span className="relative size-3.5 shrink-0">
        <svg viewBox="0 0 14 14" className="absolute inset-0" aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.6" style={{ stroke: "rgb(var(--bd-ink) / 0.14)" }} />
        </svg>
        <motion.svg viewBox="0 0 14 14" className="absolute inset-0" aria-hidden animate={still ? undefined : { rotate: 360 }} transition={{ duration: 1, ease: "linear", repeat: Infinity }}>
          <circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="9 26" style={{ stroke: "var(--bd-fg)" }} />
        </motion.svg>
      </span>
    );
  return (
    <span className="grid size-3.5 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.2)]">
      {status !== "waiting" && <MinusIcon weight="bold" className="size-2" />}
    </span>
  );
}

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;
/** A tick's label, short: seconds up to two minutes, then minutes. */
const tick = (ms: number) => (ms < 120000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m`);

export function Pipeline({ stages, selected = null, onSelect, children, label = "Stages", className }: PipelineProps) {
  const counting = stages.some((s) => s.status === "running" && s.startedAt != null);
  const now = useNow(counting);
  const still = useReducedMotion();
  const pickable = !!onSelect;
  const list = useRef<HTMLDivElement>(null);

  // A stage that changes how it's going is said aloud, once, rather than every tick of its clock.
  const [said, setSaid] = useState("");
  const was = useRef<Record<string, PipelineStatus>>({});
  useEffect(() => {
    const changed = stages.find((s) => was.current[s.id] && was.current[s.id] !== s.status);
    was.current = Object.fromEntries(stages.map((s) => [s.id, s.status]));
    if (changed) setSaid(`${changed.label}: ${WORD[changed.status]}`);
  }, [stages]);

  const elapsed = (s: PipelineStage) => (s.status === "running" && s.startedAt != null && now != null ? now - s.startedAt : (s.duration ?? 0));
  const known = stages.filter((s) => s.status === "done" && s.duration != null).map((s) => s.duration!);
  const usual = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 10000;
  // Where each stage sits on the axis: one after another, each as long as it took, has taken so far
  // (or is headed for, whichever is more), or is expected to take. A skipped stage takes no time.
  const span = (s: PipelineStage) =>
    s.status === "skipped" ? 0 : s.status === "running" ? Math.max(elapsed(s), s.estimate ?? 0) : s.status === "waiting" ? (s.estimate ?? usual) : (s.duration ?? 0);
  const starts = stages.map((_, i) => stages.slice(0, i).reduce((n, s) => n + span(s), 0));
  const end = stages.length ? starts[stages.length - 1] + span(stages[stages.length - 1]) : 0;
  const total = Math.max(1000, end * 1.04);
  const running = stages.findIndex((s) => s.status === "running");
  const nowAt = running >= 0 ? (starts[running] + elapsed(stages[running])) / total : null;

  // Now, and the running bar's ink, glide rather than step: between one reading of the time and
  // the next (a second, or however often the page says), they're carried on frame by frame from
  // the last reading, never more than a second ahead of it. Motion values move them without
  // drawing the rows again.
  const base = running >= 0 ? elapsed(stages[running]) : 0;
  const shape = { live: running >= 0, start: running >= 0 ? starts[running] : 0, span: running >= 0 ? Math.max(1, span(stages[running])) : 1, total };
  const shapeRef = useRef(shape);
  useEffect(() => {
    shapeRef.current = shape;
  });
  const read = useRef({ base: 0, at: 0 });
  useEffect(() => {
    read.current = { base, at: performance.now() };
  }, [base]);
  const nowLeft = useMotionValue(pct(nowAt ?? 0));
  const inkWidth = useMotionValue("0%");
  useAnimationFrame(() => {
    const g = shapeRef.current;
    if (!g.live) return;
    const e = read.current.base + Math.min(1000, performance.now() - read.current.at);
    nowLeft.set(pct(Math.min(1, (g.start + e) / g.total)));
    inkWidth.set(pct(Math.min(1, e / g.span)));
  });
  const marks = ticks(total);
  const spent = stages.reduce((n, s) => n + (s.status === "waiting" ? 0 : elapsed(s)), 0);

  const time = (s: PipelineStage) => {
    if (s.status === "waiting") return s.estimate ? `~${formatDuration(s.estimate)}` : "";
    if (s.status === "skipped") return "Skipped";
    if (s.status === "canceled" && !s.duration) return "Canceled";
    return formatDuration(elapsed(s));
  };

  // Up and down walk the rows, picking as they go.
  const walk = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!pickable) return;
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? stages.length - 1 : null;
    if (!step && to === null) return;
    e.preventDefault();
    const at = Math.max(0, stages.findIndex((s) => s.id === selected));
    const next = stages[to ?? (at + step + stages.length) % stages.length];
    onSelect!(next.id);
    list.current?.querySelector<HTMLElement>(`[data-stage="${next.id}"]`)?.focus();
  };

  // The axis's grid and now, drawn in every row's middle column so they run down as one.
  const rules = (
    <>
      {marks.slice(1).map((m) => (
        <span key={m} aria-hidden className="absolute inset-y-0 w-px bg-[rgb(var(--bd-ink)/0.06)]" style={{ left: pct(m / total) }} />
      ))}
      {nowAt != null && <motion.span aria-hidden className="absolute inset-y-0 z-[1] w-px bg-[var(--bd-fg)] opacity-40" style={{ left: nowLeft }} />}
    </>
  );

  return (
    <div className={cx("@container/pipeline w-full min-w-0", className)}>
      {/* The axis: stage, time along the run, and the whole run's time so far. */}
      <div aria-hidden className={cx(ROW, "h-7 text-[11px] text-[var(--bd-subtle)]")}>
        <span>Stage</span>
        <span className="relative h-full">
          {/* Near the end, a tick keeps its line but not its label, which would run into the run's time. */}
          {marks
            .filter((m) => m / total <= 0.86)
            .map((m, i) => (
              <span key={m} className={cx("absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono tabular-nums", i > 0 && "-translate-x-1/2")} style={{ left: pct(m / total) }}>
                {tick(m)}
              </span>
            ))}
        </span>
        <span className="text-right font-mono tabular-nums">{formatDuration(spent)}</span>
      </div>
      <div ref={list} role={pickable ? "tablist" : "list"} aria-label={label} aria-orientation="vertical" onKeyDown={walk} className="border-t border-[var(--bd-line-subtle)]">
        {stages.map((s, i) => {
          const on = pickable && selected === s.id;
          const at = starts[i] / total;
          const len = span(s) / total;
          const t = time(s);
          // Its note sits after its bar where there's room, before it where there isn't.
          const noteAfter = at + len < 0.7;
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <Glyph status={s.status} />
                <span className={cx("min-w-0 truncate text-[13px] leading-5", on || s.status === "running" ? "font-medium" : "", QUIET.has(s.status) ? "text-[var(--bd-muted)]" : "text-[var(--bd-fg)]")}>
                  {s.label}
                  <span className="sr-only">
                    , {WORD[s.status]}
                    {s.note ? `, ${s.note}` : ""}
                  </span>
                </span>
              </span>
              <span className="relative h-full">
                {rules}
                {/* Its stretch of the run: a ghost where it's expected, ink for what's done, red where it failed. */}
                {s.status !== "skipped" && len > 0 && (
                  <span className="absolute top-1/2 h-2 -translate-y-1/2" style={{ left: pct(at), width: `max(3px, ${pct(len)})` }}>
                    <span className="absolute inset-0 rounded-[3px] bg-[rgb(var(--bd-ink)/0.08)]" />
                    {s.status !== "waiting" && (
                      <motion.span
                        className={cx("absolute inset-y-0 left-0 rounded-[3px]", s.status === "failed" ? "bg-[var(--bd-ui-stop)]" : s.status === "canceled" ? "bg-[rgb(var(--bd-ink)/0.3)]" : "bg-[var(--bd-fg)]")}
                        style={{ width: s.status === "running" ? inkWidth : "100%" }}
                      >
                        {s.status === "running" && !still && <motion.span className="absolute inset-y-0 right-0 w-3 rounded-[3px] bg-[var(--bd-surface)]" animate={{ opacity: [0, 0.45, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />}
                      </motion.span>
                    )}
                  </span>
                )}
                {s.note && s.status !== "waiting" && (
                  <span
                    className={cx("absolute top-1/2 max-w-[45%] -translate-y-1/2 truncate whitespace-nowrap text-[11.5px] @max-lg/pipeline:hidden", s.status === "failed" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-muted)]", noteAfter ? "pl-2" : "-translate-x-full pr-2")}
                    style={{ left: noteAfter ? pct(at + len) : pct(at) }}
                  >
                    {s.note}
                  </span>
                )}
              </span>
              <span className={cx("text-right font-mono text-[11.5px] tabular-nums", s.status === "running" ? "text-[var(--bd-fg)]" : s.status === "failed" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-subtle)]")}>{t}</span>
            </>
          );
          const box = cx(ROW, "relative h-10 w-full rounded-[10px] text-left outline-none", on && "bg-[rgb(var(--bd-ink)/0.05)]");
          return (
            <div key={s.id} role={pickable ? "presentation" : "listitem"}>
              {pickable ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  tabIndex={on || (!selected && i === 0) ? 0 : -1}
                  data-stage={s.id}
                  onClick={() => onSelect!(s.id)}
                  className={cx(box, "cursor-pointer transition-colors focus-visible:shadow-[inset_0_0_0_2px_var(--bd-ui-focus)]", !on && "hover:bg-[rgb(var(--bd-ink)/0.03)]")}
                >
                  {row}
                </button>
              ) : (
                <div className={box}>{row}</div>
              )}
              {/* What the picked stage did, opened under its row. */}
              <AnimatePresence initial={false}>
                {on && children != null && children !== false && (
                  <motion.div key="out" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }} className="overflow-hidden">
                    <div className="pb-2 pt-1">
                      <div className="rounded-[14px] bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)]">{children}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
