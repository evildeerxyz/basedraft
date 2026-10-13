"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Container, SectionHead, Status } from "@/components/site/ui";
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
  { who: personOf("ravi"), what: "6 hours of overtime", amount: "$412 more", why: "Worked late on October 14 and 15 for the data migration. Oliver approved it on the 16th, so it's paid at time and a half." },
  { who: personOf("grace"), what: "Home office expense", amount: "£249 more", why: "A desk chair, with the receipt added on October 9. It's inside her £400 budget, with £31 left for the year." },
  { who: personOf("noah"), what: "New salary from October 1", amount: "€350 more", why: "Agreed in his review with Oliver on September 24. The new contract is signed and in his file." },
  { who: personOf("hugo"), what: "2 days of unpaid leave", amount: "C$1,140 less", why: "October 20 and 21, approved by Nina. Taken off this month's pay, as his request said." },
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
    const t = setTimeout(() => setChecked((c) => c + 1), 650);
    return () => clearTimeout(t);
  }, [phase, checked]);

  const status = { idle: ["wait", "Not started"], checking: ["wait", "Checking"], ready: ["accent", "Ready to pay"], paid: ["good", "Paid"] } as const;

  return (
    <section id="payroll" className="scroll-mt-20 bg-surface py-28 lg:py-36">
      <Container>
        <SectionHead title="Payroll for four countries, run in one go." lead="Hours, time off, expenses and new salaries come in on their own. pello checks the totals against last month, explains every change, and waits for your approval before anyone is paid." />

        <div ref={ref} className="mt-16 overflow-hidden rounded-[28px] border border-line bg-page">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-[22px] font-semibold tracking-[-0.025em] text-ink">October payroll</p>
              <p className="mt-1 text-[16px] text-mute">214 people in 4 countries, paid on Friday, October 30</p>
            </div>
            <div className="flex items-center gap-3">
              <Status tone={status[phase][0]}>{status[phase][1]}</Status>
              {phase === "paid" ? (
                <Button kind="quiet" onClick={start}>
                  Run it again
                </Button>
              ) : (
                <Button kind="accent" disabled={phase !== "ready"} onClick={() => setPhase("paid")}>
                  Approve and pay
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-px bg-line shadow-[0_-1px_0_var(--pl-line)] sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((c, i) => {
              const ok = i < checked || phase === "ready" || phase === "paid";
              const now = phase === "checking" && i === checked;
              return (
                <div key={c.code} className="relative overflow-hidden bg-page p-6 lg:p-8">
                  {now && <motion.span aria-hidden className="absolute inset-y-0 left-0 w-full bg-accent-soft" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.65, ease: "linear" }} style={{ originX: 0 }} />}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-semibold text-ink">{c.name}</p>
                      <span className={cn("grid size-7 place-items-center rounded-full transition-colors duration-300", ok ? "bg-good text-white" : "shadow-[inset_0_0_0_2px_var(--pl-line-strong)]")}>{ok && <CheckIcon size={15} weight="bold" />}</span>
                    </div>
                    <p className="mt-6 text-[clamp(1.9rem,2.6vw,2.4rem)] font-semibold tracking-[-0.04em] text-ink">
                      <Money value={c.total} currency={c.currency} run={run} />
                    </p>
                    <p className="mt-2 flex items-baseline justify-between text-[16px] text-mute">
                      <span className="tabular">{c.people} people</span>
                      <span className={cn("tabular transition-opacity", ok ? "opacity-100" : "opacity-0")}>{c.change} on September</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 shadow-[0_-1px_0_var(--pl-line)] lg:p-4">
            <p className="px-4 pb-2 pt-4 text-[19px] font-semibold tracking-[-0.02em] text-ink">What changed since September</p>
            <ul>
              {CHANGES.map((c, i) => (
                <li key={c.what}>
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className={cn("w-full rounded-[18px] px-4 py-3.5 text-left transition-colors", open === i ? "bg-surface shadow-[inset_0_0_0_1px_var(--pl-line)]" : "hover:bg-sunken")}>
                    <span className="flex items-center gap-4">
                      <Avatar person={c.who} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-medium text-ink">{c.who.name}</span>
                        <span className="block text-[16px] text-mute">{c.what}</span>
                      </span>
                      <span className="tabular text-[17px] font-medium text-ink">{c.amount}</span>
                      <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="text-mute">
                        <CaretDownIcon size={18} />
                      </motion.span>
                    </span>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="block overflow-hidden">
                          <span className="block pl-[52px] pt-3 text-[17px] leading-[1.55] text-ink-2">{c.why}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <AnimatePresence>
            {phase === "paid" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="overflow-hidden bg-good text-white">
                <p className="flex items-center gap-3 px-6 py-5 text-[18px] font-medium lg:px-8">
                  <CheckIcon size={20} weight="bold" />
                  Paid. 214 payslips are in the app, and Arjun has the report.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
