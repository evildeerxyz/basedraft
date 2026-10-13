"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Band, Button, Face, SectionHead, Tag, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";

/*
 * October's payroll for Fieldwork's four countries. In view, pello checks each country against
 * September, counting up as it goes, then lists what changed and why. Nothing is paid until a
 * person approves it.
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
    if (seen && phase === "idle") {
      const t = setTimeout(() => {
        setPhase("checking");
        setRun((r) => r + 1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [seen, phase]);

  useEffect(() => {
    if (phase !== "checking") return;
    if (checked >= COUNTRIES.length) {
      const t = setTimeout(() => setPhase("ready"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChecked((c) => c + 1), 600);
    return () => clearTimeout(t);
  }, [phase, checked]);

  const status = { idle: ["open", "Not started"], checking: ["live", "Checking"], ready: ["open", "Ready to pay"], paid: ["done", "Paid"] } as const;

  return (
    <Band rule id="payroll" inner="py-20 lg:py-28">
      <SectionHead title="Payroll for four countries, in one go" lead="Hours, time off, expenses and new salaries come in on their own. pello checks the totals against last month, explains every change, and waits for a person to approve it." />

      <div ref={ref} className="pl-card relative mt-14 rounded-[16px] p-3 sm:p-4">
        <Window title="October payroll">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-display text-[24px] font-semibold tracking-[-0.015em] text-ink">October 2026</p>
              <p className="mt-0.5 text-[15px] text-mute">
                <span className="tabular font-mono">214</span> people in <span className="tabular font-mono">4</span> countries, paid on Friday, October 30
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tag tone={status[phase][0]}>{status[phase][1]}</Tag>
              {phase === "paid" ? (
                <Button kind="light" onClick={start}>
                  Run it again
                </Button>
              ) : (
                <Button disabled={phase !== "ready"} onClick={() => setPhase("paid")} chevron>
                  Approve and pay
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto px-3 pb-3 sm:px-4">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="text-[15px] text-mute">
                  <th className="px-3 py-2 font-normal">Country</th>
                  <th className="px-3 py-2 text-right font-normal">People</th>
                  <th className="px-3 py-2 text-right font-normal">Total</th>
                  <th className="px-3 py-2 text-right font-normal">On September</th>
                  <th className="px-3 py-2 text-right font-normal">Checked</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.map((c, i) => {
                  const ok = i < checked || phase === "ready" || phase === "paid";
                  const now = phase === "checking" && i === checked;
                  return (
                    <tr key={c.code} className={cn("shadow-[0_-1px_0_var(--pl-line)] transition-colors", now && "bg-accent-soft")}>
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-3 text-[15px] font-medium text-ink">
                          <span className="grid h-7 w-9 place-items-center rounded-[6px] bg-sunken font-mono text-[15px] text-ink-2">{c.code}</span>
                          {c.name}
                        </span>
                      </td>
                      <td className="tabular px-3 py-3.5 text-right font-mono text-[15px] text-ink-2">{c.people}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-[16px] font-medium text-ink">
                        <Money value={c.total} currency={c.currency} run={run} />
                      </td>
                      <td className={cn("tabular px-3 py-3.5 text-right font-mono text-[15px] transition-opacity", ok ? "text-ink-2 opacity-100" : "opacity-0")}>{c.change}</td>
                      <td className="px-3 py-3.5">
                        <span className={cn("ml-auto grid size-6 place-items-center rounded-full transition-colors duration-300", ok ? (phase === "paid" ? "bg-[#16a34a] text-white" : "bg-ink text-surface") : "shadow-[inset_0_0_0_1.5px_var(--pl-line-strong)]")}>{ok && <CheckIcon size={12} weight="bold" />}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-page/60 p-3 shadow-[0_-1px_0_var(--pl-line)] sm:p-4">
            <p className="px-3 pb-2 pt-2 text-[15px] font-medium text-mute">What changed since September</p>
            <ul className="grid gap-1.5">
              {CHANGES.map((c, i) => (
                <li key={c.what} className={cn("rounded-[12px] transition-colors", open === i ? "bg-surface shadow-[0_0_0_1px_var(--pl-line)]" : "hover:bg-surface/70")}>
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full px-3 py-3 text-left">
                    <span className="flex items-center gap-3">
                      <Face person={c.who} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-ink">{c.who.name}</span>
                        <span className="block text-[15px] text-mute">{c.what}</span>
                      </span>
                      <span className="text-[15px] text-ink">
                        <span className="tabular font-mono font-medium">{c.amount[0]}</span> {c.amount[1]}
                      </span>
                      <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="text-mute">
                        <CaretDownIcon size={16} weight="bold" />
                      </motion.span>
                    </span>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="block overflow-hidden">
                          <span className="block max-w-[620px] pl-12 pt-2 text-[15px] leading-[1.6] text-ink-2">{c.why}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Window>

        <AnimatePresence>
          {phase === "paid" && (
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} className="pl-pop absolute bottom-8 right-8 flex max-w-[360px] items-start gap-3 rounded-[14px] p-4 max-sm:inset-x-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#16a34a] text-white">
                <CheckIcon size={16} weight="bold" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">October payroll is paid</span>
                <span className="block text-[15px] text-mute">214 payslips are in the app, and Arjun has the report.</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Band>
  );
}
