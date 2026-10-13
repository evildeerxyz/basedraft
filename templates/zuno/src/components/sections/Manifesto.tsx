"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const TEXT: Array<[string, boolean?]> = [
  ["Most people don't lose money picking the wrong stocks. They lose it to"],
  ["fees,", true],
  ["panic,", true],
  ["and"],
  ["forgetting.", true],
  ["Zuno is the calm, tireless brain that handles all three, so your money keeps"],
  ["compounding", true],
  ["while you get on with your life."],
];

function Word({ children, progress, range, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; accent?: boolean }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className={cn("mr-[0.24em] inline-block", accent && "text-accent")}>
      {children}
    </motion.span>
  );
}

/** Scroll-scrubbed manifesto: each word lights up as it passes the reading line. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.flatMap(([chunk, accent]) => chunk.split(" ").map((w) => ({ w, accent })));
  const n = words.length;

  return (
    <section className="relative mx-auto max-w-[1180px] px-5 py-32 lg:px-8 lg:py-44">
      <p ref={ref} className="text-[clamp(1.9rem,4.3vw,4rem)] font-medium leading-[1.06] tracking-[-0.04em]">
        {words.map(({ w, accent }, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / n, Math.min(1, (i + 1.5) / n)]} accent={accent}>
            {w}
          </Word>
        ))}
      </p>
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {[
          { k: "$6", v: "a month, flat. The average adviser takes 1% of everything you own, every year." },
          { k: "24/7", v: "monitoring. Rebalancing and loss harvesting keep running, even while you sleep." },
          { k: "$1", v: "is all it takes to start. Fractional shares mean no one is priced out." },
        ].map((s) => (
          <div key={s.k}>
            <div className="text-[40px] font-semibold leading-none tracking-[-0.04em]">{s.k}</div>
            <div className="mt-3 max-w-[300px] text-[16px] leading-relaxed text-white/60">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
