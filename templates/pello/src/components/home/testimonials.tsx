"use client";

import { ArrowLeftIcon, ArrowRightIcon, SlackLogoIcon } from "@phosphor-icons/react/ssr";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Band, Face, SectionHead } from "@/components/site/ui";
import { STORIES, WALL, type Story } from "@/lib/customers";
import { personOf } from "@/lib/people";
import { customerPhoto } from "@/lib/photos";

/*
 * What people say: the heads of People teams on cards you can drag sideways (or step through), and
 * under them, a wall of what the people who use pello every day post about it.
 */

function Card({ s }: { s: Story }) {
  const [hover, setHover] = useState(false);
  return (
    <article onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} className="pl-card grid w-[min(86vw,620px)] shrink-0 select-none overflow-hidden rounded-[16px] sm:grid-cols-[200px_1fr]">
      <Dithered src={customerPhoto(s.name)} alt={s.name} inks={hover ? ["ink", "accent", "surface"] : ["ink", "mute", "surface"]} cell={2} focus={[0.5, 0.3]} className="aspect-[4/3] sm:aspect-auto sm:h-full" />
      <div className="flex flex-col p-6 sm:p-7">
        <blockquote className="font-display text-[22px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <span>
            <span className="block text-[15px] font-semibold text-ink">{s.name}</span>
            <span className="block text-[15px] text-mute">
              {s.role}, {s.company}
            </span>
          </span>
          <span className="text-right">
            <span className="block font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-accent">{s.result}</span>
            <span className="mt-1 block max-w-[150px] text-[15px] leading-snug text-mute">{s.resultLabel}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [edge, setEdge] = useState<"start" | "middle" | "end">("start");

  const min = () => (view.current && track.current ? Math.min(0, view.current.offsetWidth - track.current.scrollWidth) : 0);
  const progress = useTransform(x, (v) => {
    const m = min();
    return m ? v / m : 0;
  });
  const bar = useTransform(progress, (p) => 0.2 + p * 0.8);
  useMotionValueEvent(x, "change", (v) => {
    const m = min();
    setEdge(v >= -2 ? "start" : v <= m + 2 ? "end" : "middle");
  });
  const by = (dir: 1 | -1) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 620) + 12;
    animate(x, Math.max(min(), Math.min(0, x.get() - dir * step)), { type: "spring", stiffness: 260, damping: 34 });
  };

  return (
    <Band rule id="testimonials" inner="overflow-hidden py-24 lg:overflow-visible lg:py-32">
      <SectionHead title="People teams, in their own words" lead="Six of the 1,200 companies on pello, and what changed for them." />

      <div ref={view} className="mt-14">
        <motion.div ref={track} drag="x" dragConstraints={view} dragElastic={0.1} style={{ x }} className="flex cursor-grab gap-3 active:cursor-grabbing">
          {STORIES.map((s) => (
            <Card key={s.slug} s={s} />
          ))}
        </motion.div>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <motion.div className="h-full origin-left rounded-full bg-ink" style={{ scaleX: bar }} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => by(-1)} disabled={edge === "start"} aria-label="Previous" className="pl-btn-light grid size-10 place-items-center rounded-[10px] disabled:opacity-40">
            <ArrowLeftIcon size={16} />
          </button>
          <button type="button" onClick={() => by(1)} disabled={edge === "end"} aria-label="Next" className="pl-btn-light grid size-10 place-items-center rounded-[10px] disabled:opacity-40">
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>

      <h3 className="mt-24 text-center font-display text-[clamp(1.9rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink">And from the people who use it every day</h3>
      <div className="mt-10 columns-1 gap-3 sm:columns-2 lg:columns-3">
        {WALL.map((w, i) => {
          const p = personOf(w.person);
          return (
            <motion.figure key={w.person} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: (i % 3) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="pl-card mb-3 break-inside-avoid rounded-[14px] p-5">
              <figcaption className="flex items-center gap-3">
                <Face person={p} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{p.name}</span>
                  <span className="block truncate text-[15px] text-mute">
                    {p.role}, {w.at}
                  </span>
                </span>
                <SlackLogoIcon size={18} className="shrink-0 text-mute" />
              </figcaption>
              <blockquote className="mt-3 text-[16px] leading-[1.55] text-ink-2">{w.text}</blockquote>
            </motion.figure>
          );
        })}
      </div>
    </Band>
  );
}
