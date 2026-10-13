"use client";

import { CheckCircleIcon, LightningIcon, PauseCircleIcon, PiggyBankIcon, ReceiptIcon, ScalesIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { Stepper } from "../site/Stepper";
import { LogoMark } from "../ui/Logo";

const EXCHANGES = [
  { q: "Why did my portfolio drop today?", a: "Chip stocks fell 3.4% this morning. NVDA explains 0.7 of your 1.2% dip. That's inside your normal daily range, so nothing needs to change." },
  { q: "Can I afford to move in March?", a: "Yes. Deposit and moving costs come to about $6,800. Your cash covers it and your retirement goal stays on track for 58." },
  { q: "What did Autopilot do this week?", a: "Two things: it invested your $500 deposit across VTI and VXUS, and it harvested a $212 loss in QQQ. Estimated tax saved: $51." },
];

/** Hero visual: a dithered flow field with a live Copilot exchange on top. */
export function CopilotHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setI((v) => (v + 1) % EXCHANGES.length), 5200);
    return () => clearInterval(id);
  }, [inView]);
  const ex = EXCHANGES[i];

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2 sm:aspect-[5/5]">
      <DitherShader shape="flow" color="#c8ff3e" opacity={0.55} pixelSize={3} scale={1.2} intensity={0.75} interactive />
      <div className="absolute inset-x-5 bottom-5 sm:inset-x-8 sm:bottom-8">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: EASE_OUT }} className="space-y-3">
            <div className="ml-auto w-fit max-w-[85%] rounded-[16px] rounded-br-[4px] bg-paper px-4 py-2.5 text-[17px] font-medium text-ink">{ex.q}</div>
            <div className="flex max-w-[92%] gap-3 rounded-[16px] rounded-bl-[4px] bg-ink/90 p-4 text-[17px] leading-relaxed text-white/85 ring-1 ring-white/10">
              <LogoMark size={24} animated={false} className="mt-0.5" />
              <span>{ex.a}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- anatomy of an answer ---------- */

type Part = "data" | "rule" | "trade" | "cost";

const ANSWER: Array<{ text: string; part?: Part }> = [
  { text: "A little, yes. " },
  { text: "Tech is 38% of your portfolio", part: "data" },
  { text: ", " },
  { text: "against a 26% target for your Growth plan", part: "rule" },
  { text: ". Most of it comes from NVDA (14%) and QQQ (11%). " },
  { text: "I can trim $2,140 and spread it across VXUS and BND.", part: "trade" },
  { text: " " },
  { text: "Estimated tax impact: $0, because I'd sell lots that are currently at a loss.", part: "cost" },
];

const PARTS: Array<{ key: Part; title: string; body: string; source: string }> = [
  { key: "data", title: "Your numbers, not an average", body: "It starts from your real holdings as of this morning, not a model portfolio or a guess.", source: "Holdings, 9:32 AM" },
  { key: "rule", title: "The rule it's measuring against", body: "Every judgement points back to a target you chose, so you can see why 38% is too much for you.", source: "Growth plan targets" },
  { key: "trade", title: "A specific, reversible proposal", body: "Not advice in the abstract. An exact trade you can approve, edit or ignore.", source: "Autopilot drift rules" },
  { key: "cost", title: "What it would cost you", body: "Taxes and fees come before you decide, worked out lot by lot.", source: "Tax lots, 2026" },
];

function AnswerCard({ active }: { active: Part }) {
  return (
    <div className="flex h-full flex-col justify-center p-6 sm:p-10">
      <div className="ml-auto w-fit rounded-[20px] rounded-br-[6px] bg-paper px-5 py-3 text-[18px] font-medium text-ink">Am I too exposed to tech?</div>
      <div className="mt-5 flex gap-4">
        <LogoMark size={32} animated={false} className="mt-1 shrink-0" />
        <p className="text-[clamp(1.15rem,1.9vw,1.5rem)] leading-[1.5] tracking-[-0.015em]">
          {ANSWER.map((seg, i) => {
            const on = seg.part === active;
            return (
              <span
                key={i}
                className={cn(
                  "rounded-[6px] transition-[background-color,color] duration-500 [box-decoration-break:clone]",
                  on ? "bg-lime px-1 text-on-lime" : seg.part ? "text-white/85" : "text-white/45",
                )}
              >
                {seg.text}
              </span>
            );
          })}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-2 pl-12">
        {PARTS.map((p) => (
          <span
            key={p.key}
            className={cn("rounded-full border px-3.5 py-1.5 text-[15px] transition-colors duration-500", p.key === active ? "border-lime text-accent" : "border-white/12 text-white/60")}
          >
            {p.source}
          </span>
        ))}
      </div>
      <div className="mt-8 flex gap-3 pl-12">
        <span className="rounded-[12px] bg-lime px-5 py-3 text-[16px] font-medium text-on-lime">Review trade</span>
        <span className="rounded-[12px] bg-white/[0.07] px-5 py-3 text-[16px] text-white/80">Not now</span>
      </div>
    </div>
  );
}

export function AnswerAnatomy() {
  return (
    <Stepper steps={PARTS.map((p) => ({ title: p.title, body: p.body }))} duration={5}>
      {(i) => <AnswerCard active={PARTS[i].key} />}
    </Stepper>
  );
}

/* ---------- approvals feed ---------- */

interface Entry {
  id: string;
  icon: typeof ScalesIcon;
  title: string;
  detail: string;
  when: string;
  status: "rule" | "pending" | "you";
}

const FEED: Entry[] = [
  { id: "roth", icon: PiggyBankIcon, title: "Add $200 a month to your Roth IRA", detail: "Retirement goal is 96% on track. This closes the gap by 2041.", when: "Tue, 8:05 PM", status: "pending" },
  { id: "rebal", icon: ScalesIcon, title: "Sold $420 NVDA, bought VXUS", detail: "Drift rule: US stocks were 2.3% over target.", when: "Today, 9:32 AM", status: "rule" },
  { id: "tlh", icon: ReceiptIcon, title: "Harvested a $212 loss in QQQ", detail: "Tax rule: lot was down 8.1%. Swapped into QQQM.", when: "Wed, 2:10 PM", status: "rule" },
  { id: "pause", icon: PauseCircleIcon, title: "Paused NVDA buys for 72 hours", detail: "Risk rule: three-day swing passed 9%.", when: "Mon, 10:41 AM", status: "rule" },
];

export function ApprovalFeed() {
  const [feed, setFeed] = useState(FEED);
  const decide = (yes: boolean) =>
    setFeed((f) =>
      yes
        ? f.map((e) => (e.status === "pending" ? { ...e, status: "you" as const, title: "Added $200 a month to your Roth IRA", when: "Just now" } : e))
        : f.filter((e) => e.status !== "pending"),
    );
  const reset = () => setFeed(FEED);
  const pending = feed.some((e) => e.status === "pending");

  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-ink-2 p-3 sm:p-4">
      <div className="flex items-center justify-between px-4 pb-3 pt-3 sm:px-5">
        <div className="text-[19px] font-semibold tracking-[-0.02em]">Activity</div>
        <button onClick={reset} className="text-[15px] text-white/60 transition-colors hover:text-white">
          Reset demo
        </button>
      </div>
      <LayoutGroup>
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {feed.map((e) => {
              const Icon = e.icon;
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className={cn("rounded-[20px] p-4 sm:p-5", e.status === "pending" ? "bg-white/[0.06]" : "bg-transparent")}
                >
                  <div className="flex gap-4">
                    <Icon size={26} weight={e.status === "rule" ? "regular" : "fill"} className={cn("mt-0.5 shrink-0", e.status === "rule" ? "text-white/60" : "text-accent")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div className="text-[18px] font-medium tracking-[-0.01em]">{e.title}</div>
                        <div className="text-[15px] text-white/60">{e.when}</div>
                      </div>
                      <p className="mt-1 text-[16px] leading-relaxed text-white/65">{e.detail}</p>
                      <div className="mt-3">
                        {e.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => decide(true)} className="rounded-[12px] bg-lime px-5 py-2.5 text-[16px] font-medium text-on-lime transition-transform active:scale-[0.97]">
                              Approve
                            </button>
                            <button onClick={() => decide(false)} className="rounded-[12px] bg-white/[0.08] px-5 py-2.5 text-[16px] text-white/85 transition-colors hover:bg-white/[0.12]">
                              Not now
                            </button>
                          </div>
                        ) : (
                          <span className={cn("inline-flex items-center gap-1.5 text-[15px]", e.status === "you" ? "text-accent" : "text-white/60")}>
                            {e.status === "you" ? <CheckCircleIcon size={17} weight="fill" /> : <LightningIcon size={16} />}
                            {e.status === "you" ? "Approved by you" : "Ran on your rule"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
      <p aria-live="polite" className="sr-only">
        {pending ? "One proposal is waiting for your approval." : "No proposals waiting."}
      </p>
    </div>
  );
}
