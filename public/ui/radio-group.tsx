"use client";

import { motion, MotionConfig } from "motion/react";
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * One choice from a short list, each with a line on what it means. As rows, a dot pressed into
 * the page that fills with ink and sets a bead in its middle; as cards, the chosen card takes an
 * ink edge and lifts. The arrow keys move the choice and Tab leaves the group, as in any radio
 * group.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type Ctx = { value: string | undefined; pick: (v: string) => void; variant: "row" | "card"; disabled?: boolean };
const Group = createContext<Ctx | null>(null);

export type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Rows in a list, or cards that each carry more. */
  variant?: "row" | "card";
  /** Names the group for screen readers, when nothing on the page labels it. */
  label?: string;
  /** With a name, a hidden input carries the choice in a form. */
  name?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

export function RadioGroup({ value, defaultValue, onValueChange, variant = "row", label, name, disabled, className, children, ...aria }: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const radios = () => [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)') ?? [])];
  const pick = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  // With nothing chosen yet, the first choice is where Tab lands.
  useLayoutEffect(() => {
    const all = radios();
    if (all.length && !all.some((r) => r.tabIndex === 0)) all[0].tabIndex = 0;
  });
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const all = radios();
    const at = all.findIndex((r) => r === document.activeElement);
    const next = all[(at + step + all.length) % all.length];
    if (!next) return;
    next.focus();
    pick(next.dataset.value!);
  };
  return (
    <MotionConfig reducedMotion="user">
      <Group.Provider value={{ value: current, pick, variant, disabled }}>
        <div ref={root} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} onKeyDown={onKey} className={cx("grid", variant === "card" ? "gap-2.5" : "gap-0.5", className)} {...aria}>
          {children}
        </div>
        {name && <input type="hidden" name={name} value={current ?? ""} disabled={disabled} />}
      </Group.Provider>
    </MotionConfig>
  );
}

export type RadioGroupItemProps = {
  value: string;
  label: ReactNode;
  /** A line on what choosing it means. */
  description?: ReactNode;
  /** Something on the right of a card: a price, a count. */
  aside?: ReactNode;
  /** An icon before the label, on cards. */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** The dot: a well that fills with ink, a bead in the ink's text color springing into its middle. */
function Dot({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cx("relative grid size-[18px] shrink-0 place-items-center rounded-full transition-[background-color,box-shadow] duration-200", on ? "[background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.22)]" : "bg-[var(--bd-ui-field)] shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.2)]")}>
      <motion.span initial={false} animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 620, damping: 30 }} className="size-[7px] rounded-full bg-[var(--bd-ui-ink-text)] shadow-[0_1px_1px_rgb(var(--bd-shade)/0.3)]" />
    </span>
  );
}

export function RadioGroupItem({ value, label, description, aside, icon, disabled, className }: RadioGroupItemProps) {
  const ctx = useContext(Group);
  const id = useId();
  if (!ctx) throw new Error("RadioGroupItem goes inside a RadioGroup.");
  const on = ctx.value === value;
  const off = disabled || ctx.disabled;
  const card = ctx.variant === "card";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-description` : undefined}
      tabIndex={on ? 0 : -1}
      disabled={off}
      data-value={value}
      onClick={() => ctx.pick(value)}
      className={cx(
        "group flex w-full items-start gap-3 text-left text-sm transition-[background-color,box-shadow,translate] duration-200 ease-[var(--bd-ease)] disabled:cursor-not-allowed disabled:opacity-45",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
        card
          ? cx(
              "rounded-[18px] p-4",
              on
                ? "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.82),0_10px_24px_-14px_rgb(var(--bd-shade)/0.35)]"
                : "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] hover:shadow-[inset_0_0_0_1px_var(--bd-line-strong),var(--bd-shadow-resting)]",
            )
          : "rounded-[14px] px-3 py-2.5 hover:bg-[rgb(var(--bd-ink)/0.035)]",
        className,
      )}
    >
      <span className={card ? "mt-[3px]" : "mt-px"}>
        <Dot on={on} />
      </span>
      {card && icon && <span className="mt-px flex shrink-0 text-[var(--bd-muted)] [&_svg]:size-[18px]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span id={`${id}-label`} className="block font-medium leading-5 text-[var(--bd-fg)]">
          {label}
        </span>
        {description && (
          <span id={`${id}-description`} className="mt-0.5 block text-[13px] leading-[1.45] text-[var(--bd-muted)]">
            {description}
          </span>
        )}
      </span>
      {aside && <span className="shrink-0 text-[13px] font-medium tabular-nums text-[var(--bd-fg)]">{aside}</span>}
    </button>
  );
}
