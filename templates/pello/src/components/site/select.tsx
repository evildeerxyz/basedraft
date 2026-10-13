"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

/*
 * pello's own dropdown, not the browser's: it opens with Enter, Space or the arrow keys, moves
 * with the arrows, jumps to an option by its first letter, and closes with Escape, Tab or a click
 * anywhere else. The focus ring is the accent, as everywhere on the page.
 */

export interface Option {
  value: string;
  label: string;
}

export function Select({ value, onChange, options, label, className, dark }: { value: string; onChange: (v: string) => void; options: Option[]; label: string; className?: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, options.findIndex((o) => o.value === value)));
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };
  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Tab") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return show();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else show();
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i < 0) return;
      if (open) setActive(i);
      else choose(i);
    }
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-[10px] px-3.5 text-left text-[15px] font-medium transition-shadow",
          dark ? "bg-night-2 text-night-ink shadow-[inset_0_0_0_1px_var(--pl-night-line)]" : "bg-page text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] hover:shadow-[inset_0_0_0_1px_var(--pl-ink-2)]",
          open && (dark ? "shadow-[inset_0_0_0_1.5px_var(--pl-night-ink)]" : "shadow-[inset_0_0_0_1.5px_var(--pl-ink)]"),
        )}
      >
        <span className="truncate">{current?.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} className={dark ? "text-night-mute" : "text-mute"}>
          <CaretDownIcon size={16} weight="bold" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute inset-x-0 top-full z-40 mt-1.5 max-h-[320px] origin-top overflow-y-auto rounded-[10px] p-1", dark ? "bg-night-2 text-night-ink shadow-[0_0_0_1px_var(--pl-night-line)]" : "pl-pop text-ink")}
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onPointerMove={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={cn("flex h-10 cursor-pointer items-center justify-between rounded-[8px] px-3 text-[15px]", i === active && (dark ? "bg-night-line" : "bg-sunken"))}
              >
                {o.label}
                {o.value === value && <CheckIcon size={15} weight="bold" className="text-ink" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
