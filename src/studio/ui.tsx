"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import type { IconType } from "@/site/icons";
import { Tip } from "@/site/keys";

/** A collapsible inspector group: icon, title, an optional action, then its controls. */
export function Group({ title, icon: Icon, aside, children, defaultOpen = true }: { title: string; icon?: IconType; aside?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-line last:border-0">
      <div className="flex h-10 items-center justify-between gap-2 pl-2 pr-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[8px] px-2 text-left text-[13px] font-semibold transition-colors hover:bg-fg/[0.04]">
          <CaretDownIcon size={10} weight="bold" className={cn("shrink-0 text-subtle transition-transform", !open && "-rotate-90")} />
          {Icon && <Icon size={15} weight="duotone" className="shrink-0 text-accent" />}
          <span className="truncate">{title}</span>
        </button>
        {aside}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="overflow-hidden">
            <div className="space-y-4 px-4 pb-4 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** A label above a control, in the inspector's 12px voice. */
export function Row({ label, htmlFor, aside, children }: { label: string; htmlFor?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} id={htmlFor ? `${htmlFor}-label` : undefined} className="text-[12px] text-muted">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** An icon button with a tooltip naming it, and its shortcut as keys when it has one. */
export function Tool({ label, keys, onClick, disabled, children, active, className, side = "bottom" }: { label: string; keys?: string; onClick: () => void; disabled?: boolean; children: ReactNode; active?: boolean; className?: string; side?: "top" | "bottom" }) {
  return (
    <Tip label={label} keys={keys} side={side}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={cn("grid size-8 shrink-0 place-items-center rounded-control transition-colors disabled:opacity-30", active ? "bg-fg/[0.08] text-fg" : "text-muted hover:bg-fg/[0.06] hover:text-fg", className)}
      >
        {children}
      </button>
    </Tip>
  );
}

/** Small segmented control for 2 to 5 options. */
export function Segments<T extends string | number>({ value, onChange, options, label, full }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; title?: string }>; label: string; full?: boolean }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label={label} className={cn("flex rounded-control bg-fg/[0.06] p-0.5", full ? "w-full" : "inline-flex")}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button key={String(o.value)} type="button" role="radio" aria-checked={on} title={o.title} onClick={() => onChange(o.value)} className={cn("relative h-7 flex-1 rounded-[8px] px-2 text-[12px] font-medium transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}>
              {on && <motion.span layoutId="seg" className="absolute inset-0 rounded-[8px] bg-raised shadow-[0_1px_2px_rgb(var(--bd-shade)/0.12),0_0_0_0.5px_rgb(var(--bd-ink)/0.06)]" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
              <span className="relative whitespace-nowrap">{o.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** Thin keyboard hint, e.g. ⌘Z. */
export { Key as Kbd } from "@/site/keys";
