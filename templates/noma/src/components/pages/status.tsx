"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellSimpleIcon, CheckCircleIcon, CheckIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export type Day = "ok" | "degraded" | "down";

const DAY_COLOR: Record<Day, string> = { ok: "bg-ok", degraded: "bg-warn", down: "bg-danger" };
const DAY_LABEL: Record<Day, string> = { ok: "No issues", degraded: "Degraded performance", down: "Outage" };

/** A component row: name, current state and a 90 day strip, newest on the right. */
export function UptimeRow({ name, note, uptime, days }: { name: string; note: string; uptime: string; days: Day[] }) {
  return (
    <li className="border-b border-line px-5 py-5 last:border-b-0 md:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[16px] font-medium text-ink">{name}</span>
        <span className="text-[13.5px] text-ink-3">{note}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[13.5px] text-ok">
          <CheckCircleIcon size={17} weight="duotone" />
          Operational
        </span>
      </div>
      <div className="mt-4 flex h-8 gap-[2px]" role="img" aria-label={`${uptime} uptime over the last 90 days`}>
        {days.map((day, i) => (
          <span key={i} title={`${90 - i} days ago: ${DAY_LABEL[day]}`} className={cn("min-w-0 flex-1 rounded-[1px] opacity-85 transition-opacity hover:opacity-100", DAY_COLOR[day])} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12.5px] text-ink-3">
        <span>90 days ago</span>
        <span>{uptime} uptime</span>
        <span>Today</span>
      </div>
    </li>
  );
}

/** Email updates for incidents and maintenance. */
export function Subscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) setDone(true);
      }}
      className="flex h-12 w-full max-w-[440px] items-stretch overflow-hidden rounded-[6px] border border-ink bg-surface focus-within:[box-shadow:var(--focus-ring)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 items-center gap-2 px-4 text-[14px] text-ink">
            <span className="grid size-5 place-items-center rounded-[4px] bg-ok text-white">
              <CheckIcon size={11} weight="bold" />
            </span>
            We will email you about incidents.
          </motion.p>
        ) : (
          <motion.input
            key="input"
            exit={{ opacity: 0 }}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            aria-label="Email for status updates"
            className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:shadow-none"
          />
        )}
      </AnimatePresence>
      {!done && (
        <button type="submit" className="flex items-center gap-2 bg-inverse px-4 text-[13.5px] font-medium text-inverse-fg transition-colors hover:bg-inverse-hover">
          <BellSimpleIcon size={16} weight="duotone" />
          Get updates
        </button>
      )}
    </form>
  );
}

export function IncidentIcon({ kind }: { kind: "incident" | "maintenance" }) {
  return kind === "incident" ? <WarningCircleIcon size={22} weight="duotone" className="text-warn" /> : <CheckCircleIcon size={22} weight="duotone" className="text-ink-3" />;
}
