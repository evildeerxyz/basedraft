"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { ArrowRightIcon, ChartBarIcon, ChatCircleTextIcon, DatabaseIcon, EyeIcon, PlugsConnectedIcon, SealCheckIcon, ShieldCheckIcon, SparkleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { APP_URL, FUNDING, LOGOS, METRICS } from "@/lib/content";
import { HeroScene, type HeroStep } from "@/components/gl/lazy";
import { Zigzag } from "@/components/shapes/shapes";
import { Container } from "@/components/site/ui";

const EXAMPLES = ["postgres://analytics@db.acme.io:5432/prod", "postgresql://readonly@pooler.supabase.com/postgres", "postgres://noma@ep-quiet-sky.neon.tech/main"];

/** Placeholder that types connection strings until the visitor types their own. */
function useTypewriter(lines: string[], active: boolean) {
  const [state, setState] = useState({ line: 0, count: 0, deleting: false });
  useEffect(() => {
    if (!active) return;
    const text = lines[state.line];
    const full = state.count === text.length;
    const delay = state.deleting ? 14 : full ? 1800 : 42;
    const timer = window.setTimeout(() => {
      setState((s) => {
        if (s.deleting) return s.count === 0 ? { line: (s.line + 1) % lines.length, count: 0, deleting: false } : { ...s, count: s.count - 1 };
        return s.count === lines[s.line].length ? { ...s, deleting: true } : { ...s, count: s.count + 1 };
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, lines, state]);
  return lines[state.line].slice(0, state.count);
}

/**
 * The typed hint behaves like a real input that scrolls: the newest characters
 * stay in view, and once it overflows the start fades out instead of the text
 * being cut off at the field edge.
 */
function TypedHint({ text, caret }: { text: string; caret: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    const fade = el.scrollWidth > el.clientWidth + 1 ? "linear-gradient(to right, transparent, #000 28px)" : "none";
    el.style.maskImage = fade;
    el.style.webkitMaskImage = fade;
  }, [text]);
  return (
    <span ref={box} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden whitespace-nowrap pr-1 font-mono text-[13.5px] text-ink-3">
      <span className="shrink-0">{text}</span>
      {caret && <span className="ml-px inline-block h-4 w-[2px] shrink-0 bg-ink-3" />}
    </span>
  );
}

export function ConnectBar({ className, tone = "accent" }: { className?: string; tone?: "accent" | "ink" }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const typed = useTypewriter(EXAMPLES, !value && !focused);
  return (
    <form
      action={APP_URL}
      className={cn(
        "flex w-full max-w-[580px] items-stretch overflow-hidden rounded-[6px] border border-ink bg-surface transition-[box-shadow] focus-within:[box-shadow:var(--focus-ring)] max-sm:flex-col",
        className,
      )}
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 pl-4 pr-2">
        <DatabaseIcon size={18} weight="duotone" className="shrink-0 text-ink" />
        <span className="relative min-w-0 flex-1">
          <input
            name="connection"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Postgres connection string"
            autoComplete="off"
            spellCheck={false}
            className="h-14 w-full bg-transparent font-mono text-[13.5px] text-ink focus:shadow-none"
          />
          {!value && <TypedHint text={focused ? "Paste a Postgres URL" : typed} caret={!focused} />}
        </span>
      </label>
      <button
        type="submit"
        className={cn(
          "group flex h-14 shrink-0 items-center justify-center gap-2 px-5 text-[15px] font-medium transition-colors",
          tone === "accent" ? "bg-accent text-[#1d1a15] hover:bg-[#ffb02e]" : "bg-inverse text-inverse-fg hover:bg-inverse-hover",
        )}
      >
        <PlugsConnectedIcon size={18} weight="duotone" />
        Connect free
      </button>
    </form>
  );
}

const STEP_COPY: Record<HeroStep, { n: string; title: string; note: string; icon: Icon }> = {
  ask: { n: "01", title: "You ask", note: "a question in plain English", icon: ChatCircleTextIcon },
  draft: { n: "02", title: "Noma drafts", note: "SQL that knows your schema", icon: SparkleIcon },
  approve: { n: "03", title: "You approve", note: "writes wait for a human", icon: SealCheckIcon },
  run: { n: "04", title: "Postgres runs it", note: "on a read replica", icon: DatabaseIcon },
  answer: { n: "05", title: "Your team gets the answer", note: "charted and shareable", icon: ChartBarIcon },
};

/** The device rack, with the step the packet is on spelled out underneath. */
function HeroFigure() {
  const [step, setStep] = useState<HeroStep>("ask");
  const copy = STEP_COPY[step];
  const StepIcon = copy.icon;
  return (
    <figure className="relative mx-auto w-full max-w-[620px]">
      <div className="relative aspect-[6/5] w-full">
        <HeroScene className="absolute inset-0" onStep={setStep} />
      </div>
      <figcaption aria-live="polite" className="flex h-10 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 text-[14px]"
          >
            <StepIcon size={20} weight="duotone" className="text-accent" />
            <span className="font-mono text-[12px] text-ink-3">{copy.n}</span>
            <span className="font-medium text-ink">{copy.title},</span>
            <span className="text-ink-2">{copy.note}</span>
          </motion.span>
        </AnimatePresence>
      </figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-x-clip">
      <Container className="grid items-center gap-6 pb-12 pt-10 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 max-w-[640px]">
          <Link
            href="/blog/series-b"
            className="group inline-flex h-8 max-w-full items-center gap-2.5 border border-line pl-1 pr-3 text-[13px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
          >
            <span className="shrink-0 bg-accent px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase text-[#1d1a15]">{FUNDING.round}</span>
            <span className="truncate">We raised {FUNDING.amount} to give every database a voice</span>
            <ArrowRightIcon size={12} weight="bold" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <h1 className="mt-7 text-balance text-[40px] font-medium leading-[0.98] tracking-[-0.055em] text-ink sm:text-[58px] lg:text-[60px] xl:text-[70px]">Ask your database anything.</h1>
          <p className="mt-6 max-w-[520px] text-pretty text-[18px] leading-relaxed text-ink-2">
            Noma turns plain English into SQL you can read, approve and share. Reads run in milliseconds. Writes wait for a human. Your rows never leave home.
          </p>
          <ConnectBar className="mt-9" />
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
            {[
              { icon: UsersThreeIcon, label: "Free for 3 seats" },
              { icon: EyeIcon, label: "Read only by default" },
              { icon: ShieldCheckIcon, label: "SOC 2 Type II" },
            ].map(({ icon: TrustIcon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <TrustIcon size={17} weight="duotone" className="text-accent" />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>
        <HeroFigure />
      </Container>
      <Logos />
    </section>
  );
}

/** Simple geometric marks so each fictional customer gets a recognisable logo. */
function Mark({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const };
  switch (index % 6) {
    case 0:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <circle cx="10" cy="10" r="7" {...common} />
          <circle cx="10" cy="10" r="2.5" fill="currentColor" />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <path d="M10 2.5 17.5 10 10 17.5 2.5 10Z" {...common} />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <path d="M10 3 17 16H3Z" {...common} />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <path d="M3 4h5v12H3zM11 8h5v8h-5z" fill="currentColor" />
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <path d="M3 10a7 7 0 0 1 14 0" {...common} />
          <path d="M6 10a4 4 0 0 1 8 0" {...common} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className="size-[18px]">
          <path d="M4 4h12v12H4z M4 10h12 M10 4v12" {...common} />
        </svg>
      );
  }
}

/** Customer strip: an ink band torn top and bottom. */
export function Logos({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Zigzag color="var(--inverse)" className="-mb-px" />
      <div className="bg-inverse text-inverse-fg">
        <Container className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:gap-12">
          <p className="shrink-0 text-[14px] leading-snug opacity-70 lg:w-[160px]">Trusted by {METRICS[0].value.toLocaleString("en-US")}+ data teams, from seed to IPO</p>
          <ul className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {LOGOS.slice(0, 6).map((name, index) => (
              <li key={name} className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.03em] opacity-80">
                <Mark index={index} />
                {name}
              </li>
            ))}
          </ul>
        </Container>
      </div>
      <Zigzag color="var(--inverse)" flip className="-mt-px" />
    </div>
  );
}
