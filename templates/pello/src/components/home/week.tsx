"use client";

import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";

/*
 * Hannah's week, before pello and with it. The switch moves her calendar from one to the other:
 * the admin folds away, meetings that stay slide to their new times, and time with people fills
 * the gaps. The hours on the side count to the new totals.
 */

type Kind = "admin" | "people" | "fixed" | "pello";
interface Block {
  id: string;
  day: number;
  start: number;
  len: number;
  text: string;
  kind: Kind;
}

const b = (id: string, day: number, start: number, len: number, text: string, kind: Kind): Block => ({ id, day, start, len, text, kind });

const FIXED = [b("lead", 0, 10, 1, "Leadership meeting", "fixed"), b("standup", 2, 9, 1, "People team standup", "fixed")];

const BEFORE: Block[] = [
  ...FIXED,
  b("inbox-mon", 0, 9, 1, "Leave requests inbox", "admin"),
  b("sheet", 0, 11, 2, "Fix the payroll sheet", "admin"),
  b("slack", 0, 13.5, 1, "Policy questions in Slack", "admin"),
  b("laptop", 0, 15, 1.5, "Chase IT for Leo's laptop", "admin"),
  b("hours", 1, 9, 1.5, "Copy hours into payroll", "admin"),
  b("iris", 1, 11, 1, "1:1 with Iris", "people"),
  b("offers", 1, 13, 2, "Offer letters", "admin"),
  b("benefits", 1, 15.5, 1.5, "Benefits questions", "admin"),
  b("receipts", 2, 10.5, 2, "Expense receipts", "admin"),
  b("interview", 2, 14, 1, "Interview: Staff Designer", "people"),
  b("checklists", 2, 15.5, 1.5, "Onboarding checklists", "admin"),
  b("changes", 3, 9, 2, "Payroll changes for Arjun", "admin"),
  b("calendar", 3, 11.5, 1, "Update the leave calendar", "admin"),
  b("contracts", 3, 14, 2, "Contract updates", "admin"),
  b("inbox-fri", 4, 9.5, 1, "Leave requests inbox", "admin"),
  b("checks", 4, 11, 1.5, "Check payroll by hand", "admin"),
  b("lunch", 4, 12.5, 1, "Team lunch", "people"),
  b("report", 4, 15, 1.5, "Weekly report", "admin"),
];

const AFTER: Block[] = [
  ...FIXED,
  ...[0, 1, 3, 4].map((d) => b(`flags-${d}`, d, 9, 0.5, "pello's flagged items", "pello")),
  b("flags-2", 2, 10, 0.5, "pello's flagged items", "pello"),
  b("hiring", 0, 11, 1.5, "Hiring plan with Oliver", "people"),
  b("tom", 0, 14, 1, "1:1 with Tom", "people"),
  b("offsite", 0, 15.5, 1.5, "Plan the team offsite", "people"),
  b("iris", 1, 10, 1, "1:1 with Iris", "people"),
  b("training", 1, 11.5, 2, "Manager training", "people"),
  b("careers", 1, 14.5, 1.5, "Career talks", "people"),
  b("interview", 2, 11, 1, "Interview: Staff Designer", "people"),
  b("starters", 2, 12.5, 1.5, "Lunch with new starters", "people"),
  b("survey", 2, 15, 1.5, "Engagement survey results", "people"),
  b("comp", 3, 10, 2, "Pay review with Arjun", "people"),
  b("mei", 3, 13.5, 1, "Coffee with Mei", "people"),
  b("leo", 3, 15, 1, "Check in with Leo", "people"),
  b("approve", 4, 10, 0.5, "Approve payroll", "pello"),
  b("lunch", 4, 12.5, 1, "Team lunch", "people"),
  b("focus", 4, 14, 2.5, "Time to think", "people"),
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOUR = 54;
const FROM = 9;
const TO = 17;

const hours = (list: Block[], kinds: Kind[]) => list.filter((x) => kinds.includes(x.kind)).reduce((n, x) => n + x.len, 0);

const KIND: Record<Kind, string> = {
  admin: "bg-sunken text-ink-2",
  people: "bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--pl-accent)]",
  fixed: "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)]",
  pello: "bg-ink text-page",
};

function Hours({ value }: { value: number }) {
  const v = useMotionValue(value);
  const text = useTransform(v, (n) => `${Math.round(n)}`);
  useEffect(() => {
    const a = animate(v, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [value, v]);
  return <motion.span className="tabular">{text}</motion.span>;
}

export function Week() {
  const [after, setAfter] = useState(false);
  const blocks = after ? AFTER : BEFORE;

  return (
    <section id="week" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead align="center" title="Hannah's week, before pello and after." lead="Hannah runs People at Fieldwork. Switch between the two to see where her week used to go, and where it goes now." />

        <div className="mt-12 flex justify-center">
          <LayoutGroup id="week-switch">
            <div role="radiogroup" aria-label="Hannah's week" className="flex rounded-full bg-surface p-1.5 shadow-[inset_0_0_0_1px_var(--pl-line)]">
              {[
                [false, "Before pello"],
                [true, "With pello"],
              ].map(([v, label]) => (
                <button key={String(v)} type="button" role="radio" aria-checked={after === v} onClick={() => setAfter(v as boolean)} className={cn("relative h-12 rounded-full px-6 text-[17px] font-medium transition-colors", after === v ? "text-page" : "text-ink-2 hover:text-ink")}>
                  {after === v && <motion.span layoutId="week-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                  <span className="relative">{label as string}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="overflow-x-auto rounded-[28px] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--pl-line)] sm:p-6">
            <div className="grid min-w-[720px] grid-cols-[48px_repeat(5,1fr)] gap-x-2">
              <span />
              {DAYS.map((d) => (
                <p key={d} className="pb-3 text-[16px] font-semibold text-ink">
                  {d}
                </p>
              ))}
              <div className="relative" style={{ height: (TO - FROM) * HOUR }}>
                {Array.from({ length: TO - FROM }, (_, i) => (
                  <span key={i} className="tabular absolute -translate-y-1/2 font-mono text-[15px] text-mute" style={{ top: i * HOUR + 2 }}>
                    {FROM + i}
                  </span>
                ))}
              </div>
              {DAYS.map((d, day) => (
                <div key={d} className="relative rounded-[14px] bg-page" style={{ height: (TO - FROM) * HOUR }}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {blocks
                      .filter((x) => x.day === day)
                      .map((x, i) => (
                        <motion.div
                          key={x.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1, transition: { delay: 0.12 + i * 0.05, type: "spring", stiffness: 380, damping: 30 } }}
                          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 32 }}
                          className={cn("absolute inset-x-1 overflow-hidden rounded-[10px] px-2.5 py-1 text-[15px] font-medium leading-[1.25]", KIND[x.kind])}
                          style={{ top: (x.start - FROM) * HOUR + 2, height: x.len * HOUR - 4 }}
                        >
                          {x.text}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <dl className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[24px] bg-surface p-6 shadow-[inset_0_0_0_1px_var(--pl-line)]">
              <dt className="flex items-center gap-2.5 text-[16px] text-ink-2">
                <span className="size-3 rounded-[4px] bg-sunken shadow-[inset_0_0_0_1px_var(--pl-line-strong)]" />
                Admin
              </dt>
              <dd className="mt-2 text-[52px] font-semibold leading-none tracking-[-0.05em] text-ink">
                <Hours value={hours(blocks, ["admin", "pello"])} /> <span className="text-[22px] tracking-[-0.02em] text-mute">hours</span>
              </dd>
            </div>
            <div className="rounded-[24px] bg-surface p-6 shadow-[inset_0_0_0_1px_var(--pl-line)]">
              <dt className="flex items-center gap-2.5 text-[16px] text-ink-2">
                <span className="size-3 rounded-[4px] bg-accent" />
                With people
              </dt>
              <dd className="mt-2 text-[52px] font-semibold leading-none tracking-[-0.05em] text-ink">
                <Hours value={hours(blocks, ["people"])} /> <span className="text-[22px] tracking-[-0.02em] text-mute">hours</span>
              </dd>
            </div>
            <p className="text-[16px] leading-[1.55] text-mute sm:col-span-2 lg:col-span-1">The dark blocks are pello&apos;s: the few things it sent her to decide, and approving payroll.</p>
          </dl>
        </div>
      </Container>
    </section>
  );
}
