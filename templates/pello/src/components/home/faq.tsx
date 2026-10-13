"use client";

import { PlusIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";

export const QUESTIONS = [
  { q: "Does pello make decisions on its own?", a: "Only the ones you let it. You set the rules for each kind of request. Anything outside them goes to the right person with a short summary, and every decision pello makes can be undone." },
  { q: "Where do its answers come from?", a: "From your own handbook, policies and contracts, which you upload or connect from Notion, Google Drive or Confluence. Each answer links to the passage it used. When it can't find one, it says so and asks a person." },
  { q: "Can it run payroll where we are?", a: "pello runs payroll itself in the US, the UK, Germany and Canada. Everywhere else, it connects to your payroll provider and sends them the month's changes." },
  { q: "How long does it take to set up?", a: "Most teams connect their HR data and handbook in an afternoon and go live within two weeks. We do the import with you, and your first payroll run side by side with your old one." },
  { q: "What happens to our data?", a: "It stays yours. It's encrypted, kept in the EU or the US, never used to train models for anyone else, and deleted within 30 days if you leave." },
  { q: "Do our people need another app?", a: "No. They ask in Slack, Teams or email. There's an app for those who want one, and for the People team." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 py-28 lg:py-36">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHead title="Questions, answered by a person." lead="And if yours isn't here, write to us at hello@pello.example. A person answers that too." />
        <ul>
          {QUESTIONS.map((x, i) => {
            const on = open === i;
            return (
              <li key={x.q} className="shadow-[0_1px_0_var(--pl-line-strong)] first:shadow-[0_-1.5px_0_var(--pl-ink),0_1px_0_var(--pl-line-strong)]">
                <h3>
                  <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} aria-controls={`faq-${i}`} className="group flex w-full items-baseline gap-5 py-6 text-left">
                    <span className="tabular w-7 shrink-0 font-mono text-[15px] text-mute">0{i + 1}</span>
                    <span className={cn("flex-1 font-display text-[clamp(1.7rem,2.4vw,2.2rem)] font-bold leading-[1.05] transition-colors", on ? "text-accent" : "text-ink group-hover:text-accent")}>{x.q}</span>
                    <span className={cn("grid size-10 shrink-0 place-items-center self-center rounded-[4px] transition-colors", on ? "bg-ink text-page" : "text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)]")}>
                      <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} className="grid place-items-center">
                        <PlusIcon size={18} weight="bold" />
                      </motion.span>
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 36 }} className="overflow-hidden">
                      <p className="max-w-[640px] pb-7 pl-12 text-[19px] leading-[1.6] text-ink-2">{x.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
