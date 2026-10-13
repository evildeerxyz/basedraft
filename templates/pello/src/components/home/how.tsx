"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/site/brand";
import { Logo, Mark } from "@/components/site/logo";
import { Band, ButtonLink, Chip, SectionHead, Toggle } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import type { Brand } from "@/lib/brands";

/*
 * Getting started, in three cards: connect the handbook (the tools it reads from circle pello),
 * write the rules (switches that work), and let pello get on with it (its notices pile up; click
 * the pile to go through them).
 */

function Card({ n, title, body, children }: { n: string; title: string; body: string; children: ReactNode }) {
  return (
    <div className="pl-card relative flex h-[440px] flex-col overflow-hidden rounded-[16px] p-6">
      <Chip className="self-start">{n}</Chip>
      <h3 className="mt-5 font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">{title}</h3>
      <p className="mt-2 text-[16px] leading-[1.55] text-mute">{body}</p>
      <div className="relative mt-auto">{children}</div>
    </div>
  );
}

const RINGS: Array<{ r: number; brands: Brand[]; back?: boolean }> = [
  { r: 76, brands: ["notion", "drive"] },
  { r: 118, brands: ["confluence", "slack", "teams"], back: true },
];

/** The tools pello reads from, going round it. */
function Orbit() {
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[280px] overflow-hidden">
      <div className="absolute left-1/2 top-[150px] -translate-x-1/2 -translate-y-1/2">
        {RINGS.map((ring) => (
          <div key={ring.r} className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_1px_var(--pl-line)]", ring.back ? "pl-orbit-back" : "pl-orbit")} style={{ width: ring.r * 2, height: ring.r * 2 }}>
            {ring.brands.map((b, i) => {
              const a = (i / ring.brands.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <span key={b} className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[10px] bg-surface shadow-[0_0_0_1px_var(--pl-line),0_2px_6px_rgb(0_0_0/0.06)]" style={{ left: ring.r + Math.cos(a) * ring.r, top: ring.r + Math.sin(a) * ring.r }}>
                  <span className={ring.back ? "pl-orbit" : "pl-orbit-back"}>
                    <BrandMark brand={b} className="size-5" />
                  </span>
                </span>
              );
            })}
          </div>
        ))}
        <span className="relative grid h-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface px-4 shadow-[0_0_0_1px_var(--pl-line),0_4px_12px_rgb(0_0_0/0.06)]" style={{ marginLeft: 0 }}>
          <Logo size={22} />
        </span>
      </div>
    </div>
  );
}

const RULES = [
  { name: "Time off", values: ["2 weeks notice", "2 out per team"], on: true },
  { name: "Expenses", values: ["£400 a year"], on: true },
  { name: "Overtime", values: ["Ask a person"], on: false },
];

/** The rules, as switches that work. */
function Rules() {
  const [on, setOn] = useState(RULES.map((r) => r.on));
  return (
    <div className="relative -mx-6 -mb-6 px-6 pt-4">
      <div aria-hidden className="absolute inset-x-12 top-0 h-6 rounded-t-[12px] bg-surface shadow-[0_0_0_1px_var(--pl-line)]" />
      <div aria-hidden className="absolute inset-x-9 top-2 h-6 rounded-t-[12px] bg-surface shadow-[0_0_0_1px_var(--pl-line)]" />
      <div className="relative rounded-t-[12px] bg-surface px-4 pb-6 pt-3 shadow-[0_0_0_1px_var(--pl-line)]">
        {RULES.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3 py-2.5">
            <Toggle on={on[i]} onChange={(v) => setOn((o) => o.map((x, k) => (k === i ? v : x)))} label={r.name} />
            <span className={cn("w-[78px] shrink-0 text-[15px] font-medium transition-colors", on[i] ? "text-ink" : "text-mute")}>{r.name}</span>
            <span className="flex min-w-0 flex-wrap gap-1.5">
              {r.values.map((v) => (
                <span key={v} className={cn("rounded-[7px] px-2 py-1 text-[15px] shadow-[0_0_0_1px_var(--pl-line)] transition-opacity", on[i] ? "text-ink-2" : "text-mute opacity-60")}>
                  {v}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NOTES = [
  { title: "Time off approved", body: "Grace Walsh, December 22 to 24. Inside the rules." },
  { title: "Question answered", body: "Tom Ellis asked about parental leave. Handbook 4.2." },
  { title: "Sent to Oliver", body: "Ravi Mehta logged 52 hours. Above the limit." },
];

/** What pello's done, piling up as notices. Click the pile to go through it. */
function Notices() {
  const [first, setFirst] = useState(0);
  return (
    <button type="button" onClick={() => setFirst((f) => (f + 1) % NOTES.length)} aria-label="Show the next notice" className="relative block h-[150px] w-full text-left">
      <AnimatePresence initial={false}>
        {[2, 1, 0].map((depth) => {
          const k = (first + depth) % NOTES.length;
          const n = NOTES[k];
          return (
            <motion.div
              key={`${k}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: depth * 12, scale: 1 - depth * 0.05 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ zIndex: 3 - depth }}
              className="absolute inset-x-1 top-2 flex origin-top items-start gap-3 rounded-[14px] bg-surface p-3.5 shadow-[0_0_0_1px_var(--pl-line),0_6px_16px_-8px_rgb(0_0_0/0.15)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-ink">
                <Mark size={22} className="text-surface" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold text-ink">{n.title}</span>
                  <span className="shrink-0 text-[15px] text-mute">now</span>
                </span>
                <span className="mt-0.5 block text-[15px] leading-snug text-mute">{n.body}</span>
              </span>
              {depth === 0 && <CheckIcon size={16} weight="bold" className="mt-1 shrink-0 text-ink" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </button>
  );
}

export function How() {
  return (
    <Band rule id="how" inner="py-20 lg:py-28">
      <SectionHead
        title="Set up in an afternoon, not a quarter"
        lead="Connect your handbook, write down your rules, and pello takes it from there."
        actions={
          <>
            <ButtonLink href="/contact">Book a demo</ButtonLink>
            <ButtonLink href="/pricing" kind="light">
              See pricing
            </ButtonLink>
          </>
        }
      />
      <div className="mt-14 grid gap-3 md:grid-cols-3">
        <Card n="01" title="Connect your handbook" body="Upload it, or connect Notion, Google Drive or Confluence. pello keeps up when a policy changes.">
          <Orbit />
        </Card>
        <Card n="02" title="Write down your rules" body="Notice, team limits, budgets and who signs off, in plain words. Turn any of them off.">
          <Rules />
        </Card>
        <Card n="03" title="Let pello handle it" body="It answers, approves and files. Anything unusual goes to a person, already written up.">
          <Notices />
        </Card>
      </div>
    </Band>
  );
}
