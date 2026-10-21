"use client";

import { useState, type ComponentProps } from "react";

/*
 * A longer field that grows with what's typed into it, pressed into the page like the input. Give
 * it a limit and it counts as you type, on a small ring that fills, turning amber near the end
 * and red past it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type TextareaProps = ComponentProps<"textarea"> & { showCount?: boolean };

export function Textarea({ className, maxLength, showCount = false, value, defaultValue, onChange, ...props }: TextareaProps) {
  const [typed, setTyped] = useState(String(defaultValue ?? "").length);
  const count = value !== undefined ? String(value).length : typed;
  const counting = showCount && !!maxLength;
  const share = counting ? Math.min(1, count / maxLength) : 0;
  const tone = share >= 1 ? "var(--bd-ui-stop)" : share > 0.85 ? "var(--bd-ui-wait)" : "var(--bd-fg)";
  return (
    <span
      className={cx(
        "flex w-full flex-col rounded-[20px] bg-[var(--bd-surface-2)] text-sm text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
        "focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)] has-[:disabled]:opacity-50",
        className,
      )}
    >
      <textarea
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={(e) => {
          setTyped(e.target.value.length);
          onChange?.(e);
        }}
        className="max-h-[240px] min-h-[96px] w-full resize-none bg-transparent px-4 pb-2 pt-3.5 leading-relaxed outline-none [field-sizing:content] placeholder:text-[var(--bd-subtle)]"
        {...props}
      />
      {counting && (
        <span className="flex items-center justify-end gap-2 px-4 pb-3 text-[11px] tabular-nums text-[var(--bd-subtle)]">
          {count} of {maxLength}
          <svg viewBox="0 0 16 16" className="size-3.5 -rotate-90" aria-hidden>
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgb(var(--bd-ink) / 0.12)" strokeWidth="2" />
            <circle cx="8" cy="8" r="6" fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${share * 37.7} 37.7`} className="transition-[stroke-dasharray,stroke] duration-300" />
          </svg>
        </span>
      )}
    </span>
  );
}
