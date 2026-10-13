"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, SlackLogoIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mark } from "@/components/site/logo";
import { Band, Button, ButtonLink, Face, Magnetic, Tag } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { useEngaged } from "@/lib/engaged";
import { happening, type Happening } from "@/lib/happenings";
import { COMPANY, personOf } from "@/lib/people";

/*
 * The first screen: what pello is, beside pello itself. Its inbox is Fieldwork's requests as they
 * come in. The newest is opened on its own, and pello works through its checks before it decides;
 * open any other to see how that one went. It plays once someone's on the page, while it's on
 * screen, and stops leading for a while after you click.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const ON_LIST = ["grace", "leo", "priya", "marco", "tom", "nina", "ravi", "mei", "oliver", "clara", "arjun", "hannah"].map(personOf);
const forList = (i: number) => ON_LIST[(i * 5 + 2) % ON_LIST.length];
const START = 6;

function Row({ h, on, onOpen }: { h: Happening; on: boolean; onOpen: () => void }) {
  return (
    <motion.li layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 36 }}>
      <button type="button" onClick={onOpen} aria-pressed={on} className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors", on ? "bg-sunken" : "hover:bg-sunken/60")}>
        <Face person={h.person} size={34} hot={h.busy} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-semibold text-ink">{h.person.name}</span>
            <span className="tabular shrink-0 font-mono text-[15px] text-mute">{h.at}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[15px] text-mute">
            <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", h.busy ? "animate-pulse bg-accent" : h.tone === "bad" ? "bg-accent" : "bg-ink")} />
            <span className="truncate">{h.busy ? "pello is checking" : h.title}</span>
          </span>
        </span>
      </button>
    </motion.li>
  );
}

function Detail({ h }: { h: Happening }) {
  const lead = h.result;
  return (
    <motion.div key={h.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }} className="flex h-full flex-col p-6">
      <div className="flex items-center gap-3">
        <Face person={h.person} size={44} hot={h.busy} />
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-ink">{h.person.name}</p>
          <p className="truncate text-[15px] text-mute">
            {h.person.role}, {h.person.location}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[15px] text-mute">
          <SlackLogoIcon size={16} />
          <span className="tabular font-mono">{h.at}</span>
        </span>
      </div>

      <p className="mt-6 font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">&ldquo;{h.ask}&rdquo;</p>

      <p className="mt-6 text-[15px] font-medium text-mute">What pello checked</p>
      <ul className="mt-2 grid gap-2">
        {h.checks.map((c, i) => (
          <motion.li key={c.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: h.busy ? 0.15 + i * 0.25 : 0, duration: 0.25 }} className="flex items-center gap-2.5 text-[15px] text-ink">
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", c.ok ? "bg-ink text-surface" : "bg-accent text-accent-ink")}>{c.ok ? <CheckIcon size={11} weight="bold" /> : <XIcon size={11} weight="bold" />}</span>
            {c.text}
          </motion.li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <AnimatePresence mode="wait" initial={false}>
          {h.busy ? (
            <motion.p key="busy" exit={{ opacity: 0 }} className="flex items-center gap-2 text-[15px] text-mute">
              <span className="relative grid size-6 place-items-center rounded-full bg-sunken">
                <Mark size={14} />
              </span>
              Working on it
            </motion.p>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} className="rounded-[12px] bg-sunken p-4">
              <div className="flex items-center justify-between gap-3">
                <Tag tone={h.tone === "bad" ? "flag" : "done"}>{h.tone === "bad" ? "Sent to a person" : `${h.done} by pello`}</Tag>
                <Button kind="light" size="sm">
                  <ArrowCounterClockwiseIcon size={14} />
                  Undo
                </Button>
              </div>
              <p className="mt-3 text-[15px] leading-[1.5] text-ink-2">{lead}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** pello's inbox: Fieldwork's requests on the left, the open one on the right. */
function Inbox() {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { amount: 0.3 });
  const engaged = useEngaged();
  const [items, setItems] = useState<Happening[]>(() => Array.from({ length: START }, (_, k) => START - 1 - k).map((i) => happening(i, forList(i))));
  const [openId, setOpenId] = useState(START - 1);
  const [handled, setHandled] = useState(1284);
  const count = useRef(START);
  const quiet = useRef(0);

  const arrive = useCallback(() => {
    const i = count.current++;
    const h = happening(i, forList(i), true);
    setItems((list) => [h, ...list].slice(0, 7));
    if (performance.now() > quiet.current) setOpenId(h.id);
    setTimeout(() => {
      setItems((list) => list.map((x) => (x.id === h.id ? { ...x, busy: false } : x)));
      setHandled((n) => n + 1);
    }, 1300);
  }, []);

  useEffect(() => {
    if (!seen || !engaged) return;
    const t = setInterval(() => !document.hidden && arrive(), 3600);
    return () => clearInterval(t);
  }, [seen, engaged, arrive]);

  const open = items.find((x) => x.id === openId) ?? items[0];
  return (
    <div ref={box} className="grid h-[540px] w-[640px] grid-cols-[262px_1fr] overflow-hidden rounded-[14px] bg-surface shadow-[0_0_0_1px_var(--pl-line),0_24px_60px_-30px_rgb(0_0_0/0.25)]">
      <div className="flex min-h-0 flex-col shadow-[1px_0_0_var(--pl-line)]">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <p className="text-[16px] font-semibold text-ink">Requests</p>
          <Tag tone="live">Live</Tag>
        </div>
        <ul className="min-h-0 flex-1 overflow-hidden px-2 pl-fade-b">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((h) => (
              <Row
                key={h.id}
                h={h}
                on={h.id === open.id}
                onOpen={() => {
                  quiet.current = performance.now() + 9000;
                  setOpenId(h.id);
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
        <div className="flex items-baseline justify-between px-4 py-3 shadow-[0_-1px_0_var(--pl-line)]">
          <span className="text-[15px] text-mute">Handled today</span>
          <span className="tabular font-mono text-[15px] font-medium text-ink">{handled.toLocaleString("en-US")}</span>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <Detail key={open.id} h={open} />
      </AnimatePresence>
    </div>
  );
}

export function Hero() {
  return (
    <Band inner="pb-4 pt-4">
      <div className="pl-card relative -mx-2 overflow-hidden rounded-[16px] sm:-mx-6 lg:-mx-[64px]">
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="px-6 pb-10 pt-14 sm:px-12 lg:py-24 lg:pl-16 lg:pr-6">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="text-balance font-display text-[clamp(2.9rem,5.4vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">
              HR that does the paperwork
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }} className="mt-5 max-w-[500px] text-pretty text-[18px] leading-[1.55] text-mute">
              pello answers policy questions, approves time off within your rules, runs payroll and gets new hires ready for day one. Your people team gets back to people.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: EASE }} className="mt-8 grid max-w-[480px] gap-2.5">
              <Magnetic strength={0.08}>
                <ButtonLink href="/contact" size="lg" className="w-full">
                  Book a demo
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="#how" kind="light" size="lg" className="w-full">
                See how it works
              </ButtonLink>
              <p className="mt-2 text-[15px] text-mute">Free for 30 days. Most teams are set up in an afternoon.</p>
            </motion.div>
          </div>

          {/* pello itself, running past the card's edge. */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: EASE }} className="relative h-[330px] min-[460px]:h-[400px] sm:h-[480px] lg:h-auto">
            <div className="absolute left-6 top-0 origin-top-left scale-[0.62] min-[460px]:scale-[0.78] sm:left-12 sm:scale-100 lg:left-0 lg:top-16 lg:scale-[0.9] xl:scale-100">
              <Inbox />
            </div>
          </motion.div>
        </div>
        <p className="sr-only">
          A live view of pello handling requests from {COMPANY.name}&apos;s {COMPANY.people} people.
        </p>
      </div>
    </Band>
  );
}

