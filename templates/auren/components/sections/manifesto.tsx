"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { HardDrivesIcon, LockKeyIcon, ShieldCheckIcon, WifiSlashIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/site";
import { SectionLabel } from "../ui/primitives";
import { FadeIn } from "../ui/reveal";

// [brackets] mark the phrases that get underlined as they light up
const TEXT =
  "Your code [stays on your machine.] The index is built locally and never leaves it. Prompts are encrypted in transit, processed with [zero retention,] and never used to train anything, ours or anyone else’s. And when the work demands it, unplug: Auren runs [fully offline] on local models.";

const WORDS = (() => {
  let emphasis = false;
  return TEXT.split(" ").map((raw) => {
    const opens = raw.startsWith("[");
    const closes = raw.includes("]");
    if (opens) emphasis = true;
    // `joined` carries the highlight across the space into the next word
    const word = { text: raw.replace(/[[\]]/g, ""), emphasis, joined: emphasis && !closes };
    if (closes) emphasis = false;
    return word;
  });
})();

const PROOF = [
  { icon: HardDrivesIcon, title: "Local index", body: "Embeddings are computed and stored on your disk." },
  { icon: LockKeyIcon, title: "Zero retention", body: "Prompts and code are dropped after every request." },
  { icon: ShieldCheckIcon, title: "SOC 2 Type II", body: "Audited every year. Report available on request." },
  { icon: WifiSlashIcon, title: "Offline mode", body: "Bring a local model and pull the cable." },
];

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });

  return (
    <section id="privacy" className="bg-paper py-24 text-ink md:py-36">
      <div className="container-x">
        <SectionLabel index="02">Privacy</SectionLabel>
        <p
          ref={ref}
          className="type-title mt-10 max-w-[22ch] text-[clamp(2rem,4.6vw,4.25rem)] leading-[1.06] md:max-w-[26ch]"
        >
          {WORDS.map((w, i) => (
            <Word key={i} word={w} index={i} total={WORDS.length} progress={scrollYProgress} />
          ))}
        </p>

        <ul className="mt-20 grid grid-cols-1 border-t border-ink/12 sm:grid-cols-2 lg:grid-cols-4">
          {PROOF.map(({ icon: Icon, title, body }, i) => (
            <FadeIn
              as="li"
              key={title}
              delay={i * 0.07}
              className="border-b border-ink/12 py-6 pr-6 sm:odd:border-r lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <Icon size={20} className="text-ink" />
              <div className="type-label mt-5">{title}</div>
              <p className="mt-2 max-w-[28ch] text-[14.5px] leading-snug text-ink/55">{body}</p>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: (typeof WORDS)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = Math.min(1, start + 3 / total);
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  const line = useTransform(progress, [start, end], [0, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className="relative isolate inline-block">
        {word.text}
        {word.emphasis && (
          <motion.span
            aria-hidden
            style={{ scaleX: line }}
            className={cn(
              "absolute bottom-[0.02em] left-0 -z-10 h-[0.32em] origin-left bg-accent",
              word.joined ? "-right-[0.3em]" : "right-0",
            )}
          />
        )}
      </motion.span>{" "}
    </>
  );
}
