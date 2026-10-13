"use client";

import { ChatsCircleIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { SectionTitle } from "../ui/Section";

const FAQS = [
  {
    q: "Is my money safe with Zuno?",
    a: "Your investments are held in your name at an independent, regulated custodian, not on Zuno's balance sheet. Securities are protected by SIPC up to $500,000 (including $250,000 for cash), and uninvested cash is swept to partner banks for FDIC insurance up to $2.5M. We never lend out your shares without your explicit opt-in.",
  },
  {
    q: "Does the AI trade without asking me?",
    a: "Only inside the rules you approve. Autopilot can rebalance, invest deposits and harvest losses within your chosen strategy. Anything outside those rules, like a new holding, a big withdrawal or a strategy change, is proposed by Copilot and waits for your tap.",
  },
  {
    q: "How does Zuno make money?",
    a: "From the subscription you choose, a share of the interest on cash, and a 0.5% spread on crypto trades. That's it. We don't take payment for order flow, sell your data, or push in-house funds.",
  },
  {
    q: "What can I invest in?",
    a: "6,000+ US stocks and ETFs with fractional shares from $1, Treasury bills and bond funds, and Bitcoin and Ethereum through a licensed partner. Retirement accounts (Traditional, Roth and SEP IRAs) are supported too.",
  },
  {
    q: "Can I withdraw whenever I want?",
    a: "Yes. There are no lock-ups or withdrawal fees. Sales settle in one business day and cash typically reaches your bank one to two days after that.",
  },
  {
    q: "Is Copilot financial advice?",
    a: "Copilot's recommendations come from Zuno Advisers LLC, an SEC-registered investment adviser, and are personalised to your accounts and goals. Like any advice, it can't predict markets. Investing always involves risk, including loss of principal.",
  },
];

export interface QA {
  q: string;
  a: string;
}

/** Accordion of questions; ids are namespaced so several lists can share a page. */
export function FAQList({ items, id = "faq" }: { items: QA[]; id?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/[0.08] border-b border-white/[0.08] lg:border-t">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                aria-expanded={isOpen}
                aria-controls={`${id}-panel-${i}`}
                id={`${id}-button-${i}`}
              >
                <span className={cn("text-[20px] font-medium tracking-[-0.02em] transition-colors sm:text-[23px]", isOpen ? "text-white" : "text-white/75 group-hover:text-white")}>{f.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn("grid size-10 shrink-0 place-items-center rounded-full transition-colors", isOpen ? "bg-lime text-on-lime" : "bg-white/[0.06] text-white")}
                >
                  <PlusIcon size={18} weight="bold" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                  className="overflow-hidden"
                  id={`${id}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${id}-button-${i}`}
                >
                  <p className="max-w-[700px] pb-8 pr-14 text-[18px] leading-relaxed text-white/70">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function FAQ({ items = FAQS, lead = "Questions,", tail = "answered.", note }: { items?: QA[]; lead?: string; tail?: string; note?: string }) {
  return (
    <section id="faq" className="relative mx-auto max-w-[1280px] scroll-mt-20 px-5 py-28 lg:px-8 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionTitle lead={lead} tail={tail} />
          <p className="mt-7 max-w-[380px] text-[19px] leading-relaxed text-white/70">Can&apos;t find what you need? Real humans reply in under five minutes, 24/7.</p>
          <Link href="/contact" className="mt-9 inline-flex h-14 items-center gap-2.5 rounded-[14px] border border-white/15 px-6 text-[17px] transition-colors hover:bg-white/5">
            <ChatsCircleIcon size={20} className="text-accent" /> Contact support
          </Link>
        </div>
        <div>
          <FAQList items={items} />
          {note && <p className="mt-8 max-w-[700px] text-[15px] leading-relaxed text-white/60">{note}</p>}
        </div>
      </div>
    </section>
  );
}
