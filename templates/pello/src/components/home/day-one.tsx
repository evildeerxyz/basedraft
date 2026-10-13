"use client";

import { ArrowCounterClockwiseIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Mark } from "@/components/site/logo";
import { Button, Face, Moment, Tag, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { useEngaged } from "@/lib/engaged";
import { personOf, type Person } from "@/lib/people";
import { SCENES } from "@/lib/photos";

/*
 * 13:20. Leo's laptop arrives, the last thing on the list pello started when his contract was
 * signed. His desk is printed big; his list sits over it, and ticks off its last item once someone
 * is on the page. Run it again to watch the weeks before go by.
 */

const LEO = personOf("leo");
const TASKS: Array<{ text: string; by: "pello" | Person; at: string }> = [
  { text: "Contract signed", by: LEO, at: "Oct 19" },
  { text: "Payroll and pension set up", by: "pello", at: "Oct 19" },
  { text: "Slack and GitHub accounts", by: "pello", at: "Oct 26" },
  { text: "Clara picked as his buddy", by: personOf("oliver"), at: "Oct 27" },
  { text: "First week in his calendar", by: "pello", at: "Oct 28" },
  { text: "Laptop delivered to the office", by: "pello", at: momentOf("day-one").at },
];

function Checklist({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.5, once: true });
  const engaged = useEngaged();
  // At rest it's this morning: everything done but the laptop, which is on its way.
  const [done, setDone] = useState(TASKS.length - 1);
  const [run, setRun] = useState(0);
  const playing = run > 0 || (seen && engaged);

  useEffect(() => {
    if (!playing || done >= TASKS.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), run > 0 ? (done === 0 ? 350 : 380) : 900);
    return () => clearTimeout(t);
  }, [playing, done, run]);

  const ready = done >= TASKS.length;
  return (
    <div ref={ref}>
      <Window className={className} title={`${LEO.name}, day one`} icon={<Face person={LEO} size={26} hot={ready} />} aside={<Tag tone={ready ? "done" : "live"}>{ready ? "Ready for Monday" : "In progress"}</Tag>}>
        <ul className="p-2">
          {TASKS.map((t, i) => {
            const on = i < done;
            const next = i === done;
            return (
              <li key={t.text} className="flex items-center gap-3 rounded-[8px] px-2.5 py-2">
                <motion.span initial={false} animate={on ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.3 }} className={cn("grid size-[18px] shrink-0 place-items-center rounded-[5px] transition-colors duration-300", on ? "bg-ink text-page" : next ? "shadow-[inset_0_0_0_1.5px_var(--pl-accent)]" : "shadow-[inset_0_0_0_1.5px_var(--pl-line-strong)]")}>
                  {on && <CheckIcon size={11} weight="bold" />}
                </motion.span>
                <span className={cn("min-w-0 flex-1 truncate text-[15px] transition-colors", on ? "text-ink" : next ? "text-accent" : "text-mute")}>{next && i === TASKS.length - 1 ? "Laptop out for delivery" : t.text}</span>
                <span className={cn("tabular w-[64px] shrink-0 whitespace-nowrap text-right font-mono text-[15px] transition-opacity", on ? "text-mute opacity-100" : "opacity-0")}>{t.at}</span>
                {t.by === "pello" ? <Mark size={22} /> : <Face person={t.by} size={22} />}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <div className="grid flex-1 grid-cols-6 gap-1">
            {TASKS.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-300", i < done ? "bg-ink" : "bg-sunken")} />
            ))}
          </div>
          <span className="tabular font-mono text-[15px] text-mute">
            {done}/{TASKS.length}
          </span>
          <Button
            kind="light"
            size="sm"
            onClick={() => {
              setDone(0);
              setRun((r) => r + 1);
            }}
          >
            <ArrowCounterClockwiseIcon size={14} />
            Again
          </Button>
        </div>
      </Window>
    </div>
  );
}

export function DayOne() {
  return (
    <Moment id="day-one" time={momentOf("day-one").at} where="London office" title="Leo's laptop arrived. He starts on Monday." lead="pello has worked through his list since the contract was signed on October 19. The parts that needed a person went to that person, and nobody had to chase anyone.">
      <div className="relative lg:pb-10">
        <figure className="lg:w-[72%]">
          <Dithered src={SCENES.desk} alt="A desk by a window, with a laptop open on it" inks={["ink", "mute", "page"]} cell={2} focus={[0.6, 0.5]} className="aspect-[16/11] w-full rounded-[14px]" />
          <figcaption className="mt-3 text-[15px] text-mute">Leo&apos;s desk, third floor, by the window.</figcaption>
        </figure>
        <div className="relative z-10 -mt-24 px-3 sm:px-8 lg:absolute lg:right-0 lg:top-16 lg:mt-0 lg:w-[420px] lg:px-0">
          <Checklist className="pl-pop" />
        </div>
      </div>
    </Moment>
  );
}
