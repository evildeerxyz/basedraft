"use client";

import { motion, MotionConfig } from "motion/react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

/*
 * A box pressed into the page that fills with ink when it's ticked, the tick drawing itself in as
 * it does. Half on, for a list where some are ticked and some aren't, it shows a short ink bar
 * instead. CheckboxRow sets one at the start of a row with its label and a line under it, and the
 * whole row is what you click.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/** On, off, or half on: some of the things it stands for are ticked, not all. */
export type CheckedState = boolean | "indeterminate";

const SIZES = {
  sm: { box: 16, radius: 5, stroke: 2.2 },
  md: { box: 20, radius: 6, stroke: 2 },
} as const;

const DRAW = { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as const;

export type CheckboxProps = Omit<ComponentProps<"button">, "onChange" | "value" | "defaultChecked"> & {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  /** Called with the new state each time it's clicked. From half on, a click ticks it. */
  onCheckedChange?: (checked: boolean) => void;
  size?: keyof typeof SIZES;
  /** With a name, a hidden input carries it in a form while it's ticked. */
  name?: string;
  value?: string;
};

export function Checkbox({ checked, defaultChecked = false, onCheckedChange, size = "md", name, value = "on", className, disabled, onClick, style, ...props }: CheckboxProps) {
  const [inner, setInner] = useState<CheckedState>(defaultChecked);
  const state = checked ?? inner;
  const on = state === true;
  const mixed = state === "indeterminate";
  const s = SIZES[size];
  return (
    <MotionConfig reducedMotion="user">
      <>
        <button
          type="button"
          role="checkbox"
          aria-checked={mixed ? "mixed" : on}
          disabled={disabled}
          onClick={(e) => {
            onClick?.(e);
            if (e.defaultPrevented) return;
            setInner(!on);
            onCheckedChange?.(!on);
          }}
          className={cx(
            "relative inline-grid shrink-0 place-items-center transition-[background-color,box-shadow,scale] duration-200 ease-[var(--bd-ease)] active:scale-[0.88] disabled:cursor-not-allowed disabled:opacity-45",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
            on || mixed
              ? "[background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.22)]"
              : "bg-[var(--bd-ui-field)] shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.2)] hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.34)]",
            className,
          )}
          style={{ width: s.box, height: s.box, borderRadius: s.radius, ...style }}
          {...props}
        >
          <svg viewBox="0 0 16 16" aria-hidden className="text-[var(--bd-ui-ink-text)]" style={{ width: s.box - 3, height: s.box - 3 }}>
            <motion.path d="M3.6 8.5 6.7 11.4 12.5 4.9" fill="none" stroke="currentColor" strokeWidth={s.stroke} strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={DRAW} />
            <motion.path d="M4.4 8h7.2" fill="none" stroke="currentColor" strokeWidth={s.stroke} strokeLinecap="round" initial={false} animate={{ pathLength: mixed ? 1 : 0, opacity: mixed ? 1 : 0 }} transition={DRAW} />
          </svg>
        </button>
        {name && <input type="hidden" name={name} value={value} disabled={!on || disabled} />}
      </>
    </MotionConfig>
  );
}

export type CheckboxRowProps = CheckboxProps & {
  label: ReactNode;
  /** A line under the label: what ticking it does. */
  description?: ReactNode;
};

/** A checkbox at the start of a row, with its label and a line under it. The whole row ticks it. */
export function CheckboxRow({ label, description, id, className, disabled, size = "md", ...props }: CheckboxRowProps) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <MotionConfig reducedMotion="user">
      <label
        htmlFor={cid}
        className={cx(
          "flex items-start gap-3 rounded-[16px] px-3 py-2.5 text-sm transition-colors duration-200",
          disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-[rgb(var(--bd-ink)/0.035)]",
          className,
        )}
      >
        <Checkbox id={cid} size={size} disabled={disabled} aria-labelledby={`${cid}-label`} aria-describedby={description ? `${cid}-description` : undefined} className={size === "sm" ? "mt-[2px]" : "mt-px"} {...props} />
        <span className={cx("min-w-0 flex-1", disabled && "opacity-50")}>
          <span id={`${cid}-label`} className="block font-medium leading-5 text-[var(--bd-fg)]">
            {label}
          </span>
          {description && (
            <span id={`${cid}-description`} className="mt-0.5 block text-[13px] leading-[1.45] text-[var(--bd-muted)]">
              {description}
            </span>
          )}
        </span>
      </label>
    </MotionConfig>
  );
}
