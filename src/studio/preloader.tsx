"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/lib/utils";
import { WithKeys } from "@/site/keys";

/*
 * What Studio shows while it opens: the mark laying its draft onto the base, the project's name,
 * a line that fills as Studio really gets there (its code, your draft, the first page drawn), and
 * a tip worth knowing while you wait. It sits on Studio's own background, so it dissolves into it.
 *
 * The loading screen before Studio's code arrives and the one Studio shows until its first page
 * is drawn are this same component; the line picks up where the last one left it.
 */

const FRONT = "M6.85547 27.2182V12.6708C6.85547 11.2225 7.81635 9.95166 9.20555 9.56255L22.5167 5.83433C24.5479 5.26541 26.565 6.78215 26.5931 8.89956L26.7742 22.5376C26.7927 23.9328 25.9163 25.1818 24.6017 25.6336L11.1095 30.2712C9.02405 30.9879 6.85547 29.4317 6.85547 27.2182Z";
const BACK = "M28.6015 10.8973L16.0958 17.0783L16.0698 17.0949C15.1656 17.6727 14.6078 18.6652 14.5825 19.7411L14.3291 30.5163C14.2766 32.7474 16.4414 34.3571 18.5513 33.6561L31.0303 29.5082C32.3457 29.0709 33.2339 27.8362 33.2339 26.4448V13.7925C33.2339 11.4025 30.7368 9.84189 28.6015 10.8973Z";

const TIPS = [
  "Click any text on the page to change it.",
  "{C} leaves a comment anywhere on the page.",
  "Hold {Space} and drag to move around the canvas.",
  "{Cmd D} duplicates the section you've selected.",
  "Every breakpoint sits side by side, at its real width.",
  "Copy any section into Figma, with auto layout.",
  "{?} shows every shortcut.",
];

/** Where the line got to, so the next screen starts there. */
let reached = 0;

function Mark() {
  const still = useReducedMotion();
  return (
    <svg width={48} height={48} viewBox="0 0 40 40" aria-hidden className="text-fg">
      <motion.path d={BACK} fill="currentColor" fillOpacity={0.7} initial={still ? false : { opacity: 0, x: 3, y: 2 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }} />
      {/* The draft: laid onto its base, then lifting a little and settling again, as if being worked on. */}
      <motion.path
        d={FRONT}
        fill="currentColor"
        initial={still ? false : { opacity: 0, x: -5, y: -6, rotate: -8 }}
        animate={still ? { opacity: 1 } : { opacity: 1, x: [-5, 0, 0, -1.2, 0], y: [-6, 0, 0, -1.6, 0], rotate: [-8, 0, 0, -2, 0] }}
        transition={still ? undefined : { duration: 2.4, times: [0, 0.22, 0.6, 0.78, 1], ease: EASE_OUT, repeat: Infinity, repeatDelay: 0.3 }}
        style={{ transformOrigin: "16px 18px" }}
      />
    </svg>
  );
}

export function Preloader({ title, stage, progress }: { title: string; stage: string; progress: number }) {
  // The same first tip everywhere: this screen is also drawn on the server, which can't roll dice.
  const [tip, setTip] = useState(0);
  const [from] = useState(() => reached);
  useEffect(() => {
    reached = Math.max(reached, progress);
  }, [progress]);
  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" aria-label={`${title}. ${stage}`} className="fixed inset-0 z-[300] grid place-items-center bg-well text-fg">
      <div className="flex w-[260px] flex-col items-center text-center">
        <Mark />
        <p className="mt-6 max-w-full truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
        <div className="relative mt-1 h-6 w-full overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="absolute inset-x-0 top-0 text-[13px] leading-6 text-muted">
              {stage}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="mt-5 h-[3px] w-[180px] overflow-hidden rounded-full bg-fg/[0.08]">
          <motion.div className="h-full rounded-full bg-fg" initial={{ width: `${from * 100}%` }} animate={{ width: `${Math.max(from, progress) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 24 }} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-10 flex h-6 justify-center overflow-hidden px-6">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={tip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="text-[13px] leading-6 text-subtle">
            <WithKeys text={TIPS[tip]} />
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
