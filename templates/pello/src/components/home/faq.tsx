"use client";

import { PlusIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Band, SectionHead } from "@/components/site/ui";

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
    <Band rule id="faq" inner="py-20 lg:py-28">
      <SectionHead title="Questions, answered by a person" lead="And if yours isn't here, write to hello@pello.example. A person answers that too." />
      <ul className="mx-auto mt-12 max-w-[820px]">
        {QUESTIONS.map((x, i) => {
          const on = open === i;
          return (
            <li key={x.q} className="shadow-[0_1px_0_var(--pl-line-strong)]">
              <h3>
                <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} aria-controls={`faq-${i}`} className="group flex w-full items-center justify-between gap-6 py-5 text-left">
                  <span className="text-[18px] font-semibold text-ink">{x.q}</span>
                  <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} className="grid size-8 shrink-0 place-items-center rounded-full text-ink transition-colors group-hover:bg-surface">
                    <PlusIcon size={18} />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 36 }} className="overflow-hidden">
                    <p className="max-w-[680px] pb-6 text-[17px] leading-[1.6] text-mute">{x.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}
