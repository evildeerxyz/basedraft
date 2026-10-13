"use client";

import {
  ArrowsClockwiseIcon,
  BankIcon,
  CarIcon,
  CheckCircleIcon,
  CoffeeIcon,
  CoinsIcon,
  ForkKnifeIcon,
  GaugeIcon,
  LeafIcon,
  MusicNotesIcon,
  ShoppingBagIcon,
  TrainIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ditherStyle } from "@/lib/dither";
import { pal } from "@/lib/palette";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { Counter } from "../ui/Counter";
import { RollingNumber } from "../ui/RollingNumber";
import { SectionTitle } from "../ui/Section";

const LIME = "var(--zn-accent)";

function BentoCard({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay }}
        className="flex h-full flex-col p-6 lg:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}

function CardHead({ icon, label, title, body }: { icon: ReactNode; label: string; title: string; body: string }) {
  return (
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-[17px] font-medium text-white/60">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <h3 className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 max-w-[420px] text-[17px] leading-relaxed text-white/60">{body}</p>
    </div>
  );
}

/* ---------- Autopilot ---------- */

const SLICES = [
  { name: "US stocks", drift: 46, target: 42, level: 1 },
  { name: "International", drift: 11, target: 18, level: 0.75 },
  { name: "Bonds", drift: 17, target: 22, level: 0.5 },
  { name: "Crypto", drift: 16, target: 8, level: 0.3 },
  { name: "Cash", drift: 10, target: 10, level: 0.14 },
];

const TRADES = [
  { side: "Sold", amt: 180, sym: "NVDA" },
  { side: "Bought", amt: 240, sym: "VXUS" },
  { side: "Sold", amt: 410, sym: "BTC" },
  { side: "Bought", amt: 96, sym: "BND" },
  { side: "Reinvested", amt: 32.4, sym: "VTI" },
  { side: "Bought", amt: 150, sym: "VEA" },
];

function Autopilot() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [balanced, setBalanced] = useState(false);
  const [feed, setFeed] = useState([0, 1, 2]);

  useEffect(() => {
    if (!inView) return;
    const a = setInterval(() => setBalanced((b) => !b), 3200);
    const b = setInterval(() => setFeed((f) => [(f[0] + TRADES.length - 1) % TRADES.length, f[0], f[1]]), 1900);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [inView]);

  return (
    <BentoCard className="min-h-[460px] lg:col-span-2">
      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
        <CardHead
          icon={<ArrowsClockwiseIcon size={14} weight="bold" />}
          label="Autopilot"
          title="Your mix stays on target."
          body="Zuno keeps your mix on target by trimming winners, buying dips and reinvesting every dividend automatically."
        />
        <div ref={ref} className="relative z-10 w-full shrink-0 lg:w-[250px]">
          <div className="mb-2 text-[17px] font-medium text-white/60">Live activity</div>
          <div className="relative h-[150px] overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              {feed.map((idx, i) => {
                const t = TRADES[idx];
                return (
                  <motion.div
                    key={`${idx}-${t.sym}`}
                    layout
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1 - i * 0.28, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mb-2 flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-ink-3/80 px-3 py-2.5 backdrop-blur"
                  >
                    <span className={cn("grid size-7 place-items-center rounded-lg", t.side === "Sold" ? "bg-white/10 text-white" : "bg-lime text-ink")}>
                      {t.side === "Sold" ? <TrendDownIcon size={14} weight="bold" /> : <TrendUpIcon size={14} weight="bold" />}
                    </span>
                    <span className="flex-1 text-[15px]">
                      {t.side} <span className="font-mono">{formatUSD(t.amt)}</span> {t.sym}
                    </span>
                    <span className="text-[15px] tabular-nums text-white/60">now</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[17px] font-medium text-white/60">Allocation</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={balanced ? "ok" : "drift"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[15px] tabular-nums",
                balanced ? "bg-lime text-ink" : "bg-down/15 text-down",
              )}
            >
              {balanced ? <CheckCircleIcon size={12} weight="fill" /> : <GaugeIcon size={12} weight="fill" />}
              {balanced ? "On target · drift 0.3%" : "Drift detected · 4.2%"}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex h-16 gap-[3px] overflow-hidden rounded-[12px]">
          {SLICES.map((s) => (
            <motion.div
              key={s.name}
              initial={false}
              animate={{ flexGrow: balanced ? s.target : s.drift }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className="relative basis-0 rounded-[6px] border border-lime/30"
              style={s.level === 1 ? { background: LIME } : ditherStyle(pal.dither, s.level, 2)}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
          {SLICES.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-[15px] text-white/60">
              <span className="size-3 shrink-0 rounded-[3px] border border-lime/30" style={s.level === 1 ? { background: LIME } : ditherStyle(pal.dither, s.level, 1)} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto font-mono text-white">
                <RollingNumber value={`${balanced ? s.target : s.drift}%`} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
}

/* ---------- Tax-loss harvesting ---------- */

const BARS = [22, 30, 26, 41, 38, 52, 49, 63, 70, 84, 92, 100];

function TaxLoss() {
  return (
    <BentoCard delay={0.08} className="min-h-[460px]">
      <CardHead
        icon={<LeafIcon size={14} weight="fill" />}
        label="Tax-loss harvesting"
        title="Losses that pay you back."
        body="Zuno sells losers at the right moment to offset your gains, then rebuys similar funds so you never sit out."
      />
      <div className="mt-auto pt-8">
        <div className="text-[44px] font-semibold leading-none tracking-[-0.04em]">
          <Counter to={1840} prefix="$" />
        </div>
        <div className="mt-2 text-[15px] text-white/60">average tax saved per customer in 2025*</div>
        <div className="mt-6 flex h-28 items-end gap-1.5">
          {BARS.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 origin-bottom overflow-hidden rounded-t-[4px]"
              style={{ height: `${h}%`, ...ditherStyle(pal.dither, 0.25 + (i / BARS.length) * 0.75, 2) }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: EASE_OUT }}
            >
              <div className="h-[3px] w-full bg-accent" />
            </motion.div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[15px] tabular-nums text-white/60">
          <span>JAN</span>
          <span>DEC</span>
        </div>
      </div>
    </BentoCard>
  );
}

/* ---------- Risk radar ---------- */

const BLIPS = [
  { a: 40, r: 0.62, label: "NVDA" },
  { a: 115, r: 0.38, label: "BND" },
  { a: 200, r: 0.78, label: "BTC" },
  { a: 290, r: 0.5, label: "VTI" },
  { a: 330, r: 0.25, label: "CASH" },
];
const SWEEP = 4;

function RiskRadar() {
  return (
    <BentoCard delay={0.04}>
      <CardHead
        icon={<GaugeIcon size={14} weight="fill" />}
        label="Risk radar"
        title="Stress-tested every night."
        body="Every night Zuno stress-tests your holdings against 2,000+ scenarios, from rate shocks to crypto winters."
      />
      <div className="relative mx-auto mt-8 aspect-square w-full max-w-[260px]">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-[16%] rounded-full border border-white/[0.08]" />
        <div className="absolute inset-[33%] rounded-full border border-white/[0.06]" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg 290deg, color-mix(in oklab, var(--zn-accent) 4%, transparent) 300deg, color-mix(in oklab, var(--zn-accent) 40%, transparent) 360deg)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: SWEEP, repeat: Infinity, ease: "linear" }}
        />
        {BLIPS.map((b) => {
          const rad = ((b.a - 90) * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * b.r * 50;
          const y = 50 + Math.sin(rad) * b.r * 50;
          return (
            <div key={b.label} className="absolute" style={{ left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` }}>
              <motion.span
                className="absolute -left-1 -top-1 block size-2 bg-accent"
                animate={{ opacity: [1, 0.25, 0.25], scale: [1.8, 1, 1] }}
                transition={{ duration: SWEEP, repeat: Infinity, delay: (b.a / 360) * SWEEP, times: [0, 0.5, 1], ease: "easeOut" }}
              />
              <span className="absolute left-2.5 top-[-7px] text-[15px] tabular-nums text-white/60">{b.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <div>
          <div className="text-[15px] text-white/60">Portfolio risk</div>
          <div className="text-[17px] font-medium">Moderate · 12.4% vol</div>
        </div>
        <div className="flex gap-[3px]">
          {[1, 1, 1, 0.5, 0.2].map((l, i) => (
            <span key={i} className="h-6 w-2.5 rounded-[2px]" style={l === 1 ? { background: LIME } : ditherStyle(pal.dither, l, 1)} />
          ))}
        </div>
      </div>
    </BentoCard>
  );
}

/* ---------- Round-ups ---------- */

const PURCHASES = [
  { icon: CoffeeIcon, name: "Blue Bottle Coffee", amt: 4.35 },
  { icon: CarIcon, name: "Uber", amt: 18.2 },
  { icon: ShoppingBagIcon, name: "Everlane", amt: 62.5 },
  { icon: ForkKnifeIcon, name: "Sweetgreen", amt: 14.75 },
  { icon: TrainIcon, name: "Metro card", amt: 2.9 },
  { icon: MusicNotesIcon, name: "Spotify", amt: 11.99 },
];

const roundUp = (amt: number) => Math.round((Math.ceil(amt) - amt || 1) * 100) / 100;

function RoundUps() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const [step, setStep] = useState(2);
  const L = PURCHASES.length;
  const items = [step % L, (step - 1) % L, (step - 2) % L];
  let total = 14.2;
  for (let i = 3; i <= step; i++) total += roundUp(PURCHASES[i % L].amt);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setStep((s) => s + 1), 2300);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <BentoCard delay={0.1}>
      <CardHead
        icon={<CoinsIcon size={14} weight="fill" />}
        label="Round-ups"
        title="Spare change, compounding."
        body="Round every purchase up to the next dollar and invest the difference. Pocket change, compounding."
      />
      <div ref={ref} className="mt-8 h-[186px] space-y-2 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((idx) => {
            const p = PURCHASES[idx];
            const Icon = p.icon;
            const up = roundUp(p.amt);
            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
              >
                <span className="grid size-9 place-items-center rounded-[9px] bg-white/[0.06]">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{p.name}</span>
                  <span className="block text-[15px] tabular-nums text-white/60">{formatUSD(p.amt)}</span>
                </span>
                <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[15px] tabular-nums text-accent">+{formatUSD(up)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-white/[0.07] pt-4">
        <span className="text-[15px] text-white/60">Invested this week</span>
        <span className="text-[26px] font-semibold tracking-tight">
          <RollingNumber value={formatUSD(total)} />
        </span>
      </div>
    </BentoCard>
  );
}

/* ---------- Smart cash ---------- */

function SmartCash() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!inView) return;
    // $24,580 at 4.10% APY is about $2.76/day. Sped up 40x so you can watch it accrue.
    const perMs = (24580 * 0.041) / 365 / 86_400_000;
    let value = 2.7614;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      value += (now - last) * perMs * 40;
      last = now;
      if (ref.current) ref.current.textContent = value.toFixed(6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <BentoCard delay={0.16}>
      <CardHead
        icon={<BankIcon size={14} weight="fill" />}
        label="Smart cash"
        title="Idle cash, earning while it waits."
        body="Idle cash earns a high yield while it waits for the next opportunity. Withdraw any time, no minimums."
      />
      <div className="mt-auto pt-10">
        <div className="flex items-baseline gap-2">
          <span className="text-[64px] font-semibold leading-none tracking-[-0.05em]">
            <Counter to={4.1} decimals={2} />
          </span>
          <span className="text-[28px] font-semibold tracking-tight text-white/60">% APY</span>
        </div>
        <div className="mt-6 rounded-[12px] border border-white/[0.08] bg-ink/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-[15px] text-white/60">
            <span>Interest earned today</span>
            <span className="flex items-center gap-1.5 text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-lime" /> accruing
            </span>
          </div>
          <div className="mt-1 font-mono text-[22px] tabular-nums">
            $<span ref={ref}>2.761400</span>
          </div>
        </div>
        <p className="mt-3 text-[15px] text-white/60">Variable rate. FDIC-insured up to $2.5M through partner banks.</p>
      </div>
    </BentoCard>
  );
}

export function Features() {
  return (
    <section id="product" className="relative mx-auto max-w-[1280px] scroll-mt-24 px-5 pb-32 lg:px-8">
      <div className="mb-16 grid gap-6 lg:grid-cols-12">
        <SectionTitle className="lg:col-span-8" lead="A full-time wealth team." tail="In your pocket." />
        <p className="max-w-[420px] self-end text-[19px] leading-relaxed text-white/65 lg:col-span-4">
          The things private banks do for the very wealthy. Automated, explained in plain English, and starting at $0.
        </p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
        <Autopilot />
        <TaxLoss />
        <RiskRadar />
        <RoundUps />
        <SmartCash />
      </div>
    </section>
  );
}

