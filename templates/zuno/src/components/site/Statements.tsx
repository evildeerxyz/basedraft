"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/utils";

/** Editorial list: each claim is set large, its detail sits beside it. Spacing does the separating. */
export function Statements({ items }: { items: Array<{ title: string; body: ReactNode; meta?: string }> }) {
  return (
    <ul className="space-y-14 lg:space-y-20">
      {items.map((it, i) => (
        <motion.li
          key={it.title}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.04 }}
          className="grid gap-4 lg:grid-cols-12 lg:items-baseline lg:gap-10"
        >
          <h3 className="text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-balance lg:col-span-6">{it.title}</h3>
          <div className="lg:col-span-5 lg:col-start-8">
            {it.meta && <div className="mb-2 text-[16px] font-medium text-accent">{it.meta}</div>}
            <p className="text-[18px] leading-relaxed text-white/70 sm:text-[19px]">{it.body}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
