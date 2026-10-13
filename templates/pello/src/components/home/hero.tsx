"use client";

import { ArrowDownIcon, CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ButtonLink, Container, Face, Magnetic, Tag } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { BARS, DAY, MOMENTS, MOST, NOW, clockOf, doneOf, minutesOf, tally } from "@/lib/day";
import { useEngaged } from "@/lib/engaged";
import { happening, type Happening } from "@/lib/happenings";
import { COMPANY, personOf } from "@/lib/people";

/*
 * The first screen is the end of Fieldwork's Friday. On the right, pello's log: the clock, and the
 * requests as they come in, the newest opened while pello checks it. Open any of them to see what
 * it checked, or undo it. Under both, the whole day as a strip, six minutes to a bar, with the
 * moments the rest of the page shows marked on it. Point at a bar to see what was going on.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const ON_LOG = ["grace", "leo", "priya", "marco", "tom", "nina", "ravi", "mei", "oliver", "clara", "arjun", "julia"].map(personOf);
const forLog = (i: number) => ON_LOG[(i * 5 + 2) % ON_LOG.length];
/** The first six, in minutes before the page opens. */
const OPENING = [-14, -11, -9, -6, -3, 0];
const LAST = DAY.to - 2;

interface Entry {
  h: Happening;
  at: number;
  undone?: boolean;
}

const outcome = (e: Entry) => (e.undone ? (["open", "Undone"] as const) : e.h.busy ? (["live", "Checking"] as const) : e.h.tone === "bad" ? (["flag", e.h.done] as const) : (["done", e.h.done] as const));

function Row({ e, open, onToggle, onUndo }: { e: Entry; open: boolean; onToggle: () => void; onUndo: () => void }) {
  const { h } = e;
  const [tone, word] = outcome(e);
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 38 }} className="shadow-[0_1px_0_var(--pl-line)]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[46px_32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[6px] py-3 text-left">
        <span className={cn("tabular font-mono text-[15px] transition-colors", h.busy ? "text-accent" : "text-mute")}>{clockOf(e.at)}</span>
        <Face person={h.person} size={32} hot={h.busy} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-ink">{h.person.name}</span>
          <span className="block truncate text-[15px] text-mute">{h.busy ? h.ask : h.title}</span>
        </span>
        <Tag tone={tone}>{word}</Tag>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="overflow-hidden">
            <div className="pb-5 pl-[58px] pr-1 sm:pl-[103px]">
              <p className="text-[17px] leading-[1.45] text-ink">&ldquo;{h.ask}&rdquo;</p>
              <ul className="mt-3 grid gap-1.5">
                {h.checks.map((c, i) => (
                  <motion.li key={c.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: h.busy ? 0.2 + i * 0.28 : 0, duration: 0.25 }} className="flex items-start gap-2 text-[15px] leading-[1.4]">
                    {c.ok ? <CheckIcon size={15} weight="bold" className="mt-0.5 shrink-0 text-ink" /> : <XIcon size={15} weight="bold" className="mt-0.5 shrink-0 text-accent" />}
                    <span className={c.ok ? "text-ink-2" : "text-accent"}>{c.text}</span>
                  </motion.li>
                ))}
              </ul>
              {!h.busy && (
                <p className="mt-3 text-[15px] leading-[1.5] text-mute">
                  {e.undone ? "Undone. It's back with a person to decide." : h.result}
                  {!e.undone && h.tone !== "bad" && (
                    <button type="button" onClick={onUndo} className="ml-2 rounded-[4px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
                      Undo
                    </button>
                  )}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/** pello's log for the day: the clock, and the latest requests, newest first. */
function DayLog({ log, now, openId, onOpen, onUndo }: { log: Entry[]; now: number; openId: number | null; onOpen: (id: number) => void; onUndo: (id: number) => void }) {
  return (
    <div className="min-w-0">
      <div className="flex items-end justify-between gap-4">
        <p className="tabular font-mono text-[clamp(3.6rem,8vw,5.4rem)] font-medium leading-[0.8] tracking-[-0.07em] text-ink">
          <span className="sr-only">The time at {COMPANY.name}: </span>
          {clockOf(now).slice(0, 2)}
          <span className="-mx-[0.12em]">:</span>
          {clockOf(now).slice(3)}
        </p>
        <p className="text-right text-[15px] leading-[1.4] text-mute">
          {DAY.date}
          <br />
          at {COMPANY.name}
        </p>
      </div>
      <ul className="pl-fade-b mt-6 h-[436px] overflow-hidden border-t border-ink">
        <AnimatePresence initial={false} mode="popLayout">
          {log.map((e) => (
            <Row key={e.h.id} e={e} open={e.h.id === openId} onToggle={() => onOpen(e.h.id)} onUndo={() => onUndo(e.h.id)} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

const SPAN = DAY.to - DAY.from;
const pct = (m: number) => `${((m - DAY.from) / SPAN) * 100}%`;
const HOURS = Array.from({ length: SPAN / 60 + 1 }, (_, i) => DAY.from + i * 60);

/** One request from a bar, to say what it was like: an overtime flag for a bar that had one. */
const exampleOf = (i: number) => happening(BARS[i].flagged ? i - (i % 6) + 5 : i);

/** The whole day, six minutes to a bar: done in ink, what went to a person in vermilion, the rest to come. */
function DayStrip({ now }: { now: number }) {
  const [at, setAt] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const { handled, flagged } = tally(now);
  const nowBar = Math.min(BARS.length - 1, Math.floor((now - DAY.from) / DAY.step));
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current!.getBoundingClientRect();
    setAt(Math.max(0, Math.min(BARS.length - 1, Math.floor(((e.clientX - r.left) / r.width) * BARS.length))));
  };
  const key = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
    if (e.key === "Home") setAt(0);
    else if (e.key === "End") setAt(nowBar);
    else if (step[e.key]) setAt((x) => Math.max(0, Math.min(BARS.length - 1, (x ?? nowBar) + step[e.key])));
    else return;
    e.preventDefault();
  };
  const b = at === null ? null : BARS[at];
  const k = b ? doneOf(b, now) : 0;
  const said = b ? (k > 0 ? `${Math.round(b.count * k)} requests${b.flagged && k === 1 ? ", 1 sent to a person" : ""}` : "Later today") : "";
  const ex = at === null ? null : exampleOf(at);
  const place = at === null ? 0 : (at + 0.5) / BARS.length;

  return (
    <div className="mt-16 lg:mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 text-[15px] text-mute">
        <p>
          <span className="font-medium text-ink">
            {DAY.date} at {COMPANY.name}.
          </span>{" "}
          Every bar is six minutes of requests.
        </p>
        <p>
          <span className="tabular font-mono font-medium text-ink">{handled.toLocaleString("en-US")}</span> handled by pello, <span className="tabular font-mono font-medium text-accent">{flagged}</span> sent to a person
        </p>
      </div>

      <div className="relative mt-6 lg:mt-4">
        {/* The moments the rest of the page shows, where they fall in the day. */}
        <ol aria-label="Moments from the day" className="pointer-events-none absolute inset-x-0 bottom-0 top-0 hidden lg:block">
          {MOMENTS.map((m) => (
            <li key={m.id} className="absolute bottom-0 top-0 border-l border-line-strong" style={{ left: pct(minutesOf(m.at)) }}>
              <a href={`#${m.id}`} className="group pointer-events-auto -mt-px block rounded-[4px] pl-2 text-[15px] leading-[1.3]">
                <span className="tabular block font-mono text-mute transition-colors group-hover:text-accent">{m.at}</span>
                <span className="block whitespace-nowrap font-medium text-ink transition-colors group-hover:text-accent">{m.label}</span>
              </a>
            </li>
          ))}
        </ol>

        <div className="lg:pt-[60px]">
          <div
            ref={box}
            role="slider"
            tabIndex={0}
            aria-label={`${COMPANY.name}'s day, six minutes at a time`}
            aria-valuemin={0}
            aria-valuemax={BARS.length - 1}
            aria-valuenow={at ?? nowBar}
            aria-valuetext={b ? `${clockOf(b.start)} to ${clockOf(b.start + DAY.step)}, ${said}` : `Now, ${clockOf(now)}`}
            onPointerMove={pick}
            onPointerLeave={() => setAt(null)}
            onFocus={() => setAt(nowBar)}
            onBlur={() => setAt(null)}
            onKeyDown={key}
            className="relative flex h-[120px] cursor-crosshair touch-pan-y items-end gap-[2px] rounded-[2px] outline-offset-8"
          >
            {BARS.map((bar, i) => {
              const done = doneOf(bar, now);
              return (
                <span key={bar.start} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  {done > 0 ? (
                    <span className={cn("flex flex-col overflow-hidden rounded-[1px] transition-[opacity,height] duration-300", at !== null && at !== i && "opacity-25")} style={{ height: `${Math.max(3, ((bar.count * done) / MOST) * 100)}%` }}>
                      {bar.flagged > 0 && done === 1 && <span className="h-[6px] shrink-0 bg-accent" />}
                      <span className={cn("flex-1", i === nowBar ? "bg-accent" : "bg-ink")} />
                    </span>
                  ) : (
                    <span className={cn("h-[3px] rounded-[1px] bg-line-strong transition-opacity", at !== null && at !== i && "opacity-40")} />
                  )}
                </span>
              );
            })}

            {/* Now. */}
            <span aria-hidden className="pointer-events-none absolute -bottom-2 -top-2 w-[2px] -translate-x-1/2 bg-accent transition-[left] duration-700" style={{ left: pct(now) }}>
              <span className="tabular absolute left-2 top-0 font-mono text-[15px] font-medium text-accent">now</span>
            </span>

            <AnimatePresence>
              {b && ex && (
                <motion.div
                  key="tip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn("pl-pop pointer-events-none absolute bottom-full z-10 mb-4 w-max max-w-[320px] rounded-[10px] px-3.5 py-2.5 text-[15px] leading-[1.4]", place < 0.18 ? "" : place > 0.82 ? "-translate-x-full" : "-translate-x-1/2")}
                  style={{ left: `${place * 100}%` }}
                >
                  <span className="block text-ink">
                    <span className="tabular font-mono">
                      {clockOf(b.start)} to {clockOf(b.start + DAY.step)}
                    </span>
                    , {said}
                  </span>
                  {k > 0 && (
                    <span className="mt-0.5 block truncate text-mute">
                      {ex.person.name}: {ex.title}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div aria-hidden className="tabular relative mt-3 h-6 font-mono text-[15px] text-mute">
          {HOURS.map((m, i) => (
            <span key={m} className={cn("absolute", i === 0 ? "" : i === HOURS.length - 1 ? "-translate-x-full" : "-translate-x-1/2", i % 3 !== 0 && "max-sm:hidden")} style={{ left: pct(m) }}>
              {clockOf(m)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const box = useRef<HTMLElement>(null);
  const seen = useInView(box, { amount: 0.25 });
  const engaged = useEngaged();
  const [log, setLog] = useState<Entry[]>(() => OPENING.map((d, i) => ({ h: happening(i, forLog(i)), at: NOW + d })).reverse());
  const [openId, setOpenId] = useState<number | null>(OPENING.length - 1);
  const [now, setNow] = useState(NOW);
  const count = useRef(OPENING.length);
  const clock = useRef(NOW);
  const quiet = useRef(0);

  const arrive = useCallback(() => {
    if (clock.current >= LAST) return;
    const i = count.current++;
    clock.current = Math.min(LAST, clock.current + 1 + (i % 3));
    const e: Entry = { h: happening(i, forLog(i), true), at: clock.current };
    setNow(clock.current);
    setLog((list) => [e, ...list].slice(0, 7));
    if (performance.now() > quiet.current) setOpenId(i);
    setTimeout(() => setLog((list) => list.map((x) => (x.h.id === i ? { ...x, h: { ...x.h, busy: false } } : x))), 1400);
  }, []);

  useEffect(() => {
    if (!seen || !engaged) return;
    const t = setInterval(() => !document.hidden && arrive(), 3800);
    return () => clearInterval(t);
  }, [seen, engaged, arrive]);

  return (
    <section ref={box} className="pb-10 pt-12 sm:pt-16 lg:pt-20">
      <Container>
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-16">
          <div className="lg:pt-6">
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="text-balance text-[clamp(3rem,6.2vw,5rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-ink">
              HR that does the paperwork.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }} className="mt-7 max-w-[520px] text-pretty text-[19px] leading-[1.5] text-mute">
              pello answers policy questions, approves time off inside your rules, runs payroll and gets new hires ready for day one. This is one Friday at {COMPANY.name}, a company of {COMPANY.people}, as pello worked through it.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Magnetic strength={0.12}>
                <ButtonLink href="/contact" size="lg" chevron>
                  Book a demo
                </ButtonLink>
              </Magnetic>
              <a href="#time-off" className="group inline-flex h-12 items-center gap-2 rounded-[8px] text-[16px] font-medium text-ink">
                Follow the day
                <ArrowDownIcon size={16} weight="bold" className="transition-transform duration-200 group-hover:translate-y-0.5" />
              </a>
            </motion.div>
            <p className="mt-6 text-[15px] text-mute">Free for 30 days. Most teams are set up in an afternoon.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }} className="min-w-0">
            <DayLog
              log={log}
              now={now}
              openId={openId}
              onOpen={(id) => {
                quiet.current = performance.now() + 9000;
                setOpenId((o) => (o === id ? null : id));
              }}
              onUndo={(id) => {
                quiet.current = performance.now() + 9000;
                setLog((list) => list.map((x) => (x.h.id === id ? { ...x, undone: true } : x)));
              }}
            />
          </motion.div>
        </div>

        <DayStrip now={now} />
      </Container>
    </section>
  );
}
