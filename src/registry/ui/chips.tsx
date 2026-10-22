"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * Filters as a row of chips. Turning one on fills it with ink as a check springs in at its front,
 * the chip easing wider to make room while the rest slide along; its count stays beside it.
 * Several can be on at once, or just one. A long row folds its tail into a "+N" chip, any that
 * are on stay in view, and a Clear appears once anything is on.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type ChipOption = {
  value: string;
  label: string;
  /** How many there are of it, beside its name. */
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
};

export type ChipsProps = {
  options: ChipOption[];
  /** What's on. Leave it out and the chips keep it, starting from defaultValue. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Several on at once, or one at a time. */
  multiple?: boolean;
  /** How many chips show before the rest fold into "+N". */
  max?: number;
  /** Shows Clear once anything is on. */
  clearable?: boolean;
  /** What the chips choose, for a screen reader. */
  label: string;
  size?: "sm" | "md";
  className?: string;
};

const SIZES = { sm: "h-7 gap-1.5 px-3 text-[12.5px]", md: "h-8 gap-1.5 px-3.5 text-[13px]" } as const;
const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]";

export function Chips({ options, value, defaultValue = [], onValueChange, multiple = true, max, clearable = true, label, size = "md", className }: ChipsProps) {
  const [inner, setInner] = useState(defaultValue);
  const on = value ?? inner;
  const [open, setOpen] = useState(false);
  const still = useReducedMotion();
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  const set = (next: string[]) => {
    if (!value) setInner(next);
    onValueChange?.(next);
  };
  const toggle = (v: string) => set(multiple ? (on.includes(v) ? on.filter((x) => x !== v) : [...on, v]) : on[0] === v ? [] : [v]);
  // Folded, the first few show, and any that are on stay in view wherever they sit.
  const folded = max != null && !open && options.length > max;
  const shown = folded ? options.filter((o, i) => i < max! || on.includes(o.value)) : options;
  const hidden = options.length - shown.length;
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 38 };

  // One at a time, the chips are radios: arrows move and choose, and Tab stops once.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (multiple) return;
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const all = [...(row.current?.querySelectorAll<HTMLButtonElement>("[role=radio]:not(:disabled)") ?? [])];
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    const next = all[(at + step + all.length) % all.length];
    next?.focus();
    if (next?.dataset.value) set([next.dataset.value]);
  };
  const stop = multiple ? null : (on[0] ?? shown.find((o) => !o.disabled)?.value);

  return (
    <LayoutGroup id={id}>
      <div ref={row} role={multiple ? "group" : "radiogroup"} aria-label={label} onKeyDown={onKey} className={cx("flex flex-wrap items-center gap-2", className)}>
        {shown.map((o) => {
          const picked = on.includes(o.value);
          return (
            <motion.button
              key={o.value}
              layout="position"
              transition={spring}
              type="button"
              data-value={o.value}
              disabled={o.disabled}
              {...(multiple ? { "aria-pressed": picked } : { role: "radio", "aria-checked": picked, tabIndex: stop === o.value ? 0 : -1 })}
              onClick={() => toggle(o.value)}
              className={cx(
                "inline-flex shrink-0 items-center rounded-full font-medium transition-[background-color,color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5",
                SIZES[size],
                picked ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_4px_12px_-6px_rgb(var(--bd-shade)/0.5)]" : "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong)] hover:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.3)]",
                FOCUS,
              )}
            >
              <AnimatePresence initial={false}>
                {picked && (
                  <motion.span key="tick" initial={{ width: 0, opacity: 0, scale: 0.4 }} animate={{ width: 14, opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0.4 }} transition={spring} className="-mr-0.5 grid shrink-0 place-items-center overflow-hidden">
                    <CheckIcon weight="bold" className="!size-3" />
                  </motion.span>
                )}
              </AnimatePresence>
              {o.icon && <span className={cx("grid place-items-center", picked ? "" : "text-[var(--bd-muted)]")}>{o.icon}</span>}
              <span className="whitespace-nowrap">{o.label}</span>
              {o.count != null && <span className={cx("tabular-nums font-normal", picked ? "opacity-65" : "text-[var(--bd-subtle)]")}>{o.count.toLocaleString("en-US")}</span>}
            </motion.button>
          );
        })}
        {max != null && options.length > max && (
          <motion.button
            layout="position"
            transition={spring}
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((x) => !x)}
            className={cx("inline-flex shrink-0 items-center rounded-full font-medium text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]", SIZES[size], FOCUS)}
          >
            {open ? "Fewer" : `+${hidden}`}
          </motion.button>
        )}
        <AnimatePresence initial={false}>
          {clearable && multiple && on.length > 0 && (
            <motion.button
              key="clear"
              layout="position"
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
              transition={spring}
              onClick={() => {
                set([]);
                row.current?.querySelector<HTMLButtonElement>("button")?.focus();
              }}
              className={cx("inline-flex shrink-0 items-center rounded-full text-[var(--bd-muted)] transition-colors hover:text-[var(--bd-fg)]", SIZES[size], FOCUS)}
            >
              <XIcon weight="regular" />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
