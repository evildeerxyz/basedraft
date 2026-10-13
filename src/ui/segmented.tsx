"use client";

import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";

/** A small segmented control, the selected option raised. */
export function Segmented<T extends string>({ value, onChange, options, label, id }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string; id: string }) {
  return (
    <LayoutGroup id={id}>
      <div role="tablist" aria-label={label} className="inline-flex rounded-control bg-fg/[0.06] p-0.5">
        {options.map((o) => (
          <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={cn("relative h-7 rounded-[5px] px-2.5 text-meta font-medium transition-colors", value === o.value ? "text-fg" : "text-muted hover:text-fg")}>
            {value === o.value && <motion.span layoutId="seg" className="absolute inset-0 rounded-[5px] bg-raised shadow-[0_1px_2px_rgb(var(--bd-shade)/0.12)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
