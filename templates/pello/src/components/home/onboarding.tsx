"use client";

import { ArrowCounterClockwiseIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/site/logo";
import { Avatar, Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf, type Person } from "@/lib/people";

/*
 * Leo's first day, from the weeks before it. When the section comes into view, the list works
 * itself through: each task is ticked off by pello or by the person it belongs to.
 */

const LEO = personOf("leo");
const OLIVER = personOf("oliver");
const CLARA = personOf("clara");

type By = "pello" | Person;
const GROUPS: Array<{ when: string; date: string; tasks: Array<{ text: string; by: By; at: string }> }> = [
  {
    when: "Two weeks before",
    date: "Oct 19",
    tasks: [
      { text: "Contract signed", by: LEO, at: "09:12" },
      { text: "Right to work checked", by: "pello", at: "09:13" },
      { text: "Payroll and pension set up", by: "pello", at: "09:15" },
    ],
  },
  {
    when: "One week before",
    date: "Oct 26",
    tasks: [
      { text: "Laptop ordered and shipped to his flat", by: "pello", at: "08:40" },
      { text: "Accounts made for Google, Slack, GitHub and Linear", by: "pello", at: "08:41" },
      { text: "Clara picked as his buddy", by: OLIVER, at: "11:02" },
    ],
  },
  {
    when: "The Friday before",
    date: "Oct 30",
    tasks: [
      { text: "Welcome note from Oliver", by: OLIVER, at: "16:20" },
      { text: "First week booked into his calendar", by: "pello", at: "16:21" },
      { text: "Desk 4.12 in the London office", by: "pello", at: "16:21" },
    ],
  },
  {
    when: "Day one",
    date: "Nov 2",
    tasks: [
      { text: "Laptop set up with Clara", by: CLARA, at: "09:30" },
      { text: "First handbook questions answered", by: "pello", at: "10:05" },
      { text: "Lunch with the team", by: OLIVER, at: "12:30" },
    ],
  },
];
const TOTAL = GROUPS.reduce((n, g) => n + g.tasks.length, 0);
/** Where each group's tasks start, counting from the first. */
const FIRST = GROUPS.map((_, i) => GROUPS.slice(0, i).reduce((n, g) => n + g.tasks.length, 0));

function Who({ by }: { by: By }) {
  if (by === "pello")
    return (
      <span className="flex items-center gap-2 text-[15px] text-mute">
        <span className="grid size-7 place-items-center rounded-full bg-ink">
          <Mark size={16} className="text-page" />
        </span>
        <span className="max-sm:hidden">pello</span>
      </span>
    );
  return (
    <span className="flex items-center gap-2 text-[15px] text-mute">
      <Avatar person={by} size={28} />
      <span className="max-sm:hidden">{by.name.split(" ")[0]}</span>
    </span>
  );
}

function Ring({ done }: { done: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[88px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--pl-night-line)" strokeWidth="6" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke="var(--pl-accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - done / TOTAL) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </svg>
      <span className="tabular absolute inset-0 grid place-items-center text-[20px] font-semibold tracking-[-0.03em] text-night-ink">{Math.round((done / TOTAL) * 100)}%</span>
    </div>
  );
}

export function Onboarding() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.3, once: true });
  const [done, setDone] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!seen || done >= TOTAL) return;
    const t = setTimeout(() => setDone((d) => d + 1), done === 0 ? 500 : 420);
    return () => clearTimeout(t);
  }, [seen, done, run]);

  return (
    <section id="onboarding" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead title="Leo starts Monday. Everything is ready." lead="Contract, laptop, accounts, a buddy and a first week plan. pello works through the list in the weeks before, and leaves the parts that need a person to that person." />
        <div ref={ref} className="mt-16 grid gap-6 lg:grid-cols-[380px_1fr] lg:gap-10">
          <div className="self-start rounded-[28px] bg-ink p-7 text-page lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-4">
              <Avatar person={LEO} size={64} />
              <span className="rounded-full bg-night-2 px-3 py-1 text-[15px] font-medium text-night-ink">New starter</span>
            </div>
            <p className="mt-6 text-[30px] font-semibold leading-tight tracking-[-0.035em]">{LEO.name}</p>
            <p className="mt-1 text-[17px] text-night-mute">
              {LEO.role}, {LEO.location}
            </p>
            <dl className="mt-8 grid gap-4 text-[16px]">
              {[
                ["Starts", "Monday, November 2"],
                ["Manager", OLIVER.name],
                ["Buddy", CLARA.name],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-night-mute">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex items-center gap-5 rounded-[20px] bg-night-2 p-4">
              <Ring done={done} />
              <div>
                <p className="tabular text-[19px] font-semibold">
                  {done} of {TOTAL} done
                </p>
                <p className="mt-0.5 text-[15px] text-night-mute">{done >= TOTAL ? "Ready for day one" : "Working through it"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDone(0);
                setRun((r) => r + 1);
              }}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-medium text-night-ink shadow-[inset_0_0_0_1px_var(--pl-night-line)] transition-colors hover:bg-night-2"
            >
              <ArrowCounterClockwiseIcon size={17} />
              Run it again
            </button>
          </div>

          <ol className="grid gap-4">
            {GROUPS.map((g, gi) => (
              <li key={g.when} className="rounded-[28px] bg-surface p-3 shadow-[inset_0_0_0_1px_var(--pl-line)]">
                <div className="flex items-baseline justify-between px-4 pb-2 pt-3">
                  <p className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{g.when}</p>
                  <p className="tabular text-[16px] text-mute">{g.date}</p>
                </div>
                <ul>
                  {g.tasks.map((t, ti) => {
                    const i = FIRST[gi] + ti;
                    const on = i < done;
                    return (
                      <li key={t.text} className={cn("flex items-center gap-4 rounded-[18px] px-4 py-3.5 transition-colors duration-500", on && i === done - 1 && "bg-accent-soft")}>
                        <motion.span initial={false} animate={on ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.4 }} className={cn("grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300", on ? "bg-good text-white" : "shadow-[inset_0_0_0_2px_var(--pl-line-strong)]")}>
                          {on && <CheckIcon size={15} weight="bold" />}
                        </motion.span>
                        <span className={cn("min-w-0 flex-1 text-[17px] transition-colors duration-300", on ? "text-ink" : "text-mute")}>{t.text}</span>
                        <span className={cn("tabular font-mono text-[15px] text-mute transition-opacity duration-300 max-sm:hidden", on ? "opacity-100" : "opacity-0")}>{t.at}</span>
                        <Who by={t.by} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
