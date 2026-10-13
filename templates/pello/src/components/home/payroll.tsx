"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, Container, Face, SectionHead, Stamp, Tag } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";

/*
 * October's payroll for Fieldwork's four countries, as four payslips. In view, pello checks each
 * one against September, counting up as it goes, then lists what changed and why. Nothing is paid
 * until a person approves it, and then the run prints out.
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

/** A payslip's torn edge, punched along the top. */
const PERFORATION = "radial-gradient(circle at 6px 0, var(--pl-page) 4px, transparent 4.5px) 0 0 / 12px 8px repeat-x";

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

  const status = { idle: ["open", "Not started"], checking: ["open", "Checking"], ready: ["flag", "Ready to pay"], paid: ["done", "Paid"] } as const;

  return (
    <section id="payroll" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead title="Payroll for four countries, run in one go." lead="Hours, time off, expenses and new salaries come in on their own. pello checks the totals against last month, explains every change, and waits for your approval before anyone is paid." />

        <div ref={ref} className="mt-16">
          <div className="flex flex-col gap-5 pb-5 shadow-[0_1.5px_0_var(--pl-ink)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-[40px] font-extrabold leading-none text-ink">October payroll</p>
              <p className="mt-2 text-[17px] text-mute">214 people in 4 countries, paid on Friday, October 30</p>
            </div>
            <div className="flex items-center gap-5">
              <Tag tone={status[phase][0]}>{status[phase][1]}</Tag>
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((c, i) => {
              const ok = i < checked || phase === "ready" || phase === "paid";
              const now = phase === "checking" && i === checked;
              return (
                <div key={c.code} className="relative overflow-hidden rounded-b-[4px] bg-surface px-6 pb-6 pt-8">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-2" style={{ background: PERFORATION }} />
                  {now && <motion.span aria-hidden className="absolute inset-x-0 h-[3px] bg-accent" initial={{ top: 8 }} animate={{ top: "100%" }} transition={{ duration: 0.65, ease: "linear" }} />}
                  <div className="flex items-center justify-between">
                    <p className="text-[18px] font-semibold text-ink">{c.name}</p>
                    <span className={cn("grid size-7 place-items-center rounded-[3px] transition-colors duration-300", ok ? "bg-ink text-page" : "shadow-[inset_0_0_0_1.5px_var(--pl-line-strong)]")}>{ok && <CheckIcon size={15} weight="bold" />}</span>
                  </div>
                  <p className="mt-8 font-mono text-[clamp(1.7rem,2.3vw,2.2rem)] font-medium tracking-[-0.03em] text-ink">
                    <Money value={c.total} currency={c.currency} run={run} />
                  </p>
                  <div className="mt-5 grid gap-1.5 text-[16px]">
                    <p className="flex justify-between">
                      <span className="text-mute">People</span>
                      <span className="tabular font-mono text-ink">{c.people}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-mute">On September</span>
                      <span className={cn("tabular font-mono transition-opacity", ok ? "text-ink opacity-100" : "opacity-0")}>{c.change}</span>
                    </p>
                  </div>
                  <AnimatePresence>
                    {phase === "paid" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }} className="absolute bottom-16 right-4">
                        <Stamp tone="accent" tilt={-10} className="text-[26px]">
                          Paid
                        </Stamp>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <p className="font-display text-[34px] font-extrabold leading-none text-ink">What changed since September</p>
              <p className="mt-3 text-[17px] leading-[1.55] text-ink-2">Every difference, with who made it and why. Open one to read it.</p>
            </div>
            <ul>
              {CHANGES.map((c, i) => (
                <li key={c.what} className="shadow-[0_1px_0_var(--pl-line-strong)] first:shadow-[0_-1px_0_var(--pl-line-strong),0_1px_0_var(--pl-line-strong)]">
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full py-4 text-left">
                    <span className="flex items-center gap-4">
                      <Face person={c.who} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[18px] font-semibold text-ink">{c.who.name}</span>
                        <span className="block text-[16px] text-mute">{c.what}</span>
                      </span>
                      <span className="text-[17px] text-ink">
                        <span className="tabular font-mono">{c.amount[0]}</span> {c.amount[1]}
                      </span>
                      <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="text-ink">
                        <CaretDownIcon size={18} weight="bold" />
                      </motion.span>
                    </span>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="block overflow-hidden">
                          <span className="block max-w-[640px] pl-14 pt-3 text-[18px] leading-[1.55] text-ink-2">{c.why}</span>
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
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-10 flex items-center gap-3 font-display text-[30px] font-extrabold text-ink">
                <CheckIcon size={26} weight="bold" className="text-accent" />
                Paid. 214 payslips are in the app, and Arjun has the report.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
