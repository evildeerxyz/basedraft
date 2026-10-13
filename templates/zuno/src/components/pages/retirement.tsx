"use client";

import { BellRingingIcon, CheckCircleIcon, MagnifyingGlassIcon, PhoneCallIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useInView, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn, EASE_IN_OUT, EASE_OUT, formatUSD } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { DataTable } from "../site/DataTable";
import { Stepper } from "../site/Stepper";

const N = 60;
// Smooth compounding curve with a little market noise: age 30 to 65.
const HEIGHTS = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const noise = Math.sin(i * 1.7) * 0.012 + Math.sin(i * 0.6) * 0.02;
  return 0.06 + Math.pow(t, 2.1) * 0.72 + noise * t;
});

export function RetirementHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reveal = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const a = animate(reveal, 1, { duration: 2.6, ease: EASE_IN_OUT, delay: 0.3 });
    return () => a.stop();
  }, [inView, reveal]);

  return (
    <div ref={ref} className="relative aspect-[5/4] w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2">
      <div className="absolute inset-x-0 bottom-10 top-24">
        <DitherShader shape="chart" data={HEIGHTS} reveal={reveal} color="#c8ff3e" secondColor="#c8ff3e" secondOpacity={0.4} pixelSize={3} interactive={false} />
      </div>
      <div className="absolute left-6 top-6">
        <div className="text-[17px] font-medium text-white/60">Roth IRA · projected</div>
        <div className="mt-1 text-[34px] font-semibold tracking-[-0.04em]">$1.62M at 65</div>
      </div>
      <motion.div
        className="absolute right-6 top-6 rounded-full bg-lime px-3 py-1 text-[15px] tabular-nums text-on-lime"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 2.6 }}
      >
        Tax-free withdrawals
      </motion.div>
      <div className="absolute inset-x-6 bottom-3 flex justify-between text-[15px] tabular-nums text-white/60">
        {[30, 40, 50, 60, 65].map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- which IRA ---------- */

const IRA_ROWS = [
  ["Best for", "A deduction today", "Tax-free growth", "The self-employed"],
  ["Contributions", "Often tax-deductible", "After tax", "Tax-deductible"],
  ["Withdrawals in retirement", "Taxed as income", "Tax-free", "Taxed as income"],
  ["2026 limit", "$7,500", "$7,500", "Up to $72,000"],
  ["Income limits", "None to contribute", "Phase out from $153,000", "None"],
];

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-[18px] font-medium">{label}</legend>
      <div className="mt-3 flex gap-1 rounded-[14px] bg-white/[0.05] p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={cn("relative h-11 flex-1 rounded-[11px] text-[16px] font-medium transition-colors", value === o ? "text-on-lime" : "text-white/70 hover:text-white")}
          >
            {value === o && <motion.span layoutId={`ira-${label}`} className="absolute inset-0 rounded-[11px] bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{o}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function IraPicker() {
  const [self, setSelf] = useState<"Yes" | "No">("No");
  const [rate, setRate] = useState<"Higher" | "Lower" | "Not sure">("Higher");
  const pick = self === "Yes" ? 3 : rate === "Lower" ? 1 : 2;
  const why = {
    1: "Take the deduction now while your rate is high, and pay tax later when it's lower.",
    2: "Pay tax now and nothing later. That wins if your rate rises, and it hedges if you're unsure.",
    3: "Save up to $72,000 a year from self-employment income, deductible today. You can add a Roth too.",
  }[pick];
  const name = ["", "Traditional IRA", "Roth IRA", "SEP IRA"][pick];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="space-y-8 lg:col-span-4">
        <Choice label="Are you self-employed?" options={["No", "Yes"]} value={self} onChange={setSelf} />
        <Choice label="Your tax rate in retirement?" options={["Higher", "Lower", "Not sure"]} value={rate} onChange={setRate} />
        <div className="rounded-[22px] bg-lime p-6 text-on-lime" aria-live="polite">
          <div className="text-[16px] opacity-75">Start with a</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pick} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
              <div className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.04em]">{name}</div>
              <p className="mt-4 text-[17px] leading-relaxed opacity-85">{why}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">
        <DataTable caption="IRA comparison" highlight={pick} columns={["", "Traditional IRA", "Roth IRA", "SEP IRA"]} rows={IRA_ROWS} />
        <p className="mt-5 text-[16px] text-white/60">Not sure? Open both. Copilot can model the split with your real numbers.</p>
      </div>
    </div>
  );
}

/* ---------- 401(k) rollover tracker ---------- */

const ROLL = [
  { title: "Tell us where it is", meta: "About 4 minutes", body: "Search for your old provider and we prefill the paperwork from what you've already told us." },
  { title: "We request it", meta: "Day 1", body: "Zuno contacts your provider and handles the forms, including the awkward phone calls." },
  { title: "It arrives", meta: "Days 7 to 12", body: "Most rollovers land within two weeks. You get a notification at every step, not just the last one." },
  { title: "Autopilot invests it", meta: "Same day", body: "The money goes to work in your plan the day it lands. We reimburse up to $150 in transfer fees." },
];

const AMOUNT = 84210.55;
const SPLIT = [
  { k: "US stocks", p: 55 },
  { k: "International", p: 18 },
  { k: "Bonds", p: 17 },
  { k: "Cash", p: 10 },
];

function RolloverStage({ step }: { step: number }) {
  return (
    <div className="flex h-full flex-col p-6 sm:p-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[16px] text-white/60">Northwind Corp 401(k) to Zuno Rollover IRA</div>
          <div className="mt-1 text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-none tracking-[-0.045em]">{formatUSD(AMOUNT)}</div>
        </div>
        <span className={cn("rounded-full px-4 py-2 text-[15px] font-medium", step === 3 ? "bg-lime text-on-lime" : "bg-white/10 text-white")}>{step === 3 ? "Invested" : "In progress"}</span>
      </div>

      <ol className="mt-9 grid grid-cols-4 gap-2" aria-hidden>
        {ROLL.map((r, i) => (
          <li key={r.title}>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div className="h-full rounded-full bg-lime" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.6, ease: EASE_OUT }} />
            </div>
            <div className={cn("mt-2 text-[15px] leading-snug", i <= step ? "text-white" : "text-white/55")}>{r.meta}</div>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
            {step === 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.06] px-5 py-4 text-[17px]">
                  <MagnifyingGlassIcon size={20} className="text-white/60" />
                  <span>Northwind Corp 401(k)</span>
                  <CheckCircleIcon size={20} weight="fill" className="ml-auto text-accent" />
                </div>
                {["Plan administrator", "Account number", "Mailing instructions"].map((f) => (
                  <div key={f} className="flex items-center justify-between px-5 py-2.5 text-[16px]">
                    <span className="text-white/70">{f}</span>
                    <span className="text-accent">Prefilled</span>
                  </div>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="flex gap-4 rounded-[18px] bg-white/[0.05] p-5">
                <PhoneCallIcon size={26} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[17px] leading-relaxed text-white/85">We called Northwind&apos;s plan administrator and sent the transfer request. Nothing for you to sign.</p>
              </div>
            )}
            {step === 2 && (
              <div className="flex items-center gap-4 rounded-[18px] bg-white/[0.05] p-5">
                <BellRingingIcon size={26} weight="fill" className="shrink-0 text-accent" />
                <div>
                  <div className="text-[17px] font-medium">Your rollover arrived</div>
                  <div className="text-[16px] text-white/65">{formatUSD(AMOUNT)} received on day 9</div>
                </div>
              </div>
            )}
            {step === 3 && (
              <ul className="space-y-3">
                {SPLIT.map((s, i) => (
                  <li key={s.k} className="grid grid-cols-[120px_1fr_96px] items-center gap-4 text-[16px]">
                    <span className="text-white/75">{s.k}</span>
                    <span className="h-3 rounded-full bg-white/[0.06]">
                      <motion.span className="block h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${(s.p / 55) * 100}%` }} transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.08 }} />
                    </span>
                    <span className="text-right font-mono tabular-nums">{formatUSD((AMOUNT * s.p) / 100, 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RolloverTracker() {
  return (
    <Stepper steps={ROLL} duration={5}>
      {(i) => <RolloverStage step={i} />}
    </Stepper>
  );
}
