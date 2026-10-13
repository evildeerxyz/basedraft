"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { areaPath, linePath } from "@/lib/chart";
import { pal } from "@/lib/palette";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { SectionTitle } from "../ui/Section";

const STRATEGIES = [
  { id: "conservative", label: "Conservative", rate: 0.052, mix: "30% stocks" },
  { id: "balanced", label: "Balanced", rate: 0.068, mix: "60% stocks" },
  { id: "growth", label: "Growth", rate: 0.081, mix: "90% stocks" },
];
const FEE = 0.0025;
const SAVINGS_APY = 0.005;
const SAMPLES = 41;
const H = 260;

function futureValue(principal: number, monthly: number, annualRate: number, years: number) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal + monthly * n;
  const g = Math.pow(1 + r, n);
  return principal * g + (monthly * (g - 1)) / r;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[16px] text-white/60">{label}</span>
        <span className="font-mono text-[17px] tabular-nums text-white">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="zuno-range mt-2"
        style={{ "--fill": `${pct}%` } as CSSProperties}
      />
    </label>
  );
}

function AnimatedUSD({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 70, damping: 20 });
  const text = useTransform(spring, (v) => formatUSD(v, 0));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

export function Simulator() {
  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(25);
  const [strategy, setStrategy] = useState(2);
  const [hover, setHover] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rate = STRATEGIES[strategy].rate - FEE;

  const data = useMemo(() => {
    const zuno: number[] = [];
    const savings: number[] = [];
    const contributed: number[] = [];
    for (let k = 0; k < SAMPLES; k++) {
      const t = (years * k) / (SAMPLES - 1);
      zuno.push(futureValue(initial, monthly, rate, t));
      savings.push(futureValue(initial, monthly, SAVINGS_APY, t));
      contributed.push(initial + monthly * 12 * t);
    }
    const max = Math.max(zuno[SAMPLES - 1] * 1.06, 1);
    const norm = (arr: number[]) => arr.map((v) => v / max);
    return {
      zuno,
      savings,
      contributed,
      zunoLine: linePath(norm(zuno), W, H, 4),
      zunoArea: areaPath(norm(zuno), W, H, 4),
      savingsLine: linePath(norm(savings), W, H, 4),
      contribLine: linePath(norm(contributed), W, H, 4),
      max,
    };
  }, [initial, monthly, years, rate, W]);

  const final = data.zuno[SAMPLES - 1];
  const put = data.contributed[SAMPLES - 1];
  const sav = data.savings[SAMPLES - 1];

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.round(((e.clientX - r.left) / r.width) * (SAMPLES - 1));
    setHover(Math.max(0, Math.min(SAMPLES - 1, k)));
  };
  const hx = hover !== null ? (hover / (SAMPLES - 1)) * 100 : 0;
  const hy = hover !== null ? 4 + (1 - data.zuno[hover] / data.max) * (H - 8) : 0;

  return (
    <section id="simulator" className="relative mx-auto max-w-[1280px] px-5 py-32 lg:px-8">
      <div className="mb-16 grid gap-6 lg:grid-cols-12">
        <SectionTitle className="lg:col-span-8" lead="See what time" tail="can do for you." />
        <p className="max-w-[420px] self-end text-[19px] leading-relaxed text-white/65 lg:col-span-4">
          Drag the sliders. The magic isn&apos;t picking stocks. It&apos;s starting early, staying invested and keeping fees low.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="relative isolate grid overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2 lg:grid-cols-[380px_1fr]"
      >
        <div className="space-y-8 p-7 lg:p-10">
          <Slider label="Starting amount" value={initial} min={0} max={100000} step={500} onChange={setInitial} format={(v) => formatUSD(v, 0)} />
          <Slider label="Monthly deposit" value={monthly} min={0} max={5000} step={50} onChange={setMonthly} format={(v) => formatUSD(v, 0)} />
          <Slider label="Time invested" value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
          <div>
            <div className="text-[16px] text-white/60">Strategy</div>
            <LayoutGroup id="strategy">
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-[12px] bg-white/[0.04] p-1">
                {STRATEGIES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(i)}
                    aria-pressed={i === strategy}
                    className={cn("relative rounded-[9px] px-2 py-2.5 text-[15px] font-medium transition-colors", i === strategy ? "text-ink" : "text-white/60 hover:text-white")}
                  >
                    {i === strategy && <motion.span layoutId="strategy-pill" className="absolute inset-0 rounded-[9px] bg-lime" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                    <span className="relative block">{s.label}</span>
                    <span className={cn("relative block text-[15px] tabular-nums", i === strategy ? "text-ink/60" : "text-white/60")}>{s.mix}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
          <p className="flex gap-2.5 text-[15px] leading-relaxed text-white/60">
            <InfoIcon size={17} className="mt-0.5 shrink-0" />
            Hypothetical illustration using {(STRATEGIES[strategy].rate * 100).toFixed(1)}% average annual returns after fund costs, compounded monthly. Not a
            guarantee. Real returns vary and you can lose money.
          </p>
        </div>

        <div className="flex flex-col p-7 lg:p-10">
          <div className="text-[16px] text-white/60">In {years} years you could have</div>
          <div className="mt-2 text-[clamp(2.8rem,6vw,5.2rem)] font-semibold leading-none tracking-[-0.05em]">
            <AnimatedUSD value={hover !== null ? data.zuno[hover] : final} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[15px] text-white/60">
              You put in <span className="font-mono text-white">{formatUSD(put, 0)}</span>
            </span>
            <span className="rounded-full bg-lime/15 px-3 py-1.5 text-[15px] text-accent">
              Growth <span className="font-mono">+{formatUSD(Math.max(0, final - put), 0)}</span>
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[15px] text-white/60">
              Savings account <span className="font-mono text-white">{formatUSD(sav, 0)}</span>
            </span>
          </div>

          <div ref={chartRef} className="relative mt-10 flex-1" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full overflow-visible">
              <defs>
                <pattern id="zuno-sim-dither" width="4" height="4" patternUnits="userSpaceOnUse">
                  <rect width="2" height="2" fill={pal.dither} />
                  <rect x="2" y="2" width="2" height="2" fill={pal.dither} />
                </pattern>
                <linearGradient id="zuno-sim-fade" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
                </linearGradient>
                <mask id="zuno-sim-mask">
                  <rect width={W} height={H} fill="url(#zuno-sim-fade)" />
                </mask>
              </defs>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="#fff" strokeOpacity={0.05} vectorEffect="non-scaling-stroke" />
              ))}
              <motion.path initial={false} animate={{ d: data.zunoArea }} transition={{ duration: 0.6, ease: EASE_OUT }} fill="url(#zuno-sim-dither)" mask="url(#zuno-sim-mask)" />
              <motion.path initial={false} animate={{ d: data.contribLine }} transition={{ duration: 0.6, ease: EASE_OUT }} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
              <motion.path initial={false} animate={{ d: data.savingsLine }} transition={{ duration: 0.6, ease: EASE_OUT }} fill="none" stroke={pal.soft} strokeOpacity={0.7} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <motion.path initial={false} animate={{ d: data.zunoLine }} transition={{ duration: 0.6, ease: EASE_OUT }} fill="none" stroke={pal.accent} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </svg>
            {hover !== null && (
              <>
                <div className="pointer-events-none absolute inset-y-0 w-px bg-white/25" style={{ left: `${hx}%` }} />
                <div
                  className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime bg-ink"
                  style={{ left: `${hx}%`, top: `${(hy / H) * 260}px` }}
                />
                <div
                  className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-full bg-paper px-2.5 py-1 text-[15px] tabular-nums text-ink"
                  style={{ left: `${Math.min(92, Math.max(8, hx))}%` }}
                >
                  Year {((years * hover) / (SAMPLES - 1)).toFixed(0)}
                </div>
              </>
            )}
            <div className="mt-3 flex justify-between text-[15px] tabular-nums text-white/60">
              <span>Today</span>
              <span>{Math.round(years / 2)} yrs</span>
              <span>{years} yrs</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-5 text-[15px] text-white/60">
              <span className="flex items-center gap-2"><span className="h-[3px] w-5 rounded bg-lime" /> Zuno {STRATEGIES[strategy].label}</span>
              <span className="flex items-center gap-2"><span className="h-[2px] w-5 rounded bg-paper/70" /> Savings at 0.5%</span>
              <span className="flex items-center gap-2"><span className="h-0 w-5 border-t border-dashed border-white/40" /> Your deposits</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
