"use client";

import { ArrowCounterClockwiseIcon, CaretDownIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, Face, Moment, Tag, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { useEngaged } from "@/lib/engaged";
import { personOf } from "@/lib/people";

/*
 * 11:30. Payday. Once it's in view (and someone is on the page), pello checks each country's total against September, counting up as it
 * goes, then lists what changed and why. Nothing is paid until Arjun approves it.
 */

const COUNTRIES = [
  { code: "US", name: "United States", people: 128, total: 1_204_310, currency: "$", change: "+1.2%" },
  { code: "UK", name: "United Kingdom", people: 41, total: 214_880, currency: "£", change: "+0.4%" },
  { code: "DE", name: "Germany", people: 27, total: 176_420, currency: "€", change: "+2.1%" },
  { code: "CA", name: "Canada", people: 18, total: 121_970, currency: "C$", change: "+0.2%" },
];

const CHANGES = [
  { who: personOf("ravi"), what: "6 hours of overtime", amount: ["$412", "more"], why: "Worked late on October 14 and 15 for the data migration. Oliver approved it on the 16th, so it's paid at time and a half." },
  { who: personOf("grace"), what: "Home office expense", amount: ["£249", "more"], why: "A desk chair, with the receipt added on October 9. It's inside her £400 budget, with £31 left for the year." },
  { who: personOf("noah"), what: "New salary from October 1", amount: ["€350", "more"], why: "Agreed in his review with Oliver on September 24. The new contract is signed and in his file." },
  { who: personOf("hugo"), what: "2 days of unpaid leave", amount: ["C$1,140", "less"], why: "October 20 and 21, approved by Nina. Taken off this month's pay, as his request said." },
];

const ARJUN = personOf("arjun");

type Phase = "idle" | "checking" | "ready" | "paid";

function Money({ value, currency, run }: { value: number; currency: string; run: number }) {
  const v = useMotionValue(value);
  const text = useTransform(v, (n) => `${currency}${Math.round(n).toLocaleString("en-US")}`);
  useEffect(() => {
    if (!run) return;
    v.set(0);
    const a = animate(v, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [run, value, v]);
  return <motion.span className="tabular">{text}</motion.span>;
}

export function Payroll() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.35, once: true });
  const engaged = useEngaged();
  const [phase, setPhase] = useState<Phase>("idle");
  const [checked, setChecked] = useState(0);
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState<number | null>(0);

  const start = () => {
    setChecked(0);
    setPhase("checking");
    setRun((r) => r + 1);
  };

  useEffect(() => {
    if (seen && engaged && phase === "idle") {
      const t = setTimeout(() => {
        setPhase("checking");
        setRun((r) => r + 1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [seen, engaged, phase]);

  useEffect(() => {
    if (phase !== "checking") return;
    if (checked >= COUNTRIES.length) {
      const t = setTimeout(() => setPhase("ready"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChecked((c) => c + 1), 600);
    return () => clearTimeout(t);
  }, [phase, checked]);

  const status = { idle: ["open", "Not started"], checking: ["live", "Checking"], ready: ["open", "Waiting for Arjun"], paid: ["done", "Paid"] } as const;

  return (
    <Moment id="payroll" time={momentOf("payroll").at} where="Finance, Berlin" title="Payday. 214 payslips, checked against September." lead="Hours, time off, expenses and new salaries came in on their own all month. pello checked every country's total, explained each change, and waited for Arjun. Nothing is paid until a person says so.">
      <div ref={ref}>
        <Window title="October payroll" aside={<Tag tone={status[phase][0]}>{status[phase][1]}</Tag>}>
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
              <span>
                <span className="tabular block font-mono text-[44px] font-medium leading-none tracking-[-0.05em] text-ink">214</span>
                <span className="mt-1.5 block text-[15px] text-mute">payslips</span>
              </span>
              <span>
                <span className="tabular block font-mono text-[44px] font-medium leading-none tracking-[-0.05em] text-ink">4</span>
                <span className="mt-1.5 block text-[15px] text-mute">countries</span>
              </span>
              <span>
                <span className="tabular block font-mono text-[44px] font-medium leading-none tracking-[-0.05em] text-ink">{CHANGES.length}</span>
                <span className="mt-1.5 block text-[15px] text-mute">changes since September</span>
              </span>
            </p>
            {phase === "paid" ? (
              <Button kind="light" onClick={start}>
                <ArrowCounterClockwiseIcon size={15} />
                Run it again
              </Button>
            ) : (
              <Button disabled={phase !== "ready"} onClick={() => setPhase("paid")} chevron>
                Approve and pay
              </Button>
            )}
          </div>

          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="text-[15px] text-mute">
                  <th className="px-3 py-2 font-normal">Country</th>
                  <th className="px-3 py-2 text-right font-normal">People</th>
                  <th className="px-3 py-2 text-right font-normal">Total</th>
                  <th className="px-3 py-2 text-right font-normal">On September</th>
                  <th className="w-[100px] px-3 py-2 text-right font-normal">
                    <span className="sr-only">Checked</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.map((c, i) => {
                  const ok = i < checked || phase === "ready" || phase === "paid";
                  const now = phase === "checking" && i === checked;
                  return (
                    <tr key={c.code} className={cn("shadow-[0_-1px_0_var(--pl-line)] transition-colors", now && "bg-surface")}>
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-3 text-[15px] font-medium text-ink">
                          <span className="w-8 font-mono text-mute">{c.code}</span>
                          {c.name}
                        </span>
                      </td>
                      <td className="tabular px-3 py-3.5 text-right font-mono text-[15px] text-ink-2">{c.people}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-[16px] font-medium text-ink">
                        <Money value={c.total} currency={c.currency} run={run} />
                      </td>
                      <td className={cn("tabular px-3 py-3.5 text-right font-mono text-[15px] transition-opacity", ok ? "text-ink-2 opacity-100" : "opacity-0")}>{c.change}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        {now ? (
                          <span className="text-[15px] font-medium text-accent">Checking</span>
                        ) : (
                          <span className={cn("inline-flex align-middle transition-opacity duration-300", ok ? "opacity-100" : "opacity-0")}>
                            <CheckIcon size={16} weight="bold" className="text-ink" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line px-2 pb-2 pt-4">
            <p className="px-3 pb-2 text-[15px] font-medium text-ink">What changed since September</p>
            <ul>
              {CHANGES.map((c, i) => (
                <li key={c.what} className="border-t border-line first:border-t-0">
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full rounded-[8px] px-3 py-3 text-left transition-colors hover:bg-surface">
                    <span className="flex items-center gap-3">
                      <Face person={c.who} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">
                          {c.who.name} <span className="font-normal text-mute">{c.what}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[15px] text-ink">
                        <span className="tabular font-mono font-medium">{c.amount[0]}</span> <span className="text-mute">{c.amount[1]}</span>
                      </span>
                      <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="text-mute">
                        <CaretDownIcon size={15} weight="bold" />
                      </motion.span>
                    </span>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="block overflow-hidden">
                          <span className="block max-w-[620px] pl-11 pt-2 text-[15px] leading-[1.6] text-ink-2">{c.why}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <AnimatePresence initial={false}>
            {phase === "paid" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="overflow-hidden">
                <div className="flex items-center gap-3 border-t border-line bg-surface px-5 py-4">
                  <Face person={ARJUN} size={32} />
                  <p className="text-[15px] leading-[1.5] text-ink">
                    Approved by {ARJUN.name} at <span className="tabular font-mono">11:42</span>. 214 payslips are in the app, and the report is in his inbox.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Window>
      </div>
    </Moment>
  );
}
