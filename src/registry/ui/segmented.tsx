"use client";

import { LayoutGroup, motion, MotionConfig } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * One choice of a few, in a track machined into the page, the chosen one on a raised thumb that
 * slides to the next. The arrow keys move the choice, as they do in any radio group.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type SegmentedOption = { value: string; label: ReactNode; icon?: ReactNode };

export function Segmented({ options, value, defaultValue, onValueChange, label, size = "md", className }: { options: SegmentedOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; label: string; size?: "sm" | "md"; className?: string }) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const current = value ?? inner;
  const pick = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === current);
    const next = options[(i + step + options.length) % options.length];
    pick(next.value);
    track.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  };
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={id}>
        <div ref={track} role="radiogroup" aria-label={label} onKeyDown={onKey} className={cx("inline-flex w-fit items-center gap-0.5 rounded-full bg-[var(--bd-ui-track)] p-1 shadow-[var(--bd-ui-well)]", className)}>
          {options.map((o) => {
            const on = o.value === current;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                data-value={o.value}
                onClick={() => pick(o.value)}
                className={cx(
                  "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]",
                  size === "sm" ? "h-7 px-3 text-[12.5px] [&_svg]:size-3.5" : "h-9 px-4 text-sm [&_svg]:size-4",
                  on ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]",
                )}
              >
                {on && <motion.span layoutId="thumb" className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
                {o.icon && <span className="relative flex">{o.icon}</span>}
                <span className="relative">{o.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
