"use client";

import { ArrowUpRightIcon, CaretDownIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/site/select";
import { cn } from "@/lib/cn";

/* Open roles, filtered by team and office. Open one to read what the job is. */

const ROLES = [
  { id: "backend", title: "Senior Backend Engineer", team: "Engineering", office: "Berlin", about: "Build the rules engine that decides what pello can approve and what goes to a person. Go and Postgres, with a lot of care for edge cases." },
  { id: "payroll-eng", title: "Staff Engineer, Payroll", team: "Engineering", office: "Remote in Europe", about: "Own how pay is calculated in four countries, and help us add the fifth. You'll work with our payroll specialists every day." },
  { id: "designer", title: "Product Designer", team: "Design", office: "New York", about: "Design the parts of pello People teams use all day: approvals, payroll runs and the morning notes." },
  { id: "payroll-de", title: "Payroll Specialist, Germany", team: "Payroll", office: "Berlin", about: "Check our German payroll each month, answer customers' hardest questions, and teach pello what you know." },
  { id: "ae", title: "Account Executive", team: "Sales", office: "New York", about: "Help companies of 200 to 2,000 people see what their week could look like. You'll run demos on their own handbooks." },
  { id: "support", title: "Customer Specialist", team: "Customers", office: "Berlin", about: "Set new customers up, import their data with them, and sit beside them for their first payroll." },
];

const ALL = "all";

export function Roles() {
  const [team, setTeam] = useState(ALL);
  const [office, setOffice] = useState(ALL);
  const [open, setOpen] = useState<string | null>(null);
  const shown = ROLES.filter((r) => (team === ALL || r.team === team) && (office === ALL || r.office === office));
  const opts = (key: "team" | "office", label: string) => [{ value: ALL, label }, ...[...new Set(ROLES.map((r) => r[key]))].map((v) => ({ value: v, label: v }))];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select label="Team" value={team} onChange={setTeam} options={opts("team", "All teams")} className="sm:w-[240px]" />
        <Select label="Office" value={office} onChange={setOffice} options={opts("office", "All offices")} className="sm:w-[240px]" />
        <p className="tabular flex items-center text-[16px] text-mute sm:ml-auto">
          {shown.length} open {shown.length === 1 ? "role" : "roles"}
        </p>
      </div>
      <ul className="mt-8 grid gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((r) => (
            <motion.li key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 34 }} className="overflow-hidden rounded-[22px] border border-line bg-surface">
              <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} className="flex w-full flex-col gap-2 px-6 py-5 text-left sm:flex-row sm:items-center sm:gap-6">
                <span className="flex-1 text-[21px] font-semibold tracking-[-0.02em] text-ink">{r.title}</span>
                <span className="text-[16px] text-ink-2">{r.team}</span>
                <span className="text-[16px] text-mute sm:w-[180px]">{r.office}</span>
                <motion.span animate={{ rotate: open === r.id ? 180 : 0 }} className="hidden text-mute sm:block">
                  <CaretDownIcon size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === r.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="overflow-hidden">
                    <div className="flex flex-col items-start gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
                      <p className="max-w-[640px] text-[17px] leading-[1.6] text-ink-2">{r.about}</p>
                      <Link href="/contact" className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] bg-ink px-5 text-[16px] font-medium text-page transition-colors hover:bg-ink-2")}>
                        Apply
                        <ArrowUpRightIcon size={17} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
        </AnimatePresence>
        {shown.length === 0 && <li className="rounded-[22px] bg-surface px-6 py-10 text-center text-[17px] text-ink-2">Nothing open there right now. Write to us anyway at jobs@pello.example.</li>}
      </ul>
    </div>
  );
}
