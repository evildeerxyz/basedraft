"use client";

import { CheckIcon, VaultIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { ditherStyle } from "@/lib/dither";
import { cn, EASE_OUT } from "@/lib/utils";
import { Stepper } from "../site/Stepper";
import { pal } from "@/lib/palette";

const LAYERS = [
  {
    title: "Custody",
    body: "Your assets sit at an independent, regulated custodian in your name. Zuno can't borrow, lend or pledge them.",
    facts: ["Held in your name", "SIPC up to $500,000", "Never on our balance sheet"],
  },
  {
    title: "Encryption",
    body: "AES-256 at rest, TLS 1.3 in transit, and keys kept in hardware security modules. Sensitive fields are encrypted twice.",
    facts: ["AES-256 at rest", "TLS 1.3 in transit", "Keys in HSMs"],
  },
  {
    title: "Access",
    body: "Passkeys, Face ID and hardware keys for you. Least-privilege access for employees, and it expires on its own.",
    facts: ["Passkeys and Face ID", "Hardware key support", "Staff access expires in 8 hours"],
  },
  {
    title: "Monitoring",
    body: "Every login, withdrawal and device change is scored for risk in real time, with people on call around the clock.",
    facts: ["Real-time risk scoring", "New devices re-verify", "Humans on call 24/7"],
  },
];

function Rings({ active }: { active: number }) {
  return (
    <div className="flex h-full flex-col p-6 sm:p-9">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        {LAYERS.map((l, i) => {
          const inset = (LAYERS.length - 1 - i) * 11;
          const on = i === active;
          return (
            <motion.div
              key={l.title}
              className={cn("absolute rounded-[36px] border-2 transition-colors duration-500", on ? "border-lime" : i < active ? "border-white/25" : "border-white/10")}
              style={{ inset: `${inset}%` }}
              animate={on ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={on ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
            >
              {on && <motion.div layoutId="layer-fill" className="absolute inset-0 rounded-[34px] opacity-25" style={ditherStyle(pal.accent, 0.35, 2)} />}
              <span className={cn("absolute left-5 top-0 -translate-y-1/2 rounded-full bg-ink-2 px-2.5 text-[15px] font-medium transition-colors duration-500", on ? "text-accent" : "text-white/55")}>
                {l.title}
              </span>
            </motion.div>
          );
        })}
        <div className="absolute inset-[38%] grid place-items-center rounded-[22px] bg-lime text-on-lime">
          <div className="text-center">
            <VaultIcon size={30} weight="fill" className="mx-auto" />
            <div className="mt-1 text-[15px] font-semibold leading-tight">Your money</div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {LAYERS[active].facts.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[16px] text-white/85">
              <CheckIcon size={15} weight="bold" className="text-accent" /> {f}
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

export function LayerStack() {
  return (
    <Stepper steps={LAYERS.map(({ title, body }) => ({ title, body }))} duration={5}>
      {(i) => <Rings active={i} />}
    </Stepper>
  );
}
