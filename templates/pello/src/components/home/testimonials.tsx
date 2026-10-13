"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Container, SectionHead } from "@/components/site/ui";
import { STORIES, type Story } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

/* What customers say, on cards you can drag sideways (or step through with the buttons). */

function Card({ s }: { s: Story }) {
  const [hover, setHover] = useState(false);
  return (
    <article onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} className="flex w-[min(84vw,420px)] shrink-0 select-none flex-col overflow-hidden rounded-[4px] bg-page">
      <div className="relative">
        <Dithered src={customerPhoto(s.name)} alt={s.name} inks={hover ? ["ink", "accent", "page"] : ["ink", "page"]} cell={3} focus={[0.5, 0.3]} className="aspect-[4/3]" />
        <p className="absolute bottom-0 left-0 bg-page px-4 pb-1 pt-2 font-display text-[54px] font-extrabold leading-none text-accent">{s.result}</p>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-[16px] text-mute">{s.resultLabel}</p>
        <blockquote className="mt-6 flex-1 text-[21px] leading-[1.45] text-ink">{s.quote}</blockquote>
        <footer className="mt-8">
          <span className="block text-[18px] font-semibold text-ink">{s.name}</span>
          <span className="block text-[16px] text-mute">
            {s.role}, {s.company}
          </span>
        </footer>
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
  const bar = useTransform(progress, (p) => 0.18 + p * 0.82);
  useMotionValueEvent(x, "change", (v) => {
    const m = min();
    setEdge(v >= -2 ? "start" : v <= m + 2 ? "end" : "middle");
  });

  const by = (dir: 1 | -1) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 440) + 20;
    animate(x, Math.max(min(), Math.min(0, x.get() - dir * step)), { type: "spring", stiffness: 260, damping: 34 });
  };

  return (
    <section className="overflow-hidden bg-surface py-28 lg:py-36">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead title="The people teams who stopped doing paperwork." />
          <div className="flex gap-2">
            <button type="button" onClick={() => by(-1)} disabled={edge === "start"} aria-label="Previous" className="grid size-12 place-items-center rounded-[4px] text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page disabled:opacity-30">
              <ArrowLeftIcon size={20} />
            </button>
            <button type="button" onClick={() => by(1)} disabled={edge === "end"} aria-label="Next" className="grid size-12 place-items-center rounded-[4px] text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page disabled:opacity-30">
              <ArrowRightIcon size={20} />
            </button>
          </div>
        </div>
        <div ref={view} className="mt-14">
          <motion.div ref={track} drag="x" dragConstraints={view} dragElastic={0.12} style={{ x }} className="flex cursor-grab gap-5 active:cursor-grabbing">
            {STORIES.map((s) => (
              <Card key={s.slug} s={s} />
            ))}
          </motion.div>
        </div>
        <div className="mt-10 h-1 overflow-hidden bg-line-strong" aria-hidden>
          <motion.div className="h-full origin-left bg-ink" style={{ scaleX: bar }} />
        </div>
      </Container>
    </section>
  );
}
