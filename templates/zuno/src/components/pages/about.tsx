"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/utils";
import { RollingNumber } from "../ui/RollingNumber";

const MILESTONES = [
  { year: "2021", members: "12", title: "A spreadsheet that rebalanced itself.", text: "Daniel Reyes and Sarah Lindqvist start Zuno in New York. The first twelve members are friends who agree to be guinea pigs." },
  { year: "2022", members: "2,000", title: "Registered, then launched into a bear market.", text: "Zuno Advisers registers with the SEC. Autopilot opens to 2,000 members the same month the market falls 20%." },
  { year: "2023", members: "50,000", title: "Harvesting, every trading day.", text: "Daily tax-loss harvesting ships. The average Plus member saves more in tax than the plan costs." },
  { year: "2024", members: "140,000", title: "A cash account, and a second home.", text: "Zuno Cash launches with FDIC coverage up to $2.5M. The London office opens for engineering and design." },
  { year: "2025", members: "260,000", title: "Copilot meets its first selloff.", text: "Copilot launches in spring. In five weeks of autumn turbulence it answers 214,000 questions, mostly some version of: should I sell?" },
  { year: "2026", members: "380,000", title: "$2.4 billion on Autopilot.", text: "Copilot 2.0 can act on rules you approve. The average member still opens the app twice a month." },
];

function Milestone({ m, index, onActive }: { m: (typeof MILESTONES)[number]; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, onActive, index]);
  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0.25 }}
      animate={{ opacity: inView ? 1 : 0.3 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="py-12 lg:py-20"
    >
      <div className="text-[18px] font-medium text-accent lg:hidden">{m.year}</div>
      <h3 className="mt-2 text-[clamp(1.8rem,3.2vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-balance lg:mt-0">{m.title}</h3>
      <p className="mt-4 max-w-[560px] text-[19px] leading-relaxed text-white/70">{m.text}</p>
    </motion.li>
  );
}

/** Scroll through the milestones; the year and member count roll alongside. */
export function Timeline() {
  const [active, setActive] = useState(0);
  const m = MILESTONES[active];
  return (
    <div className="grid lg:grid-cols-12 lg:gap-10">
      <div className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-[28vh]">
          <div className="text-[clamp(6rem,13vw,11rem)] font-semibold leading-[0.85] tracking-[-0.06em]">
            <RollingNumber value={m.year} />
          </div>
          <div className="mt-8 text-[17px] text-white/60">Members</div>
          <div className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.04em] text-accent">
            <RollingNumber value={m.members} />
          </div>
        </div>
      </div>
      <ol className="lg:col-span-7">
        {MILESTONES.map((x, i) => (
          <Milestone key={x.year} m={x} index={i} onActive={setActive} />
        ))}
      </ol>
    </div>
  );
}
