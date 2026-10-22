"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type AnimationPlaybackControls, MotionConfig } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/*
 * For what can't be undone: press and hold, and ink fills the pill from the left as you do. Let go
 * early and it drains away; hold to the end and it confirms, with a check, then comes back after a
 * moment. Space and Enter hold it from the keyboard, the same way.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const FILL = {
  ink: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]",
  stop: "text-white bg-[var(--bd-ui-stop)]",
} as const;

export type HoldButtonProps = {
  children: ReactNode;
  /** What it says once confirmed. */
  done?: ReactNode;
  /** How long to hold, in milliseconds. */
  duration?: number;
  /** Ink, or red for deleting. */
  tone?: keyof typeof FILL;
  icon?: ReactNode;
  onConfirm?: () => void;
  className?: string;
};

export function HoldButton({ children, done = "Done", duration = 1400, tone = "ink", icon, onConfirm, className }: HoldButtonProps) {
  const progress = useMotionValue(0);
  const clip = useTransform(progress, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  const [confirmed, setConfirmed] = useState(false);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const hint = useId();

  const hold = () => {
    if (confirmed) return;
    run.current?.stop();
    run.current = animate(progress, 1, {
      duration: (duration / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        setConfirmed(true);
        onConfirm?.();
      },
    });
  };
  const release = () => {
    if (confirmed || progress.get() >= 1) return;
    run.current?.stop();
    run.current = animate(progress, 0, { type: "spring", stiffness: 260, damping: 30 });
  };

  // Once confirmed, it comes back to rest after a moment, ready again.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      run.current = animate(progress, 0, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
    }, 2200);
    return () => clearTimeout(t);
  }, [confirmed, progress]);

  const label = (
    <>
      {icon}
      {children}
    </>
  );
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
            "relative isolate inline-flex h-11 shrink-0 touch-none select-none items-center overflow-hidden rounded-full bg-[var(--bd-surface)] text-sm font-medium text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] transition-[scale] duration-200 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
            className,
          )}
        >
          <span className="flex items-center gap-2 px-5">{label}</span>
          {/* The same label in reverse, on the fill, cut to how far the hold has come. */}
          <motion.span aria-hidden style={{ clipPath: clip }} className={cx("absolute inset-0 flex items-center gap-2 px-5", FILL[tone])}>
            {label}
          </motion.span>
          <AnimatePresence>
            {confirmed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cx("absolute inset-0 flex items-center justify-center gap-2", FILL[tone])}>
                <motion.span initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 520, damping: 22 }} className="grid place-items-center">
                  <CheckIcon weight="bold" />
                </motion.span>
                {done}
              </motion.span>
            )}
          </AnimatePresence>
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
