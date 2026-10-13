"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, SlackLogoIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Mark } from "@/components/site/logo";
import { Face, Moment, Tag, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { personOf } from "@/lib/people";

/*
 * 14:40. Ravi goes over the hours limit for the second week running. That isn't a rule's call, so
 * pello writes to Oliver with what he needs to know and three things it can do. Pick one and pello
 * does it, and says what it did.
 */

const RAVI = personOf("ravi");
const OLIVER = personOf("oliver");
const WEEK = [
  { day: "Mon", hours: 10 },
  { day: "Tue", hours: 11 },
  { day: "Wed", hours: 11.5 },
  { day: "Thu", hours: 10.5 },
  { day: "Fri", hours: 9 },
];
const TOTAL = WEEK.reduce((n, d) => n + d.hours, 0);
const LIMIT = 48;
const TOP = 12;

const CHOICES = [
  {
    id: "approve",
    label: "Approve the overtime",
    reply: "Approved. The 4 hours are paid at time and a half in November, and Ravi knows you said thanks.",
    did: ["4 hours on November's payroll, $412", "Ravi told, with your note", "I'll check in again if next week goes over"],
  },
  {
    id: "monday",
    label: "Give him Monday off",
    reply: "Done. Monday is off in Ravi's calendar, and it doesn't come out of his 25 days.",
    did: ["Monday, November 2 off, paid", "His standup moved to Tuesday", "Priya asked to cover the migration checks"],
  },
  {
    id: "talk",
    label: "Talk to Ravi first",
    reply: "I've found 20 minutes in both your calendars at 15:30 today, and sent you his last four weeks of hours.",
    did: ["15:30 today, in both calendars", "Four weeks of hours, in your inbox", "Nothing changes until you've talked"],
  },
] as const;

type Choice = (typeof CHOICES)[number]["id"];

export function Overtime() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const picked = CHOICES.find((c) => c.id === choice);

  return (
    <Moment id="overtime" time={momentOf("overtime").at} where="Engineering, New York" title="Ravi worked 52 hours this week. pello asked Oliver what to do." lead="Some calls shouldn't be made by a rule. pello sends them to the right person with what they need to know, then does whatever they choose.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Ravi's week, as pello saw it. */}
        <Window title={`${RAVI.name}, this week`} aside={<Tag tone={picked ? "done" : "flag"}>{picked ? "Handled" : "Over the limit"}</Tag>}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <Face person={RAVI} size={64} hot={!picked} />
              <div>
                <p className="flex items-baseline gap-2">
                  <span className={cn("tabular font-mono text-[52px] font-medium leading-none tracking-[-0.06em] transition-colors", picked ? "text-ink" : "text-accent")}>{TOTAL}</span>
                  <span className="text-[15px] text-mute">hours, the limit is {LIMIT}</span>
                </p>
                <p className="mt-1.5 text-[15px] text-mute">{RAVI.role}, on the data migration</p>
              </div>
            </div>

            <div className="relative mt-8 h-[180px] pr-[64px]">
              {/* A day's share of the weekly limit, labelled in the margin. */}
              <span className="absolute left-0 right-[56px] border-t border-dashed border-ink-2" style={{ bottom: `${(LIMIT / 5 / TOP) * 100}%` }}>
                <span className="tabular absolute -right-[56px] top-0 w-[52px] -translate-y-1/2 text-right font-mono text-[15px] text-mute">{(LIMIT / 5).toFixed(1)}h</span>
              </span>
              <div className="flex h-full items-end gap-3">
                {WEEK.map((d) => {
                  const over = d.hours > LIMIT / 5;
                  return (
                    <div key={d.day} className="flex h-full flex-1 flex-col justify-end">
                      <span className={cn("block rounded-t-[4px] transition-colors duration-500", over && !picked ? "bg-accent" : "bg-ink")} style={{ height: `${(d.hours / TOP) * 100}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex gap-3 pr-[64px]">
              {WEEK.map((d) => (
                <span key={d.day} className="flex-1 text-center text-[15px] leading-[1.35] text-mute">
                  {d.day}
                  <span className="tabular block font-mono text-ink">{d.hours}</span>
                </span>
              ))}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[15px] text-mute">
              The dashed line is 48 hours a week, spread over five days. Last week he logged <span className="tabular font-mono text-ink">50</span>, the week before <span className="tabular font-mono text-ink">44</span>.
            </p>
          </div>
        </Window>

        {/* pello's message to Oliver, and what happens after he answers. */}
        <Window title={OLIVER.name} icon={<SlackLogoIcon size={18} className="text-ink" />} aside={<span className="text-[15px] text-mute">Direct message</span>}>
          <div className="grid gap-6 p-5">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-sunken">
                <Mark size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">
                  <span className="font-semibold text-ink">pello</span> <span className="tabular font-mono text-mute">{momentOf("overtime").at}</span>
                </p>
                <p className="mt-0.5 text-[16px] leading-[1.55] text-ink">
                  Ravi has logged <span className="font-medium">52 hours</span> this week, 4 over Fieldwork&apos;s limit, and 50 the week before. He&apos;s on the data migration until November 6. What would you like me to do?
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CHOICES.map((c) => (
                    <button key={c.id} type="button" disabled={!!choice} onClick={() => setChoice(c.id)} className={cn("h-10 rounded-[8px] px-3.5 text-[15px] font-medium transition-[background-color,opacity]", choice === c.id ? "pl-btn-dark" : "pl-btn-light", choice && choice !== c.id && "opacity-40")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {picked ? (
                <motion.div key={picked.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="grid gap-6">
                  <div className="flex gap-3">
                    <Face person={OLIVER} size={36} square />
                    <div>
                      <p className="text-[15px]">
                        <span className="font-semibold text-ink">{OLIVER.name}</span> <span className="tabular font-mono text-mute">14:46</span>
                      </p>
                      <p className="mt-0.5 text-[16px] text-ink">{picked.label}.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-sunken">
                      <Mark size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px]">
                        <span className="font-semibold text-ink">pello</span> <span className="tabular font-mono text-mute">14:46</span>
                      </p>
                      <p className="mt-0.5 text-[16px] leading-[1.55] text-ink">{picked.reply}</p>
                      <ul className="mt-3 grid gap-1.5">
                        {picked.did.map((d, i) => (
                          <motion.li key={d} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-start gap-2 text-[15px] text-ink-2">
                            <CheckIcon size={15} weight="bold" className="mt-0.5 shrink-0 text-ink" />
                            {d}
                          </motion.li>
                        ))}
                      </ul>
                      <button type="button" onClick={() => setChoice(null)} className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                        <ArrowCounterClockwiseIcon size={14} />
                        Choose again
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.p key="waiting" exit={{ opacity: 0 }} className="pl-12 text-[15px] text-mute">
                  Oliver is typing. Pick one for him.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </Window>
      </div>
    </Moment>
  );
}
