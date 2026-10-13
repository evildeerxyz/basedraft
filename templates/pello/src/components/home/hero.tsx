"use client";

import { ArrowDownIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dithered } from "@/components/site/dither";
import { ButtonLink, Container, Magnetic, Stamp, Tag } from "@/components/site/ui";
import { useEngaged } from "@/lib/engaged";
import { happening, type Happening } from "@/lib/happenings";
import { COMPANY, personOf, type Person } from "@/lib/people";
import { personPhoto } from "@/lib/photos";

/*
 * Fieldwork's people, on a wall. pello works through their requests one after another: whoever
 * it's handling is printed again in vermilion and stamped with what happened, and the day's log
 * beside the wall fills in. Click anyone to send a request for them. It plays once someone's on
 * the page (lib/engaged.ts), and only while the wall is on screen.
 */

const WALL = ["hannah", "leo", "grace", "marco", "priya", "oliver", "mei", "tom", "nina", "arjun", "clara", "ravi"].map(personOf);
const EASE = [0.22, 1, 0.36, 1] as const;
const STAMP: Record<string, string> = { Sent: "Paid" };
const forWall = (i: number) => WALL[(i * 5 + 3) % WALL.length];

function Tile({ person, event, onSend }: { person: Person; event?: Happening; onSend: (p: Person) => void }) {
  const [hover, setHover] = useState(false);
  const hot = hover || !!event;
  return (
    <button
      type="button"
      onClick={() => onSend(person)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`Send a request for ${person.name}`}
      className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-[4px] bg-surface text-left"
    >
      <Dithered src={personPhoto(person.id)} alt="" inks={hot ? ["ink", "accent", "page"] : ["ink", "page"]} cell={2} focus={[0.5, 0.3]} className="min-h-0 flex-1" />
      <span className="block bg-page px-3 pb-2.5 pt-2">
        <span className="block truncate text-[16px] font-semibold leading-tight text-ink">{person.name}</span>
        <span className="block truncate text-[15px] leading-tight text-mute">{person.role}</span>
      </span>
      <AnimatePresence>
        {event && (
          <motion.span key={event.id} exit={{ opacity: 0, transition: { duration: 0.25 } }} className="absolute inset-x-0 top-[34%] flex justify-center">
            <Stamp tone={event.tone === "bad" ? "accent" : "ink"} play={event.id > 4} className="bg-page/85 text-[clamp(1.2rem,1.9vw,1.75rem)]">
              {STAMP[event.done] ?? event.done}
            </Stamp>
          </motion.span>
        )}
      </AnimatePresence>
      {hover && !event && <span className="absolute right-2 top-2 rounded-[3px] bg-ink px-2 py-1 text-[15px] font-semibold text-page">{person.daysLeft} days left</span>}
    </button>
  );
}

function Log({ items }: { items: Happening[] }) {
  return (
    <ul aria-live="polite" className="relative">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((h) => (
          <motion.li
            key={h.id}
            layout
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="grid grid-cols-[52px_1fr_auto] items-baseline gap-3 py-3 shadow-[0_1px_0_var(--pl-line)]"
          >
            <span className="tabular font-mono text-[15px] text-mute">{h.at}</span>
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold leading-snug text-ink">{h.title}</span>
              <span className="block truncate text-[15px] text-mute">{h.detail}</span>
            </span>
            {h.busy ? (
              <Tag tone="open" className="text-mute">
                Checking
              </Tag>
            ) : (
              <Tag tone={h.tone === "bad" ? "flag" : "done"}>{h.done}</Tag>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export function Hero() {
  const wall = useRef<HTMLDivElement>(null);
  const seen = useInView(wall, { amount: 0.25 });
  const engaged = useEngaged();
  const [items, setItems] = useState<Happening[]>(() => [4, 3, 2, 1, 0].map((i) => happening(i, forWall(i))));
  const [stamped, setStamped] = useState<Record<string, Happening>>(() => ({ [forWall(4).id]: happening(4, forWall(4)) }));
  const [handled, setHandled] = useState(1284);
  const [flagged, setFlagged] = useState(37);
  const count = useRef(5);
  const quiet = useRef(0);

  const send = useCallback((person?: Person) => {
    const i = count.current++;
    const who = person ?? forWall(i);
    const h = happening(i, who, true);
    setItems((list) => [h, ...list].slice(0, 5));
    setStamped((s) => ({ ...s, [who.id]: h }));
    setTimeout(() => {
      setItems((list) => list.map((x) => (x.id === h.id ? { ...x, busy: false } : x)));
      setHandled((n) => n + 1);
      if (h.tone === "bad") setFlagged((n) => n + 1);
    }, 900);
    setTimeout(() => setStamped((s) => (s[who.id]?.id === h.id ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== who.id)) : s)), 2600);
  }, []);

  const click = useCallback(
    (p: Person) => {
      quiet.current = performance.now() + 6000;
      send(p);
    },
    [send],
  );

  useEffect(() => {
    if (!seen || !engaged) return;
    const t = setInterval(() => {
      if (!document.hidden && performance.now() > quiet.current) send();
    }, 2800);
    return () => clearInterval(t);
  }, [seen, engaged, send]);

  return (
    <section className="relative overflow-hidden pb-24 pt-10 lg:pt-14">
      <Container>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="font-display text-[clamp(4.6rem,12.6vw,12.4rem)] font-extrabold leading-[0.82] tracking-[-0.01em] text-ink">
          HR that does the <span className="text-accent">paperwork.</span>
        </motion.h1>

        {/* The intro, the wall and the log: on a phone in that order; on a wide screen the wall stands beside the other two. */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }} className="lg:col-span-4 lg:row-start-1">
            <p className="text-pretty text-[clamp(1.2rem,1.6vw,1.38rem)] leading-[1.45] text-ink-2">pello answers policy questions, approves time off within the rules you set, runs payroll and gets new hires ready for day one. Your people team gets back to people.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <ButtonLink href="/contact" kind="ink" size="lg" arrow>
                  Book a demo
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="#ask" kind="quiet" size="lg">
                See it work
                <ArrowDownIcon size={18} weight="bold" />
              </ButtonLink>
            </div>
          </motion.div>

          <motion.div ref={wall} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {WALL.map((p) => (
                <Tile key={p.id} person={p} event={stamped[p.id]} onSend={click} />
              ))}
            </div>
            <p className="mt-4 text-[15px] text-mute">
              Twelve of {COMPANY.name}&apos;s {COMPANY.people} people. Click anyone to send pello a request for them.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: EASE }} className="flex flex-col justify-end lg:col-span-4 lg:row-start-2 lg:pt-12">
            <div className="flex items-baseline justify-between gap-4 pb-1 shadow-[0_1.5px_0_var(--pl-ink)]">
              <h2 className="font-display text-[26px] font-extrabold text-ink">Today at {COMPANY.name}</h2>
              <span className="text-[15px] text-mute">{COMPANY.people} people</span>
            </div>
            <Log items={items} />
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div className="flex flex-col-reverse">
                <dt className="text-[15px] text-mute">Handled today</dt>
                <dd className="tabular font-display text-[52px] font-extrabold leading-none text-ink">{handled.toLocaleString("en-US")}</dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="text-[15px] text-mute">Sent to a person</dt>
                <dd className="tabular font-display text-[52px] font-extrabold leading-none text-accent">{flagged}</dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
