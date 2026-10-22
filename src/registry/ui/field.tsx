"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

/*
 * A control with its words around it: the label above (and a quiet "Optional" when it is), a hint
 * under it, and in the hint's place an error when there is one, which rises in and rims the
 * control in red. Give it a count and a limit and it keeps the tally on the right, turning amber
 * near the end and red past it. It wires the label, the hint and the error to whatever control is
 * inside: an Input, a Select, a Code input, a Textarea, or a plain input.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type FieldProps = {
  label: ReactNode;
  /** A line under the control: what to put in it, or what it's for. */
  hint?: ReactNode;
  /** What's wrong with what's in it. Shown in the hint's place, and marks the control invalid. */
  error?: ReactNode;
  /** Marks the control required for screen readers and adds a quiet mark by the label. */
  required?: boolean;
  /** Says "Optional" across from the label. */
  optional?: boolean;
  /** How much is in the control, to count against max. */
  count?: number;
  max?: number;
  /** The control's id; one is made if neither this nor the control has one. */
  id?: string;
  className?: string;
  /** One control. It gets the id, aria-describedby, aria-invalid and aria-required. */
  children: ReactElement<Record<string, unknown>>;
};

export function Field({ label, hint, error, required, optional, count, max, id, className, children }: FieldProps) {
  const auto = useId();
  const own = isValidElement(children) ? (children.props.id as string | undefined) : undefined;
  const cid = id ?? own ?? auto;
  const hintId = `${cid}-hint`;
  const errorId = `${cid}-error`;
  const counting = count !== undefined && max !== undefined;
  const share = counting ? count / max : 0;
  const describedBy = [error ? errorId : hint ? hintId : null, children.props["aria-describedby"] as string | undefined].filter(Boolean).join(" ") || undefined;
  const control = cloneElement(children, {
    id: cid,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : (children.props["aria-invalid"] ?? undefined),
    "aria-required": required || (children.props["aria-required"] ?? undefined),
  });
  return (
    <MotionConfig reducedMotion="user">
      <div className={cx("grid w-full", className)}>
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <label htmlFor={cid} className="text-sm font-medium text-[var(--bd-fg)]">
            {label}
            {required && (
              <span aria-hidden className="ml-1 text-[var(--bd-subtle)]">
                *
              </span>
            )}
          </label>
          {optional && <span className="text-xs text-[var(--bd-subtle)]">Optional</span>}
        </div>
        {control}
        {(hint || error || counting) && (
          <div className="mt-2 flex min-h-[18px] items-start justify-between gap-3 px-1 text-[12.5px] leading-[1.45]">
            <div aria-live="polite" className="min-w-0 flex-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {error ? (
                  <motion.p key="error" id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="flex items-start gap-1.5 text-[var(--bd-ui-stop)]">
                    <WarningCircleIcon size={14} weight="duotone" className="mt-[2px] shrink-0" />
                    <span>{error}</span>
                  </motion.p>
                ) : hint ? (
                  <motion.p key="hint" id={hintId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-[var(--bd-subtle)]">
                    {hint}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            {counting && (
              <span className={cx("shrink-0 tabular-nums transition-colors duration-200", share > 1 ? "text-[var(--bd-ui-stop)]" : share > 0.85 ? "text-[var(--bd-ui-wait)]" : "text-[var(--bd-subtle)]")}>
                {count} / {max}
              </span>
            )}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
