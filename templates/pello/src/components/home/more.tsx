"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/site/brand";
import { Band, Face } from "@/components/site/ui";
import { personOf } from "@/lib/people";

/*
 * The rest of the paperwork, as small tiles. Each shows a little of the real thing instead of an
 * icon: a signature, a receipt, a payslip. Point at one and it does its thing.
 */

function Tile({ label, children }: { label: string; children: (hover: boolean) => ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <div onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} className="pl-card group flex h-[190px] flex-col overflow-hidden rounded-[16px]">
      <div className="relative grid flex-1 place-items-center overflow-hidden bg-page/50 px-4">{children(hover)}</div>
      <p className="px-4 py-3.5 text-[16px] font-semibold text-ink shadow-[0_-1px_0_var(--pl-line)]">{label}</p>
    </div>
  );
}

const paper = "rounded-[8px] bg-surface shadow-[0_0_0_1px_var(--pl-line),0_4px_10px_-6px_rgb(0_0_0/0.15)]";

const TILES: Array<{ label: string; draw: (hover: boolean) => ReactNode }> = [
  {
    label: "E-signing",
    draw: (hover) => (
      <div className={`${paper} w-[150px] p-3`}>
        <svg viewBox="0 0 120 34" className="h-8 w-full" aria-hidden>
          <motion.path d="M4 24c8-14 14-18 16-10s-6 14 0 8 10-16 14-8-2 12 6 4 8-8 12-2 4 6 10 0 10-6 16-2 12 4 20-2" fill="none" stroke="var(--pl-ink)" strokeWidth="2" strokeLinecap="round" initial={false} animate={{ pathLength: hover ? 1 : 0.35 }} transition={{ duration: hover ? 0.9 : 0.3, ease: "easeInOut" }} />
        </svg>
        <div className="mt-1 h-px bg-line-strong" />
        <p className="mt-1.5 text-[15px] text-mute">Leo Marsh</p>
      </div>
    ),
  },
  {
    label: "Expenses",
    draw: (hover) => (
      <motion.div animate={{ rotate: hover ? -2 : 2, y: hover ? -4 : 0 }} className={`${paper} w-[132px] px-3 py-2.5`}>
        <p className="text-[15px] font-medium text-ink">Desk chair</p>
        <p className="tabular mt-1 font-mono text-[18px] font-medium text-ink">£249.00</p>
        <p className="mt-1 flex items-center gap-1 text-[15px] text-mute">
          <CheckIcon size={12} weight="bold" className="text-ink" /> In budget
        </p>
      </motion.div>
    ),
  },
  {
    label: "Payslips",
    draw: (hover) => (
      <div className="relative h-[100px] w-[150px]">
        {[2, 1, 0].map((d) => (
          <motion.div key={d} animate={{ y: hover ? -d * 10 : -d * 4, rotate: hover ? (d - 1) * 4 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className={`${paper} absolute inset-x-0 bottom-0 p-2.5`} style={{ zIndex: 3 - d }}>
            <p className="text-[15px] font-medium text-ink">October</p>
            <p className="tabular mt-0.5 flex justify-between font-mono text-[15px] text-ink-2">
              <span>Net</span>
              <span>£3,412</span>
            </p>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    label: "Reviews",
    draw: (hover) => (
      <div className={`${paper} flex w-[160px] items-center gap-2.5 p-2.5`}>
        <div className="flex -space-x-2">
          <Face person={personOf("noah")} size={30} />
          <Face person={personOf("oliver")} size={30} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ink">Mid year</p>
          <p className="text-[15px] text-mute">{hover ? "Booked, Fri" : "Due Friday"}</p>
        </div>
      </div>
    ),
  },
  {
    label: "Documents",
    draw: (hover) => (
      <div className="relative h-[96px] w-[110px]">
        {["Contract", "Handbook", "Policy"].map((t, i) => (
          <motion.div key={t} animate={{ x: hover ? (i - 1) * 26 : (i - 1) * 6, rotate: hover ? (i - 1) * 8 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className={`${paper} absolute inset-0 p-2.5`} style={{ zIndex: i }}>
            <p className="text-[15px] font-medium text-ink">{t}</p>
            <div className="mt-2 grid gap-1">
              <span className="h-1 w-full rounded-full bg-sunken" />
              <span className="h-1 w-3/4 rounded-full bg-sunken" />
              <span className="h-1 w-5/6 rounded-full bg-sunken" />
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    label: "Offboarding",
    draw: (hover) => (
      <div className={`${paper} grid w-[160px] gap-1.5 p-2.5`}>
        {["Laptop returned", "Access removed", "Final pay"].map((t, i) => (
          <p key={t} className="flex items-center gap-2 text-[15px] text-ink">
            <motion.span animate={{ scale: hover || i < 2 ? 1 : 0.6, opacity: hover || i < 2 ? 1 : 0.4 }} className="grid size-4 place-items-center rounded-full bg-ink text-surface">
              <CheckIcon size={9} weight="bold" />
            </motion.span>
            {t}
          </p>
        ))}
      </div>
    ),
  },
  {
    label: "Slack and Teams",
    draw: (hover) => (
      <div className="flex items-center gap-3">
        {(["slack", "teams"] as const).map((b, i) => (
          <motion.span key={b} animate={{ y: hover ? (i ? 6 : -6) : 0, rotate: hover ? (i ? 6 : -6) : 0 }} className={`${paper} grid size-14 place-items-center`}>
            <BrandMark brand={b} className="size-7" />
          </motion.span>
        ))}
      </div>
    ),
  },
  {
    label: "In 30 languages",
    draw: (hover) => (
      <div className="flex flex-wrap justify-center gap-1.5">
        {["Hallo", "Bonjour", "Hola", "Ciao", "Hej"].map((w, i) => (
          <motion.span key={w} animate={{ y: hover ? [0, -6, 0] : 0 }} transition={{ delay: i * 0.05, duration: 0.4 }} className={`${paper} px-2.5 py-1 text-[15px] font-medium text-ink`}>
            {w}
          </motion.span>
        ))}
      </div>
    ),
  },
];

export function More() {
  return (
    <Band rule id="more" inner="py-20 lg:py-28">
      <h2 className="text-center font-display text-[clamp(2.3rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-ink">And the rest of the paperwork</h2>
      <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-3 md:grid-cols-4">
        {TILES.map((t) => (
          <Tile key={t.label} label={t.label}>
            {t.draw}
          </Tile>
        ))}
      </div>
    </Band>
  );
}
