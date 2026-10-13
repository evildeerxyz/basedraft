"use client";

import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";

export interface Step {
  title: string;
  body: ReactNode;
  meta?: string;
}

/**
 * Steps on one side, a live visual on the other. Plays through on its own while
 * on screen, pauses on hover or focus, and every step is a real tab you can pick.
 */
export function Stepper({
  steps,
  children,
  duration = 5.5,
  className,
  stageClassName,
}: {
  steps: Step[];
  children: (active: number) => ReactNode;
  duration?: number;
  className?: string;
  stageClassName?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const pausedRef = useRef(paused);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);

  useEffect(() => {
    progress.set(0);
    if (!inView || reduce) return;
    const c = animate(progress, 1, { duration, ease: "linear", onComplete: () => setActive((a) => (a + 1) % steps.length) });
    if (pausedRef.current) c.pause();
    controls.current = c;
    return () => c.stop();
  }, [active, inView, reduce, duration, steps.length, progress]);

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + steps.length) % steps.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div
      ref={ref}
      className={cn("grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div role="tablist" aria-orientation="vertical" aria-label="Steps" onKeyDown={onKey} className="order-2 space-y-2 lg:order-1">
        {steps.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn("relative block w-full rounded-[20px] py-5 pl-7 pr-5 text-left transition-colors", on ? "bg-white/[0.045]" : "hover:bg-white/[0.025]")}
            >
              <span aria-hidden className="absolute bottom-5 left-0 top-5 w-[3px] overflow-hidden rounded-full bg-white/[0.08]">
                {on && <motion.span className="absolute inset-0 origin-top rounded-full bg-lime" style={{ scaleY: reduce ? 1 : progress }} />}
              </span>
              {s.meta && <span className={cn("mb-1 block text-[16px] font-medium", on ? "text-accent" : "text-white/55")}>{s.meta}</span>}
              <span className={cn("block text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-[1.1] tracking-[-0.035em] transition-colors", on ? "text-white" : "text-white/50")}>
                {s.title}
              </span>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.span
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    className="block overflow-hidden"
                  >
                    <span className="block pt-3 text-[17px] leading-relaxed text-white/70 sm:text-[18px]">{s.body}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className={cn("relative order-1 min-h-[380px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-ink-2 lg:order-2 lg:min-h-[520px]", stageClassName)}
      >
        {children(active)}
      </div>
    </div>
  );
}
