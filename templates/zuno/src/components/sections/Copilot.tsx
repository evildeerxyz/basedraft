"use client";

import {
  AirplaneIcon,
  ArrowUpIcon,
  ChartPieSliceIcon,
  CheckIcon,
  EyeIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  SunHorizonIcon,
  TrendDownIcon,
  type Icon,
} from "@phosphor-icons/react";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { linePath, makeSeries } from "@/lib/chart";
import { ditherStyle } from "@/lib/dither";
import { pal } from "@/lib/palette";
import { cn, EASE_OUT } from "@/lib/utils";
import { DitherCanvas, fields } from "../dither/DitherCanvas";
import { LogoMark } from "../ui/Logo";
import { SectionTitle } from "../ui/Section";

type Viz = "exposure" | "spend" | "drop" | "retire";

const CONVOS: Array<{ icon: Icon; q: string; a: string; viz: Viz; actions: [string, string]; steps: string[] }> = [
  {
    icon: ChartPieSliceIcon,
    q: "Am I too exposed to tech?",
    a: "A little, yes. Tech is 38% of your portfolio against a 26% target for your Growth plan, mostly from NVDA (14%) and QQQ (11%). I can trim $2,140 and spread it across VXUS and BND. Estimated tax impact: $0, because I'll sell lots that are currently at a loss first.",
    viz: "exposure",
    actions: ["Rebalance now", "Show me the trades"],
    steps: ["Reading 14 holdings", "Comparing to your target mix", "Checking tax lots"],
  },
  {
    icon: AirplaneIcon,
    q: "Can I afford a $4,000 trip in June?",
    a: "Yes, comfortably. Your safe-to-spend this quarter is $5,320 after rent, bills and your $500/mo auto-deposit. I'd fund it from your cash reserve rather than selling investments, which keeps your retirement goal on track for 58.",
    viz: "spend",
    actions: ["Create a trip goal", "Keep things as is"],
    steps: ["Scanning 90 days of spending", "Projecting upcoming bills", "Protecting your goals"],
  },
  {
    icon: TrendDownIcon,
    q: "Why is my portfolio down today?",
    a: "You're down 1.2% ($578), mostly because chip stocks sold off this morning. NVDA alone explains 0.7% of it. That's well inside your normal range: your typical daily swing is ±1.4%. No action needed. I've paused tomorrow's NVDA buy until volatility settles.",
    viz: "drop",
    actions: ["Explain my risk", "Got it"],
    steps: ["Attributing today's move", "Checking your normal range", "Reviewing scheduled trades"],
  },
  {
    icon: SunHorizonIcon,
    q: "Can I retire at 55?",
    a: "On your current path of $1,250 a month at a 7% expected return, you'd have about $1.62M at 55. That covers roughly $64K a year at a 4% withdrawal rate. Adding $200 a month gets you to $1.88M. Want me to set that up?",
    viz: "retire",
    actions: ["Add $200/mo", "Model other ages"],
    steps: ["Running 10,000 simulations", "Adjusting for inflation", "Stress-testing the plan"],
  },
];

function ThinkingPixels() {
  // 3×3 grid that lights up in Bayer order.
  const order = [0, 6, 2, 8, 4, 3, 7, 1, 5];
  return (
    <span className="grid grid-cols-3 gap-[2px]">
      {order.map((o, i) => (
        <motion.span
          key={i}
          className="size-[4px] bg-accent"
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: o * 0.11 }}
        />
      ))}
    </span>
  );
}

function ExposureViz() {
  const rows = [
    { k: "Tech", now: 38, target: 26 },
    { k: "International", now: 11, target: 18 },
    { k: "Bonds", now: 12, target: 15 },
    { k: "Healthcare", now: 9, target: 11 },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.k}>
          <div className="mb-1 flex justify-between text-[15px] tabular-nums text-white/60">
            <span>{r.k}</span>
            <span>
              <span className={r.now > r.target ? "text-down" : "text-white"}>{r.now}%</span> → <span className="text-accent">{r.target}%</span>
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={ditherStyle(pal.dither, 0.5, 1)}
              initial={{ width: 0 }}
              animate={{ width: `${(r.now / 40) * 100}%` }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_OUT }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(r.target / 40) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: EASE_OUT }}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-4 pt-1 text-[15px] tabular-nums text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={ditherStyle(pal.dither, 0.5, 1)} /> current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-accent" /> after rebalance
        </span>
      </div>
    </div>
  );
}

/** Semicircle gauge. The needle is placed with trig so it always pivots on the hub. */
function SpendViz() {
  const arc = "M 20 100 A 80 80 0 0 1 180 100";
  const t = useMotionValue(0);
  const x2 = useTransform(t, (v) => 100 - 60 * Math.cos(Math.PI * v));
  const y2 = useTransform(t, (v) => 100 - 60 * Math.sin(Math.PI * v));

  useEffect(() => {
    const a = animate(t, 0.75, { duration: 1.2, ease: EASE_OUT });
    return () => a.stop();
  }, [t]);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 200 112" className="w-[170px] shrink-0">
        <path d={arc} fill="none" stroke={pal.soft} strokeOpacity={0.1} strokeWidth="14" strokeLinecap="round" />
        <motion.path d={arc} fill="none" stroke={pal.accent} strokeWidth="14" strokeLinecap="round" style={{ pathLength: t }} />
        <motion.line x1={100} y1={100} x2={x2} y2={y2} stroke={pal.soft} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill={pal.soft} />
      </svg>
      <div>
        <div className="text-[15px] font-medium text-white/60">Safe to spend</div>
        <div className="text-[28px] font-semibold tracking-tight">$5,320</div>
        <div className="mt-1 text-[15px] text-white/60">
          Trip <span className="text-white">$4,000</span> · buffer <span className="text-accent">$1,320</span>
        </div>
      </div>
    </div>
  );
}

function DropViz() {
  const d = useMemo(() => {
    const s = makeSeries(91, 40, -0.9).map((v, i) => (i > 30 ? v + (i - 30) * 0.012 : v));
    return linePath(s, 300, 90, 8);
  }, []);
  return (
    <div>
      <svg viewBox="0 0 300 90" className="h-[90px] w-full overflow-visible">
        <defs>
          <pattern id="zuno-band" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill={pal.dither} opacity="0.35" />
          </pattern>
        </defs>
        <rect x="0" y="22" width="300" height="50" fill="url(#zuno-band)" />
        <line x1="0" x2="300" y1="22" y2="22" stroke={pal.accent} strokeOpacity="0.35" strokeDasharray="2 3" />
        <line x1="0" x2="300" y1="72" y2="72" stroke={pal.accent} strokeOpacity="0.35" strokeDasharray="2 3" />
        <motion.path
          d={d}
          fill="none"
          stroke={pal.down}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: EASE_OUT }}
        />
      </svg>
      <div className="mt-2 flex justify-between text-[15px] tabular-nums text-white/60">
        <span>9:30</span>
        <span className="text-accent">▒ your normal range (±1.4%)</span>
        <span>now</span>
      </div>
    </div>
  );
}

function RetireViz() {
  const base = "M0,88 C60,86 110,78 160,62 C210,46 250,30 300,16";
  const boosted = "M0,88 C60,85 110,74 160,55 C210,36 250,16 300,4";
  return (
    <div>
      <svg viewBox="0 0 300 96" className="h-[96px] w-full overflow-visible">
        <motion.path d={boosted} fill="none" stroke={pal.soft} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4, ease: EASE_OUT }} />
        <motion.path d={base} fill="none" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EASE_OUT }} />
        <motion.circle cx={300} cy={16} fill={pal.accent} initial={{ r: 0 }} animate={{ r: 5 }} transition={{ delay: 1.3, type: "spring" }} />
        <motion.circle cx={300} cy={16} fill="none" stroke={pal.accent} strokeOpacity={0.4} initial={{ r: 0 }} animate={{ r: 10 }} transition={{ delay: 1.4, type: "spring" }} />
      </svg>
      <div className="mt-2 flex justify-between text-[15px] tabular-nums text-white/60">
        <span>Today · 34</span>
        <span>
          <span className="text-white/60">- - +$200/mo → $1.88M</span>
        </span>
        <span className="text-accent">55 · $1.62M</span>
      </div>
    </div>
  );
}

const VIZ: Record<Viz, ComponentType> = {
  exposure: ExposureViz,
  spend: SpendViz,
  drop: DropViz,
  retire: RetireViz,
};

type Phase = "idle" | "thinking" | "streaming" | "done";

export function Copilot() {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState(0);
  const [step, setStep] = useState(0);

  const convo = CONVOS[active];
  const words = useMemo(() => convo.a.split(" "), [convo]);

  // Each new question (run) plays: thinking steps, then a streamed answer.
  useEffect(() => {
    if (run === 0) return;
    const s1 = setTimeout(() => setStep(1), 450);
    const s2 = setTimeout(() => setStep(2), 900);
    const t = setTimeout(() => setPhase("streaming"), 1350);
    return () => {
      clearTimeout(t);
      clearTimeout(s1);
      clearTimeout(s2);
    };
  }, [run]);

  useEffect(() => {
    if (phase !== "streaming") return;
    const t = setTimeout(() => {
      if (shown >= words.length) setPhase("done");
      else setShown(shown + 1);
    }, 34);
    return () => clearTimeout(t);
  }, [phase, shown, words.length]);

  const choose = (i: number) => {
    setActive(i);
    setPhase("thinking");
    setShown(0);
    setStep(0);
    setRun((r) => r + 1);
  };

  const VizComponent = VIZ[convo.viz];

  return (
    <motion.section
      id="copilot"
      className="relative scroll-mt-10 overflow-hidden bg-paper text-ink"
      viewport={{ once: true, margin: "-25% 0px" }}
      onViewportEnter={() => run === 0 && choose(0)}
    >
      <DitherCanvas field={fields.fadeDown(2.4)} color={pal.bg} opacity={1} pixelSize={4} className="h-16" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 py-28 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:px-8 lg:py-36">
        <div>
          <SectionTitle tone="light" lead="Your money," tail="finally explained." />
          <p className="mt-7 max-w-[500px] text-[19px] leading-relaxed text-ink/65 sm:text-[20px]">
            Copilot is a financial brain trained on your real accounts, not generic advice. It answers in seconds, shows its
            working, and never moves a dollar without your OK.
          </p>

          <LayoutGroup id="copilot-prompts">
            <div className="mt-10 space-y-2">
              {CONVOS.map((c, i) => {
                const Icon = c.icon;
                const on = i === active;
                return (
                  <button
                    key={c.q}
                    onClick={() => choose(i)}
                    aria-pressed={on}
                    className={cn(
                      "group relative flex w-full items-center gap-4 rounded-[12px] px-4 py-3.5 text-left transition-colors",
                      on ? "text-paper" : "text-ink hover:bg-ink/[0.05]",
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="copilot-active"
                        className="absolute inset-0 rounded-[12px] bg-ink"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span className={cn("relative grid size-9 place-items-center rounded-[9px]", on ? "bg-lime text-ink" : "bg-ink/[0.07]")}>
                      <Icon size={17} weight="bold" />
                    </span>
                    <span className="relative flex-1 text-[17px] font-medium">{c.q}</span>
                    <ArrowUpIcon
                      size={15}
                      weight="bold"
                      className={cn("relative rotate-45 transition-all", on ? "opacity-100" : "opacity-0 group-hover:opacity-50")}
                    />
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { icon: EyeIcon, t: "Reads your real holdings" },
              { icon: ChartPieSliceIcon, t: "Shows its working" },
              { icon: ShieldCheckIcon, t: "Asks before it trades" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center gap-2 text-[15px] text-ink/65">
                <Icon size={15} className="shrink-0 text-ink" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* chat window */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: EASE_OUT }}
            className="relative flex h-[600px] flex-col overflow-hidden rounded-[20px] bg-ink text-paper ring-1 ring-ink/10"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-3">
                <LogoMark size={30} />
                <div className="leading-tight">
                  <div className="text-[16px] font-semibold">Copilot</div>
                  <div className="flex items-center gap-1.5 text-[15px] text-white/60">
                    <span className="size-1.5 rounded-full bg-lime" /> Online · connected to 3 accounts
                  </div>
                </div>
              </div>
              <span className="text-[15px] tabular-nums text-white/60">ZUNO-2</span>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${active}-${run}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {phase !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 26 }}
                      className="ml-auto w-fit max-w-[80%] rounded-[14px] rounded-br-[4px] bg-paper px-4 py-2.5 text-[16px] font-medium text-ink"
                    >
                      {convo.q}
                    </motion.div>
                  )}

                  {phase === "thinking" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                      <span className="mt-1">
                        <ThinkingPixels />
                      </span>
                      <div className="space-y-1.5 text-[15px] tabular-nums">
                        {convo.steps.slice(0, step + 1).map((s, i) => (
                          <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={i < step ? "text-white/60" : "text-white/80"}>
                            {i < step ? "✓" : "›"} {s}…
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {(phase === "streaming" || phase === "done") && (
                    <div className="flex gap-3">
                      <LogoMark size={26} animated={false} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] leading-[1.6] text-white/85">
                          {words.slice(0, shown).join(" ")}
                          {phase === "streaming" && <span className="caret-blink ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] bg-lime" />}
                        </p>
                        <AnimatePresence>
                          {phase === "done" && (
                            <motion.div
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: EASE_OUT }}
                            >
                              <div className="mt-4 rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-4">
                                <VizComponent />
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button className="inline-flex items-center gap-1.5 rounded-[9px] bg-lime px-3.5 py-2 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]">
                                  <CheckIcon size={13} weight="bold" /> {convo.actions[0]}
                                </button>
                                <button className="rounded-[9px] border border-white/12 px-3.5 py-2 text-[15px] text-white/80 transition-colors hover:bg-white/5">
                                  {convo.actions[1]}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-t border-white/[0.07] p-4">
              <div className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.03] py-1.5 pl-4 pr-1.5">
                <span className="flex-1 truncate text-[16px] text-white/60">Ask about your money…</span>
                <MicrophoneIcon size={18} className="text-white/60" />
                <button
                  onClick={() => choose((active + 1) % CONVOS.length)}
                  aria-label="Ask next example question"
                  className="grid size-9 place-items-center rounded-[9px] bg-lime text-ink transition-transform hover:scale-105"
                >
                  <ArrowUpIcon size={16} weight="bold" />
                </button>
              </div>
              <p className="mt-2.5 text-center text-[15px] text-white/60">
                Copilot can make mistakes. Trades always need your approval.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
