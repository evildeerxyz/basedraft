"use client";

import { ArrowDownIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Avatar, Button, ButtonLink, Container, Magnetic, Status } from "@/components/site/ui";
import { happening, type Happening } from "@/lib/happenings";
import { COMPANY } from "@/lib/people";
import { OrgGraph, type OrgGraphHandle } from "./org-graph";

const EASE = [0.22, 1, 0.36, 1] as const;

function Line({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay, ease: EASE }}>
        {children}
      </motion.span>
    </span>
  );
}

function Checking() {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-sunken px-3 text-[15px] font-medium text-ink-2">
      Checking
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="size-1 rounded-full bg-ink-2" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </span>
    </span>
  );
}

function Feed({ items, handled, flagged }: { items: Happening[]; handled: number; flagged: number }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-4 px-6 pt-6">
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Today at {COMPANY.name}</h2>
        <span className="text-[15px] text-mute">{COMPANY.people} people</span>
      </div>
      <ul className="relative mt-4 flex-1 overflow-hidden px-3" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((h) => (
            <motion.li
              key={h.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="flex items-start gap-3 rounded-[16px] px-3 py-2.5"
            >
              <Avatar person={h.person} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[16px] font-medium leading-snug text-ink">{h.title}</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={h.busy ? "busy" : "done"} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.16 }}>
                      {h.busy ? <Checking /> : <Status tone={h.tone}>{h.done}</Status>}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[15px] text-mute">
                  <p className="truncate">{h.detail}</p>
                  <span className="tabular shrink-0 font-mono">{h.at}</span>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <dl className="grid grid-cols-2 gap-px bg-line shadow-[0_-1px_0_var(--pl-line)]">
        <div className="bg-surface px-6 py-5">
          <dt className="text-[15px] text-mute">Handled today</dt>
          <dd className="tabular mt-1 text-[30px] font-semibold tracking-[-0.04em] text-ink">{handled.toLocaleString("en-US")}</dd>
        </div>
        <div className="bg-surface px-6 py-5">
          <dt className="text-[15px] text-mute">Sent to a person</dt>
          <dd className="tabular mt-1 text-[30px] font-semibold tracking-[-0.04em] text-ink">{flagged}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Hero() {
  const graph = useRef<OrgGraphHandle>(null);
  const [items, setItems] = useState<Happening[]>(() => [4, 3, 2, 1, 0].map((i) => happening(i)));
  const [handled, setHandled] = useState(1284);
  const [flagged, setFlagged] = useState(37);

  const start = useCallback((h: Happening) => setItems((list) => [h, ...list].slice(0, 5)), []);
  const done = useCallback((h: Happening) => {
    setItems((list) => list.map((x) => (x.id === h.id ? { ...x, busy: false } : x)));
    setHandled((n) => n + 1);
    if (h.tone === "bad") setFlagged((n) => n + 1);
  }, []);

  return (
    <section className="relative overflow-hidden pb-24 pt-14 lg:pt-20">
      <Container>
        <h1 className="text-[clamp(3.3rem,8.6vw,8.2rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-ink">
          <Line delay={0.05}>HR that does</Line>
          <Line delay={0.16}>the paperwork.</Line>
        </h1>
        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
            className="max-w-[560px] text-pretty text-[clamp(1.18rem,1.6vw,1.32rem)] leading-[1.5] text-ink-2"
          >
            pello answers policy questions, approves time off within the rules you set, runs payroll and gets new hires ready for day one. Your people team gets back to people.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.42, ease: EASE }} className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <ButtonLink href="/contact" kind="accent" size="lg">
                Book a demo
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="#ask" kind="quiet" size="lg">
              See it work
              <ArrowDownIcon size={18} />
            </ButtonLink>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
          className="mt-14 grid overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_30px_80px_-40px_rgb(12_14_20/0.35)] lg:grid-cols-[1fr_400px]"
        >
          <div className="relative h-[480px] sm:h-[560px] lg:h-[600px]">
            <OrgGraph ref={graph} onStart={start} onDone={done} />
            <div className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3">
              <p className="max-w-[300px] text-[15px] leading-snug text-mute max-sm:hidden">Drag anyone around. Click a person to send a request for them.</p>
              <Button kind="quiet" onClick={() => graph.current?.send()} className="pointer-events-auto">
                <PaperPlaneTiltIcon size={18} />
                Send a request
              </Button>
            </div>
          </div>
          <div className="shadow-[inset_0_1px_0_var(--pl-line)] lg:shadow-[inset_1px_0_0_var(--pl-line)]">
            <Feed items={items} handled={handled} flagged={flagged} />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
