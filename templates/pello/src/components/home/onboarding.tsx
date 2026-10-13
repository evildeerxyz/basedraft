"use client";

import { ArrowCounterClockwiseIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Mark } from "@/components/site/logo";
import { Container, Face, SectionHead, Stamp } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf, type Person } from "@/lib/people";
import { personPhoto } from "@/lib/photos";

/*
 * Leo's first day, from the weeks before it. When the section comes into view, the list works
 * itself through, each task ticked by pello or by the person it belongs to, and his badge is
 * stamped when the last one's done.
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
      { text: "Accounts for Google, Slack, GitHub and Linear", by: "pello", at: "08:41" },
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

// The badge's barcode: bars from the badge number, so it's the same on every load.
const BARS = Array.from({ length: 34 }, (_, i) => 1 + ((i * 7 + 3) % 4));

function Who({ by }: { by: By }) {
  return (
    <span className="flex w-[104px] shrink-0 items-center justify-end gap-2 text-[15px] text-mute max-sm:w-auto">
      {by === "pello" ? (
        <span className="grid size-7 place-items-center rounded-[3px] bg-surface">
          <Mark size={18} />
        </span>
      ) : (
        <Face person={by} size={28} />
      )}
      <span className="max-sm:hidden">{by === "pello" ? "pello" : by.name.split(" ")[0]}</span>
    </span>
  );
}

export function Onboarding() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.3, once: true });
  const [done, setDone] = useState(0);
  const [run, setRun] = useState(0);
  const ready = done >= TOTAL;

  useEffect(() => {
    if (!seen || done >= TOTAL) return;
    const t = setTimeout(() => setDone((d) => d + 1), done === 0 ? 500 : 400);
    return () => clearTimeout(t);
  }, [seen, done, run]);

  return (
    <section id="onboarding" className="scroll-mt-20 bg-surface py-28 lg:py-36">
      <Container>
        <SectionHead title="Leo starts Monday. Everything is ready." lead="Contract, laptop, accounts, a buddy and a first week plan. pello works through the list in the weeks before, and leaves the parts that need a person to that person." />
        <div ref={ref} className="mt-16 grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-14">
          <div className="self-start lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-[6px] bg-page shadow-[0_24px_60px_-34px_rgb(0_0_0/0.45)]">
              <div className="flex items-center justify-between bg-ink px-5 py-3 text-page">
                <span className="font-display text-[22px] font-extrabold tracking-[0.04em]">FIELDWORK</span>
                <span className="tabular font-mono text-[15px]">No. 0215</span>
              </div>
              <Dithered src={personPhoto(LEO.id)} alt={`${LEO.name}, on his badge`} inks={ready ? ["ink", "accent", "page"] : ["ink", "page"]} cell={3} focus={[0.5, 0.3]} className="aspect-[5/4]" />
              <div className="p-5">
                <p className="font-display text-[44px] font-extrabold leading-[0.92] text-ink">{LEO.name}</p>
                <p className="mt-1 text-[17px] text-ink-2">
                  {LEO.role}, {LEO.location}
                </p>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-[15px]">
                  {[
                    ["Starts", "Nov 2"],
                    ["Manager", OLIVER.name.split(" ")[0]],
                    ["Buddy", CLARA.name.split(" ")[0]],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col-reverse">
                      <dt className="text-mute">{k}</dt>
                      <dd className="text-[17px] font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div aria-hidden className="mt-6 flex h-10 items-stretch gap-[2px]">
                  {BARS.map((w, i) => (
                    <span key={i} className="bg-ink" style={{ width: w * 2 }} />
                  ))}
                </div>
              </div>
              <AnimatePresence>
                {ready && (
                  <motion.span key={run} className="absolute right-4 top-20">
                    <Stamp tone="accent" tilt={8} className="bg-page/80 text-[34px]">
                      Ready
                    </Stamp>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-[17px] text-ink">
                <span className="tabular font-mono font-semibold">{done}</span> of <span className="tabular font-mono">{TOTAL}</span> done
              </p>
              <button
                type="button"
                onClick={() => {
                  setDone(0);
                  setRun((r) => r + 1);
                }}
                className="flex h-11 items-center gap-2 rounded-[4px] px-4 text-[16px] font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page"
              >
                <ArrowCounterClockwiseIcon size={17} weight="bold" />
                Run it again
              </button>
            </div>
            <div aria-hidden className="mt-3 grid grid-cols-12 gap-1">
              {Array.from({ length: TOTAL }, (_, i) => (
                <span key={i} className={cn("h-2 transition-colors duration-300", i < done ? "bg-ink" : "bg-sunken")} />
              ))}
            </div>
          </div>

          <ol className="grid gap-10">
            {GROUPS.map((g, gi) => (
              <li key={g.when}>
                <div className="flex items-baseline justify-between pb-2 shadow-[0_1.5px_0_var(--pl-ink)]">
                  <p className="font-display text-[30px] font-extrabold leading-none text-ink">{g.when}</p>
                  <p className="tabular font-mono text-[15px] text-mute">{g.date}</p>
                </div>
                <ul>
                  {g.tasks.map((t, ti) => {
                    const i = FIRST[gi] + ti;
                    const on = i < done;
                    return (
                      <li key={t.text} className={cn("flex items-center gap-4 py-3.5 shadow-[0_1px_0_var(--pl-line-strong)] transition-colors duration-500", on && i === done - 1 && "bg-accent-soft")}>
                        <motion.span initial={false} animate={on ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} className={cn("grid size-7 shrink-0 place-items-center rounded-[3px] transition-colors duration-300", on ? "bg-ink text-page" : "shadow-[inset_0_0_0_1.5px_var(--pl-line-strong)]")}>
                          {on && <CheckIcon size={15} weight="bold" />}
                        </motion.span>
                        <span className={cn("min-w-0 flex-1 text-[18px] transition-colors duration-300", on ? "text-ink" : "text-mute")}>{t.text}</span>
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
