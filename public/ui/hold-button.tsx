"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type AnimationPlaybackControls, MotionConfig } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/*
 * For what can't be undone: press and hold, and the dial at its start winds closed while the
 * button sinks under your finger and the time left counts down at its end. Let go early and the
 * dial unwinds; hold to the end and it fills, checks and says so, then comes back after a moment.
 * Space and Enter hold it from the keyboard, the same way.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* The dial's color as it winds, and what fills it once confirmed. */
const TONE = {
  ink: { arc: "var(--bd-fg)", fill: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" },
  stop: { arc: "var(--bd-ui-stop)", fill: "text-white bg-[var(--bd-ui-stop)]" },
} as const;

/* The dial: a ring of radius 13 in a 32 box. */
const R = 13;
const C = 2 * Math.PI * R;

export type HoldButtonProps = {
  children: ReactNode;
  /** What it says once confirmed. */
  done?: ReactNode;
  /** How long to hold, in milliseconds. */
  duration?: number;
  /** Ink, or red for what can't be taken back. */
  tone?: keyof typeof TONE;
  icon?: ReactNode;
  onConfirm?: () => void;
  className?: string;
};

export function HoldButton({ children, done = "Done", duration = 1400, tone = "ink", icon, onConfirm, className }: HoldButtonProps) {
  const progress = useMotionValue(0);
  const offset = useTransform(progress, (v) => C * (1 - v));
  const left = useTransform(progress, (v) => `${((1 - v) * duration) / 1000 < 0.05 ? "0.0" : (((1 - v) * duration) / 1000).toFixed(1)}s`);
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const hint = useId();
  const t = TONE[tone];

  const hold = () => {
    if (confirmed) return;
    setHolding(true);
    run.current?.stop();
    run.current = animate(progress, 1, {
      duration: (duration / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setConfirmed(true);
        onConfirm?.();
      },
    });
  };
  const release = () => {
    setHolding(false);
    if (confirmed || progress.get() >= 1) return;
    run.current?.stop();
    run.current = animate(progress, 0, { type: "spring", stiffness: 240, damping: 28 });
  };

  // Once confirmed, it comes back to rest after a moment, ready again.
  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => {
      setConfirmed(false);
      run.current = animate(progress, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
    }, 2200);
    return () => clearTimeout(timer);
  }, [confirmed, progress]);

  return (
    <MotionConfig reducedMotion="user">
      <>
        <button
          type="button"
          aria-describedby={hint}
          onPointerDown={hold}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              hold();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") release();
          }}
          className={cx(
            "relative inline-flex h-11 shrink-0 touch-none select-none items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-[var(--bd-fg)] transition-[box-shadow,background-color,scale] duration-200 ease-out",
            // Raised at rest; pressed into the page while it's held.
            holding ? "scale-[0.985] bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)]" : "[background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.08)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
            className,
          )}
        >
          {/* The dial: a quiet ring that winds closed as it's held, and fills once it's done. */}
          <span className="relative grid size-8 shrink-0 place-items-center">
            <svg viewBox="0 0 32 32" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx="16" cy="16" r={R} fill="none" stroke="rgb(var(--bd-ink) / 0.12)" strokeWidth="2" />
              <motion.circle cx="16" cy="16" r={R} fill="none" stroke={t.arc} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} style={{ strokeDashoffset: offset }} />
            </svg>
            <AnimatePresence initial={false} mode="popLayout">
              {confirmed ? (
                <motion.span key="done" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: "spring", stiffness: 520, damping: 24 }} className={cx("absolute inset-[3px] grid place-items-center rounded-full [&_svg]:size-3.5", t.fill)}>
                  <CheckIcon weight="bold" />
                </motion.span>
              ) : (
                <motion.span key="icon" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="relative grid place-items-center text-[var(--bd-muted)] [&_svg]:size-3.5 [&_svg]:shrink-0">
                  {icon ?? <span className="size-1.5 rounded-full bg-current" />}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="relative grid">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={confirmed ? "done" : "label"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="whitespace-nowrap">
                {confirmed ? done : children}
              </motion.span>
            </AnimatePresence>
          </span>
          {/* The time still to hold, in figures, at its end. Once it's done it folds away, gap and all, so the button hugs its new word. */}
          <motion.span
            aria-hidden
            initial={false}
            animate={confirmed ? { width: 0, marginLeft: -10, opacity: 0 } : { width: "auto", marginLeft: 4, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="overflow-hidden"
          >
            <motion.span className={cx("block min-w-[2.6em] text-right font-mono text-[11.5px] tabular-nums", holding ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>{left}</motion.span>
          </motion.span>
          <span className="sr-only" aria-live="polite">
            {confirmed ? done : ""}
          </span>
        </button>
        {/* Outside the button, so it describes it without becoming part of its name. */}
        <span id={hint} className="sr-only">
          Press and hold to confirm. Let go early to cancel.
        </span>
      </>
    </MotionConfig>
  );
}
