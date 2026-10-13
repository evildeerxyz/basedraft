"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/cn";
import { CHANGELOG } from "@/lib/content";
import { Section } from "@/components/site/ui";

const TAGS = ["All", "AI", "Tables", "Platform", "Security"] as const;
const TAG_COLOR: Record<string, string> = {
  AI: "var(--pink)",
  Tables: "var(--warn)",
  Platform: "var(--blue)",
  Security: "var(--ok)",
};

export function Timeline() {
  const [tag, setTag] = useState<(typeof TAGS)[number]>("All");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.6"] });
  const draw = useSpring(scrollYProgress, { stiffness: 100, damping: 24 });
  const entries = CHANGELOG.filter((entry) => tag === "All" || entry.tag === tag);

  return (
    <Section inner="py-16">
      <div role="tablist" aria-label="Filter releases" className="mb-12 flex w-fit flex-wrap gap-1 border border-line bg-surface p-1">
        {TAGS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tag === option}
            onClick={() => setTag(option)}
            className={cn("relative isolate h-8  px-4 text-[13px] transition-colors", tag === option ? "text-inverse-fg" : "text-ink-2 hover:text-ink")}
          >
            {tag === option && <motion.span layoutId="changelog-tag" className="absolute inset-0 -z-10 bg-inverse" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            {option}
          </button>
        ))}
      </div>

      <div ref={ref} className="relative">
        <div aria-hidden className="absolute bottom-0 left-[7px] top-2 w-px bg-line md:left-[187px]" />
        <motion.div aria-hidden style={{ scaleY: draw }} className="absolute bottom-0 left-[7px] top-2 w-px origin-top bg-accent md:left-[187px]" />
        <motion.ol layout className="grid gap-14">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.li
                key={entry.version}
                layout
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
                className="relative grid gap-4 pl-8 md:grid-cols-[180px_1fr] md:gap-10 md:pl-0"
              >
                <div className="md:text-right md:pr-6">
                  <span className="block font-mono text-[13px] text-ink">v{entry.version}</span>
                  <span className="block text-[13px] text-ink-3">{entry.date}</span>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}
                  className="absolute left-0 top-1 size-[15px] border-[3px] border-page md:left-[180px]"
                  style={{ background: TAG_COLOR[entry.tag] }}
                />
                <article className="border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong md:ml-6">
                  <span className="px-2.5 py-0.5 font-mono text-[10.5px]" style={{ color: TAG_COLOR[entry.tag], background: `color-mix(in oklab, ${TAG_COLOR[entry.tag]} 14%, transparent)` }}>
                    {entry.tag}
                  </span>
                  <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-ink">{entry.title}</h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{entry.body}</p>
                </article>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ol>
      </div>
    </Section>
  );
}
