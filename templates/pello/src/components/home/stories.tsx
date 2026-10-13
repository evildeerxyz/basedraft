"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Container } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

/*
 * After the day, the companies that have days like it, on ink. One person is printed big beside
 * what they said; under the quote, every company's result as a ledger. Pick a row and its person
 * develops in the frame.
 */

export function Stories() {
  const [at, setAt] = useState(0);
  const s = STORIES[at];
  return (
    <section id="stories" className="scroll-mt-24 bg-night text-night-ink">
      <Container className="py-24 lg:py-32">
        <h2 className="max-w-[860px] text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em]">Fieldwork is one company. 1,200 more have days like it.</h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-16">
          <figure className="lg:sticky lg:top-24 lg:self-start">
            <Dithered key={s.slug} src={customerPhoto(s.name)} alt={s.name} inks={["night", "mute", "page"]} cell={2} focus={[0.5, 0.28]} className="aspect-[4/5] w-full rounded-[14px] max-lg:max-h-[520px]" />
            <figcaption className="mt-4 text-[15px] text-night-mute">
              <span className="font-medium text-night-ink">{s.name}</span>, {s.role} at {s.company}
            </figcaption>
          </figure>

          <div className="flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <motion.blockquote key={s.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mb-12 text-pretty text-[clamp(1.6rem,2.6vw,2.25rem)] font-medium leading-[1.25] tracking-[-0.035em]">
                &ldquo;{s.quote}&rdquo;
              </motion.blockquote>
            </AnimatePresence>

            <div role="radiogroup" aria-label="Customer stories" className="mt-auto border-t border-night-line">
              {STORIES.map((x, i) => {
                const on = i === at;
                return (
                  <button key={x.slug} type="button" role="radio" aria-checked={on} onClick={() => setAt(i)} className={cn("grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-b border-night-line py-4 text-left transition-colors sm:grid-cols-[170px_130px_minmax(0,1fr)]", on ? "text-night-ink" : "text-night-mute hover:text-night-ink")}>
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-medium">{x.company}</span>
                      <span className="block truncate text-[15px] text-night-mute">{x.what}</span>
                    </span>
                    <span className={cn("tabular text-right font-mono text-[28px] font-medium leading-none tracking-[-0.05em] sm:text-left", on && "text-accent")}>{x.result}</span>
                    <span className="col-span-2 text-[15px] leading-[1.4] sm:col-span-1">{x.resultLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
