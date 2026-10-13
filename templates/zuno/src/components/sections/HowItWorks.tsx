"use client";

import { CheckIcon, CircleIcon } from "@phosphor-icons/react";
import {
  LayoutGroup,
  motion,
  useInView,
  useMotionTemplate,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { ditherStyle } from "@/lib/dither";
import { pal } from "@/lib/palette";
import { cn, EASE_OUT } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { SectionTitle } from "../ui/Section";

const INK = "#0a0a0a";

function useCycle(length: number, ms: number, active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms, active]);
  return i;
}

/* ---------- 01 · quiz ---------- */

const GOALS = ["Retire early", "Buy a home", "Build wealth", "Kid's college"];

function QuizVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const goal = useCycle(GOALS.length, 1700, inView);
  return (
    <div ref={ref} className="relative flex h-full items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="relative w-full max-w-[380px] rounded-[16px] bg-white p-4 sm:p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] ring-1 ring-ink/5">
        <div className="flex items-center justify-between text-[17px] font-medium text-ink/60">
          <span>Step 2 of 6</span>
          <span className="flex gap-1">
            {[1, 1, 0, 0, 0, 0].map((on, i) => (
              <span key={i} className={cn("h-1 w-4 rounded-full", on ? "bg-ink" : "bg-ink/10")} />
            ))}
          </span>
        </div>
        <div className="mt-3 text-[17px] font-semibold tracking-tight text-ink sm:mt-5 sm:text-[19px]">What are you investing for?</div>
        <LayoutGroup id="quiz">
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
            {GOALS.map((g, i) => (
              <div key={g} className={cn("relative rounded-[10px] border px-3 py-2.5 text-[15px] font-medium transition-colors sm:py-3", i === goal ? "border-ink text-ink" : "border-ink/10 text-ink/60")}>
                {i === goal && <motion.span layoutId="quiz-goal" className="absolute inset-0 rounded-[9px] bg-lime" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                <span className="relative flex items-center justify-between">
                  {g}
                  {i === goal && <CheckIcon size={13} weight="bold" />}
                </span>
              </div>
            ))}
          </div>
        </LayoutGroup>
        <div className="mt-4 text-[15px] font-medium text-ink sm:mt-6">If your portfolio dropped 20%, you&apos;d…</div>
        <div className="relative mt-3 h-8">
          <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 gap-1">
            {[0.15, 0.3, 0.5, 0.75, 1].map((l, i) => (
              <span key={i} className="flex-1 rounded-full" style={ditherStyle(pal.bg, l, 1)} />
            ))}
          </div>
          <motion.span
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-white bg-ink shadow-md"
            animate={inView ? { left: ["20%", "72%", "58%", "58%"] } : undefined}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.6, 1], ease: "easeInOut" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[15px] tabular-nums text-ink/60">
          <span>Sell everything</span>
          <span>Buy more</span>
        </div>
        <button className="mt-6 hidden h-11 w-full items-center justify-center rounded-[10px] bg-ink text-[16px] font-medium text-paper sm:flex">Continue</button>
      </div>
    </div>
  );
}

/* ---------- 02 · planet ---------- */

const ORBIT = [
  { label: "US stocks", v: "42%" },
  { label: "Intl", v: "18%" },
  { label: "Bonds", v: "22%" },
  { label: "Crypto", v: "8%" },
  { label: "Cash", v: "10%" },
];

function PlanetVisual() {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden">
      <DitherShader shape="planet" ring orb={[0.5, 0.5, 0.26]} color={INK} pixelSize={3} speed={1.4} interactive />
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}>
        {ORBIT.map((o, i) => {
          const a = (i / ORBIT.length) * Math.PI * 2;
          return (
            <div key={o.label} className="absolute" style={{ left: `${(50 + Math.cos(a) * 38).toFixed(2)}%`, top: `${(50 + Math.sin(a) * 36).toFixed(2)}%` }}>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[15px] tabular-nums text-paper"
              >
                {o.label} <span className="text-accent">{o.v}</span>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ---------- 03 · timeline ---------- */

const EVENTS = [
  { t: "Mon 09:31", e: "Deposited $500 from Chase ••4417" },
  { t: "Mon 09:32", e: "Bought 1.42 VTI · 0.88 VXUS · 2.1 BND" },
  { t: "Wed 14:10", e: "Harvested a $212 loss in QQQ → QQQM" },
  { t: "Fri 16:00", e: "Reinvested $18.40 of dividends" },
  { t: "Fri 16:01", e: "Rebalanced: drift back to 0.2%" },
];

function TimelineVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const active = useCycle(EVENTS.length + 1, 1300, inView);
  return (
    <div ref={ref} className="relative flex h-full items-center p-4 sm:p-6 lg:p-10">
      <div className="relative w-full max-w-[420px] max-sm:scale-[0.9] lg:mx-auto">
        <div className="absolute bottom-3 left-[11px] top-3 w-px bg-white/10" />
        <motion.div
          className="absolute bottom-3 left-[11px] top-3 w-px origin-top bg-lime"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: Math.min(active, EVENTS.length - 1) / (EVENTS.length - 1) }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
        <div className="space-y-5">
          {EVENTS.map((ev, i) => {
            const done = i < active;
            const now = i === active;
            return (
              <motion.div key={ev.t + i} className="relative flex items-start gap-4" animate={{ opacity: done || now ? 1 : 0.35 }}>
                <span className={cn("relative z-10 grid size-[23px] shrink-0 place-items-center rounded-full border", done ? "border-lime bg-lime text-ink" : "border-white/20 bg-ink-3")}>
                  {done ? <CheckIcon size={12} weight="bold" /> : <CircleIcon size={7} weight="fill" className={now ? "text-accent" : "text-white/60"} />}
                  {now && <motion.span className="absolute inset-0 rounded-full border border-lime" animate={{ scale: [1, 1.9], opacity: [1, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />}
                </span>
                <div className={cn("flex-1 rounded-[12px] border px-4 py-3 transition-colors", now ? "border-lime/40 bg-lime/[0.06]" : "border-white/[0.06] bg-white/[0.02]")}>
                  <div className="text-[15px] tabular-nums text-white/60">{ev.t} · Autopilot</div>
                  <div className="mt-0.5 text-[16px]">{ev.e}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const STEPS: Array<{
  n: string;
  title: string;
  body: string;
  bullets: string[];
  theme: "paper" | "lime" | "dark";
  Visual: ComponentType;
}> = [
  {
    n: "01",
    title: "Tell Zuno what you’re investing for.",
    body: "Answer a few questions about your goals, timeline and how you’d feel in a downturn. No jargon, no 40-page forms.",
    bullets: ["Takes about three minutes", "Link your bank in a few taps", "Start with as little as $1"],
    theme: "paper",
    Visual: QuizVisual,
  },
  {
    n: "02",
    title: "Get a portfolio built around you.",
    body: "Copilot designs a diversified mix of low-cost ETFs and bonds, plus a slice of crypto if you want one, tuned to your exact risk score.",
    bullets: ["6,000+ stocks and ETFs", "Average fund fee of 0.06%", "Add themes you care about"],
    theme: "lime",
    Visual: PlanetVisual,
  },
  {
    n: "03",
    title: "Then let it run on autopilot.",
    body: "Deposits are invested the moment they land. Zuno rebalances, harvests losses and reinvests dividends, and tells you why every time.",
    bullets: ["Real-time notifications", "Pause or override anytime", "A plain-English weekly recap"],
    theme: "dark",
    Visual: TimelineVisual,
  },
];

const THEMES = {
  paper: "bg-paper text-ink",
  lime: "bg-lime text-ink",
  dark: "bg-ink-3 text-paper ring-1 ring-white/10",
};

function StackCard({ step, i, progress }: { step: (typeof STEPS)[number]; i: number; progress: MotionValue<number> }) {
  const total = STEPS.length;
  const depth = total - 1 - i;
  const scale = useTransform(progress, [i / total, 1], [1, 1 - depth * 0.05]);
  const brightness = useTransform(progress, [i / total, 1], [1, 1 - depth * 0.22]);
  const filter = useMotionTemplate`brightness(${brightness})`;
  const { Visual } = step;
  const dark = step.theme === "dark";

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-3 sm:px-5">
      <motion.article
        style={{ scale, filter, top: `calc(-4vh + ${i * 30}px)` }}
        className={cn(
          "relative grid h-[min(640px,84vh)] w-full max-w-[1216px] origin-top grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[20px] lg:grid-cols-2 lg:grid-rows-1",
          THEMES[step.theme],
        )}
      >
        <div className="relative z-10 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          <div>
            <div className={cn("text-[17px] font-medium", dark ? "text-white/60" : "text-ink/60")}>Step {Number(step.n)}</div>
            <h3 className="mt-3 max-w-[460px] text-[clamp(1.6rem,3.6vw,3.3rem)] font-semibold leading-[1] tracking-[-0.04em] sm:mt-5">{step.title}</h3>
            <p className={cn("mt-3 max-w-[420px] text-[17px] leading-relaxed sm:mt-5 sm:text-[16px]", dark ? "text-white/70" : "text-ink/70")}>{step.body}</p>
          </div>
          <ul className="mt-8 hidden space-y-2.5 lg:block">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[16px] font-medium">
                <span className={cn("grid size-5 place-items-center rounded-full", dark ? "bg-lime text-ink" : "bg-ink text-accent")}>
                  <CheckIcon size={11} weight="bold" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-0">
          <Visual />
        </div>
      </motion.article>
    </div>
  );
}

export function HowItWorks() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });

  return (
    <section id="how" className="relative scroll-mt-0 bg-ink pt-32">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <SectionTitle className="lg:col-span-8" lead="Three minutes to set up." tail="Decades of compounding." />
          <p className="max-w-[420px] self-end text-[19px] leading-relaxed text-white/65 lg:col-span-4">
            No minimums, no paperwork marathons. Most people are fully invested before their coffee goes cold.
          </p>
        </div>
      </div>
      <div ref={container} className="relative mt-4">
        {STEPS.map((s, i) => (
          <StackCard key={s.n} step={s} i={i} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
