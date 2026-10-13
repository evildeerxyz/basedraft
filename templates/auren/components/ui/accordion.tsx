"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/site";

export function Accordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <ul className="border-t border-ink/12">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q} className="border-b border-ink/12">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center gap-6 py-6 text-left"
              >
                <span className="type-title flex-1 text-[clamp(1.15rem,1.8vw,1.4rem)]">{item.q}</span>
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                    isOpen ? "border-ink bg-ink text-paper" : "border-ink/15 group-hover:border-ink/40",
                  )}
                >
                  <PlusIcon size={14} weight="bold" className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[64ch] pb-7 pr-14 text-[16px] leading-[1.65] text-ink/65">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
