"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { DitherField } from "@/components/site/dither";
import { Container, SectionHead } from "@/components/site/ui";

/* What changes in a team's first three months on pello: four numbers that count up as they come into view. */

const STATS = [
  { value: 71, unit: "%", label: "of questions answered without a person", before: "Before pello, every one went to HR." },
  { value: 4, unit: " min", label: "from asking for time off to an answer", before: "Before pello, two days on average." },
  { value: 1, unit: " day", label: "to run payroll in four countries", before: "Before pello, four days and a spreadsheet." },
  { value: 98, unit: "%", label: "of new starters ready on day one", before: "Before pello, 61%." },
];

function Count({ to, go }: { to: number; go: boolean }) {
  const v = useMotionValue(to);
  const text = useTransform(v, (n) => String(Math.round(n)));
  useEffect(() => {
    if (!go) return;
    v.set(0);
    const a = animate(v, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => a.stop();
  }, [go, to, v]);
  return <motion.span className="tabular">{text}</motion.span>;
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const go = useInView(ref, { once: true, amount: 0.35 });
  return (
    <section className="relative overflow-hidden bg-night pb-56 pt-28 text-night-ink lg:pb-64 lg:pt-36">
      {/* Vermilion rising from the bottom edge, below the numbers. */}
      <DitherField inks={["accent", "night"]} shape="rise" reach={0.26} cell={4} drift className="absolute inset-0" />
      <Container className="relative">
        <SectionHead dark title="What changes in the first three months." lead="Averages across 1,200 teams on pello, from January to September 2026." />
        <div ref={ref} className="mt-20 grid gap-x-12 gap-y-16 sm:grid-cols-2">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 24 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <p className="font-display text-[clamp(6rem,13vw,12rem)] font-extrabold leading-[0.8]">
                <Count to={s.value} go={go} />
                <span className="text-accent">{s.unit}</span>
              </p>
              <p className="mt-5 max-w-[400px] font-display text-[30px] font-bold leading-[1.05]">{s.label}</p>
              <p className="mt-2 text-[18px] text-night-mute">{s.before}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
