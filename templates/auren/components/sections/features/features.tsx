"use client";

import { useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/site";
import { SectionLabel } from "../../ui/primitives";
import { DitherReveal, FadeIn, RevealText } from "../../ui/reveal";
import { AgentsVisual } from "./agents-visual";
import { IndexVisual } from "./index-visual";
import { ReviewVisual } from "./review-visual";
import { TabVisual } from "./tab-visual";

type Chapter = {
  n: string;
  title: string;
  body: string;
  facts: string[];
  Visual: ComponentType<{ active: boolean }>;
};

const CHAPTERS: Chapter[] = [
  {
    n: "01",
    title: "It has read everything.",
    body: "Auren builds a semantic index of your repository, its history and its docs, on your machine, in seconds. Ask a question and get an answer that cites file and line, not a guess.",
    facts: ["1M lines indexed in 41 s", "Answers cite file:line", "Re-indexes on save"],
    Visual: IndexVisual,
  },
  {
    n: "02",
    title: "Hand off the whole task.",
    body: "Describe a change and keep working. Background agents plan, edit and run your tests on their own branch, in a sandbox. Then they wait for you with a diff.",
    facts: ["Up to 4 agents at once", "Isolated branch and sandbox", "Tests run before it asks"],
    Visual: AgentsVisual,
  },
  {
    n: "03",
    title: "Tab predicts the next edit.",
    body: "Not the next word, the next edit. Rename a parameter and Auren lines up every place that has to follow. Tab, tab, tab. It runs on-device, so it’s instant and free.",
    facts: ["On-device, ~22 ms", "Follows edits across files", "Unlimited on every plan"],
    Visual: TabVisual,
  },
  {
    n: "04",
    title: "Nothing lands without you.",
    body: "Every change arrives as a diff with its reasoning attached. Keep the hunks you agree with, drop the rest, and Auren re-runs the tests on what you kept.",
    facts: ["Hunk-level keep and drop", "Reasoning on every hunk", "Tests re-run on what you keep"],
    Visual: ReviewVisual as ComponentType<{ active: boolean }>,
  },
];

export function Features() {

  return (
    <section id="product" className="relative bg-paper text-ink">
      <div className="container-x pb-10 pt-20 md:pt-28">
        <SectionLabel index="01">Product</SectionLabel>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 className="type-display text-[clamp(2.5rem,6vw,5.5rem)] lg:col-span-8">
            <RevealText lines={["An editor that", "does the reading."]} />
          </h2>
          <FadeIn delay={0.2} className="self-end lg:col-span-4">
            <p className="max-w-[40ch] text-[17px] leading-[1.55] text-ink/60">
              Autocomplete was a start. Auren reads your repository the way a new teammate would, then does the parts of
              the job you would rather review than type.
            </p>
          </FadeIn>
        </div>
      </div>
      {/* CSS picks the layout so phones never render the tall desktop track first */}
      <div className="hidden lg:block">
        <StickyChapters />
      </div>
      <div className="lg:hidden">
        <StackedChapters />
      </div>
    </section>
  );
}

function StickyChapters() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const lenis = useLenis();
  const live = useInView(track);
  const n = CHAPTERS.length;
  const local = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v * n - active)));

  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(n - 1, Math.max(0, Math.floor(v * n)))));

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const target = top + ((i + 0.08) / n) * (el.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(target, { duration: 1.2 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div ref={track} className="relative" style={{ height: `${n * 90 + 10}vh` }}>
      <div className="sticky top-0 flex h-svh items-center">
        <div className="container-x grid grid-cols-12 items-center gap-10">
          <ol className="col-span-5 border-b border-ink/12">
            {CHAPTERS.map((c, i) => (
              <ChapterItem key={c.n} chapter={c} active={i === active} progress={local} onSelect={() => jump(i)} />
            ))}
          </ol>
          <div className="col-span-7">
            <Stage active={active} live={live} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterItem({
  chapter,
  active,
  progress,
  onSelect,
}: {
  chapter: Chapter;
  active: boolean;
  progress: MotionValue<number>;
  onSelect: () => void;
}) {
  return (
    <li className="relative border-t border-ink/12">
      {active && (
        <motion.span aria-hidden className="absolute -top-px left-0 h-px w-full origin-left bg-ink" style={{ scaleX: progress }} />
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "step" : undefined}
        className={cn(
          "flex w-full items-baseline gap-5 py-5 text-left transition-opacity duration-300",
          active ? "opacity-100" : "opacity-35 hover:opacity-70",
        )}
      >
        <span className="font-mono text-[12px]">{chapter.n}</span>
        <span className="type-title text-[clamp(1.5rem,2.3vw,2.1rem)]">{chapter.title}</span>
      </button>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pl-[calc(12px+1.25rem+0.5ch)]">
              <p className="max-w-[46ch] text-[15.5px] leading-[1.6] text-ink/65">{chapter.body}</p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11.5px] text-ink/50">
                {chapter.facts.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="size-1 bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Stacks visuals and dissolves each new one in over the last. */
function Stage({ active, live }: { active: number; live: boolean }) {
  const [layers, setLayers] = useState([{ index: active, key: 0 }]);
  const top = layers[layers.length - 1];
  if (top.index !== active) {
    setLayers([...layers.slice(-1), { index: active, key: top.key + 1 }]);
  }

  return (
    <div className="relative h-[clamp(460px,66vh,600px)]">
      {layers.map((layer, i) => {
        const { Visual } = CHAPTERS[layer.index];
        const isTop = i === layers.length - 1;
        return (
          <DitherReveal
            key={layer.key}
            trigger={layer.key === 0 ? "view" : "mount"}
            scale={5}
            duration={layer.key === 0 ? 1000 : 650}
            className="absolute inset-0"
            onDone={() => setLayers((ls) => ls.filter((l) => l.key >= layer.key))}
          >
            <Visual active={isTop && live} />
          </DitherReveal>
        );
      })}
    </div>
  );
}

function StackedChapters() {
  return (
    <div className="container-x space-y-20 pb-24 pt-6">
      {CHAPTERS.map((c) => (
        <StackedChapter key={c.n} chapter={c} />
      ))}
    </div>
  );
}

function StackedChapter({ chapter }: { chapter: Chapter }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const { Visual } = chapter;
  return (
    <div ref={ref}>
      <div className="flex items-baseline gap-4 border-t border-ink/12 pt-5">
        <span className="font-mono text-[12px] text-ink/50">{chapter.n}</span>
        <h3 className="type-title text-[1.75rem]">{chapter.title}</h3>
      </div>
      <p className="mt-3 text-[15.5px] leading-[1.6] text-ink/65">{chapter.body}</p>
      <DitherReveal scale={4} className="mt-6 h-[540px]">
        <Visual active={inView} />
      </DitherReveal>
    </div>
  );
}
