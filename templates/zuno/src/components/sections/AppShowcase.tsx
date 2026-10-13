"use client";

import { HandTapIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { PhoneMockup } from "../phone/PhoneMockup";
import { PhoneProvider, usePhone } from "../phone/store";
import { RollingNumber } from "../ui/RollingNumber";
import { SectionTitle } from "../ui/Section";

type ChapterId = "home" | "invest" | "cash" | "copilot" | "trade";

const CHAPTERS: Array<{ id: ChapterId; label: string; title: string; body: string; tryIt: string }> = [
  {
    id: "home",
    label: "Home",
    title: "Your whole portfolio, live.",
    body: "Every holding is priced in real time. Drag across the chart to see any day, or tap a holding to drill in.",
    tryIt: "Drag across the chart",
  },
  {
    id: "invest",
    label: "Invest",
    title: "Autopilot, with a switch.",
    body: "See your mix against its target, change your risk level, or pause automatic trading entirely.",
    tryIt: "Flip Autopilot off, or pick Balanced",
  },
  {
    id: "cash",
    label: "Cash",
    title: "Cash that earns 4.10%.",
    body: "Deposit or withdraw with a keypad and Face ID. Interest accrues by the second.",
    tryIt: "Tap Deposit and enter an amount",
  },
  {
    id: "copilot",
    label: "Copilot",
    title: "Ask why. Get a straight answer.",
    body: "The Zuno button opens Copilot from any screen. It explains every trade it makes, in plain English.",
    tryIt: "Type a question or tap a suggestion",
  },
  {
    id: "trade",
    label: "Trade",
    title: "Buy and sell in two taps.",
    body: "Fractional shares from $1, filled at market, no commissions. Swipe from the left edge to go back.",
    tryIt: "Tap Buy, then a quick amount",
  },
];

const AUTO_MS = 6500;

function Readout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[17px] font-medium text-white/60">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">{children}</div>
    </div>
  );
}

function Tour() {
  const p = usePhone();
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { margin: "-30% 0px" });
  const seen = useInView(stage, { once: true, margin: "-25% 0px" });
  const reduce = useReducedMotion();
  const [autoChoice, setAuto] = useState<boolean | null>(null);
  // Auto-advancing content is on by default, off for reduced-motion users, and always pausable.
  const auto = autoChoice ?? !reduce;
  const [cycle, setCycle] = useState(0);
  // Fit the phone to its column so it never clips on small screens.
  const phoneCol = useRef<HTMLDivElement>(null);
  const [phoneW, setPhoneW] = useState(320);
  useEffect(() => {
    const el = phoneCol.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPhoneW(Math.max(240, Math.min(320, Math.floor(entry.contentRect.width) - 24))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  // The selected chapter always mirrors what the phone is actually showing.
  const active: ChapterId =
    p.sheet?.kind === "copilot" ? "copilot" : p.stock || p.sheet?.kind === "order" ? "trade" : p.tab === "account" ? "home" : p.tab;
  const index = CHAPTERS.findIndex((c) => c.id === active);
  const chapter = CHAPTERS[index];

  // On narrow screens the tab row scrolls; keep the active tab in view without moving the page.
  const tablist = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tablist.current;
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !tab) return;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const go = (id: ChapterId) => {
    p.closeSheet();
    if (id === "copilot") {
      p.setTab("home");
      p.openSheet({ kind: "copilot", prompt: 0 });
    } else if (id === "trade") {
      p.setTab("home");
      p.openStock("NVDA");
    } else {
      p.setTab(id);
    }
    setCycle((c) => c + 1);
  };

  const advance = () => {
    if (auto && inView) go(CHAPTERS[(index + 1) % CHAPTERS.length].id);
  };

  return (
    <div ref={stage} className="relative mt-16 overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2">
      {/* chapter tabs */}
      <div className="flex items-center justify-center gap-2 px-3 pt-5 sm:px-4 sm:pt-6">
        <LayoutGroup id="tour">
          <div ref={tablist} role="tablist" aria-label="App tour" className="no-scrollbar relative flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-ink p-1">
            {CHAPTERS.map((c) => {
              const on = c.id === active;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setAuto(false);
                    go(c.id);
                  }}
                  className={cn("relative h-9 shrink-0 overflow-hidden rounded-full px-3 text-[15px] font-medium transition-colors sm:px-4 sm:text-[16px]", on ? "text-ink" : "text-white/70 hover:text-white")}
                >
                  {on && <motion.span layoutId="tour-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                  <span className="relative">{c.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <button
          onClick={() => setAuto(!auto)}
          aria-label={auto ? "Pause the tour" : "Play the tour"}
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-ink text-white/80 transition-colors hover:text-white"
        >
          {/* progress ring: fills while the tour lingers on a chapter */}
          <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="22" cy="22" r="21" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="2" />
            {auto && (
              <motion.circle
                key={`${cycle}-${inView}-${active}`}
                cx="22"
                cy="22"
                r="21"
                fill="none"
                className="stroke-accent"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                onAnimationComplete={advance}
              />
            )}
          </svg>
          {auto ? <PauseIcon size={14} weight="fill" /> : <PlayIcon size={14} weight="fill" />}
        </button>
      </div>

      <div className="grid items-center gap-10 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-14 lg:px-14">
        {/* active chapter */}
        <div className="order-2 lg:order-1" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="max-w-[340px]"
            >
              <div className="text-[15px] tabular-nums text-white/60">
                <span className="text-accent">0{index + 1}</span> / 0{CHAPTERS.length}
              </div>
              <h3 className="mt-4 text-[28px] font-semibold leading-[1.1] tracking-[-0.035em]">{chapter.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/70">{chapter.body}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink px-3.5 py-2 text-[15px] text-white/80">
                <HandTapIcon size={15} weight="fill" className="text-accent" />
                {chapter.tryIt}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* the prototype */}
        <div ref={phoneCol} className="order-1 flex min-w-0 justify-center [perspective:1400px] lg:order-2 lg:w-[344px]">
          <motion.div style={{ rotateX, y }} onPointerDownCapture={() => setAuto(false)}>
            <PhoneMockup play={seen} width={phoneW} />
          </motion.div>
        </div>

        {/* live state from the prototype */}
        <div className="order-3 hidden lg:block">
          <div className="ml-auto w-[220px] space-y-7">
            <div className="flex items-center gap-2 text-[15px] tabular-nums text-white/60">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative size-1.5 rounded-full bg-accent" />
              </span>
              Live from the prototype
            </div>
            <Readout label="Total value">
              <RollingNumber value={formatUSD(p.total)} />
            </Readout>
            <Readout label="Cash">
              <RollingNumber value={formatUSD(p.cash)} />
            </Readout>
            <Readout label="Autopilot">
              <span className={p.autopilot ? "text-accent" : "text-down"}>{p.autopilot ? "On" : "Paused"}</span>
            </Readout>
            <Readout label="Strategy">{p.risk}</Readout>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShowcase() {
  return (
    <section id="app" className="relative mx-auto max-w-[1280px] scroll-mt-16 px-5 py-32 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <SectionTitle className="lg:col-span-8" lead="Everything you own." tail="One calm screen." />
        <p className="max-w-[420px] self-end text-[19px] leading-relaxed text-white/70 lg:col-span-4">
          No tickers screaming at you, no confetti. This is a working prototype: tap through it, or let the tour drive.
        </p>
      </div>
      <PhoneProvider>
        <Tour />
      </PhoneProvider>
    </section>
  );
}
