"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { motion, MotionConfig } from "motion/react";
import { Children, createContext, isValidElement, useContext, type ComponentProps, type ReactNode } from "react";

/*
 * The way through something in a few steps, for onboarding or a checkout: done steps inked with a
 * check, the current one raised with a ring that breathes, the rest pressed into the page. A line
 * runs from each step to the next and fills with ink once you're past it. Down the page, or across.
 * The current step is the one a screen reader calls current; each says whether it's done.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type State = "done" | "current" | "next";
type Orientation = "vertical" | "horizontal";
const StepContext = createContext<{ index: number; state: State; last: boolean; orientation: Orientation } | null>(null);

export type StepsProps = Omit<ComponentProps<"ol">, "children"> & {
  /** The step you're on, counting from 0. The ones before it are done; pass the number of steps for all done. */
  current: number;
  orientation?: Orientation;
  /** Step elements, in order. */
  children: ReactNode;
};

export function Steps({ current, orientation = "vertical", className, children, ...props }: StepsProps) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <MotionConfig reducedMotion="user">
      <ol className={cx(orientation === "vertical" ? "grid" : "flex w-full items-start", className)} {...props}>
        {steps.map((step, index) => (
          <StepContext.Provider key={index} value={{ index, state: index < current ? "done" : index === current ? "current" : "next", last: index === steps.length - 1, orientation }}>
            {step}
          </StepContext.Provider>
        ))}
      </ol>
    </MotionConfig>
  );
}

const MARKER: Record<State, string> = {
  done: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2)]",
  current: "text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1.5px_var(--bd-fg)]",
  next: "bg-[var(--bd-ui-field)] text-[var(--bd-subtle)] shadow-[var(--bd-ui-well)]",
};
const SAID: Record<State, string> = { done: "Done: ", current: "Current step: ", next: "Next: " };

export type StepProps = Omit<ComponentProps<"li">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Anything else under the step, like the action for the one you're on. */
  children?: ReactNode;
};

export function Step({ title, description, className, children, ...props }: StepProps) {
  const ctx = useContext(StepContext);
  if (!ctx) throw new Error("Step goes inside Steps.");
  const { index, state, last, orientation } = ctx;
  const vertical = orientation === "vertical";
  return (
    <MotionConfig reducedMotion="user">
      <li aria-current={state === "current" ? "step" : undefined} className={cx("relative", vertical ? "flex gap-4 pb-7 last:pb-0" : "flex min-w-0 flex-1 flex-col items-center px-1 text-center", className)} {...props}>
        <span className={cx("relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums transition-[background,box-shadow,color] duration-300", MARKER[state])}>
          {state === "current" && <span aria-hidden className="absolute inset-0 rounded-full bg-[rgb(var(--bd-ink)/0.14)] animate-[bd-ui-pulse_2.2s_ease-out_infinite] motion-reduce:hidden" />}
          {state === "done" ? <CheckIcon weight="bold" className="relative size-3.5" /> : <span className="relative">{index + 1}</span>}
        </span>
        {/* The line to the next step: a solid gray rail, filled with ink once this step is done. */}
        {!last && (
          <span aria-hidden className={cx("absolute overflow-hidden rounded-full bg-[var(--bd-ui-track)]", vertical ? "bottom-1 left-[13px] top-8 w-[2px]" : "left-[calc(50%+18px)] right-[calc(-50%+18px)] top-[13px] h-[2px]")}>
            <motion.span className={cx("absolute inset-0 bg-[var(--bd-fg)]", vertical ? "origin-top" : "origin-left")} initial={false} animate={vertical ? { scaleY: state === "done" ? 1 : 0 } : { scaleX: state === "done" ? 1 : 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} />
          </span>
        )}
        <div className={cx("min-w-0", vertical ? "pt-[3px]" : "mt-3")}>
          <p className={cx("text-sm font-medium transition-colors duration-300", state === "next" ? "text-[var(--bd-muted)]" : "text-[var(--bd-fg)]")}>
            <span className="sr-only">{SAID[state]}</span>
            {title}
          </p>
          {description && <p className="mt-1 text-[13px] leading-[1.5] text-[var(--bd-muted)]">{description}</p>}
          {children && <div className={cx("mt-3", !vertical && "flex justify-center")}>{children}</div>}
        </div>
      </li>
    </MotionConfig>
  );
}
