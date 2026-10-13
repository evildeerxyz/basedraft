"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Container, SectionHead } from "@/components/site/ui";
import { STORIES, type Story } from "@/lib/customers";

/* What customers say, on cards you can drag sideways (or step through with the buttons). */

function Card({ s }: { s: Story }) {
  return (
    <article className="flex w-[min(84vw,440px)] shrink-0 select-none flex-col justify-between rounded-[28px] bg-surface p-7 shadow-[inset_0_0_0_1px_var(--pl-line)] sm:p-8">
      <div>
        <p className="text-[46px] font-semibold leading-none tracking-[-0.05em] text-accent">{s.result}</p>
        <p className="mt-2 text-[16px] text-mute">{s.resultLabel}</p>
      </div>
      <blockquote className="mt-10 text-[21px] leading-[1.45] tracking-[-0.015em] text-ink">{s.quote}</blockquote>
      <footer className="mt-10 flex items-center gap-3.5">
        <span aria-hidden className="grid size-11 place-items-center rounded-full bg-sunken text-[15px] font-semibold text-ink-2">
          {s.name
            .split(" ")
            .map((w) => w[0])
            .join("")}
        </span>
        <span>
          <span className="block text-[17px] font-semibold text-ink">{s.name}</span>
          <span className="block text-[15px] text-mute">
            {s.role}, {s.company}
          </span>
        </span>
      </footer>
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
            <button type="button" onClick={() => by(-1)} disabled={edge === "start"} aria-label="Previous" className="grid size-12 place-items-center rounded-full bg-page text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] transition-opacity hover:bg-sunken disabled:opacity-35">
              <ArrowLeftIcon size={20} />
            </button>
            <button type="button" onClick={() => by(1)} disabled={edge === "end"} aria-label="Next" className="grid size-12 place-items-center rounded-full bg-page text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] transition-opacity hover:bg-sunken disabled:opacity-35">
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
        <div className="mt-10 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <motion.div className="h-full origin-left rounded-full bg-ink" style={{ scaleX: bar }} />
        </div>
      </Container>
    </section>
  );
}
