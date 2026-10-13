"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { ROLES, TEAMS } from "@/lib/content/company";
import { cn } from "@/lib/site";

export function Roles() {
  const [team, setTeam] = useState<(typeof TEAMS)[number]>("All");
  const [open, setOpen] = useState<string | null>(null);
  const roles = team === "All" ? ROLES : ROLES.filter((r) => r.team === team);

  return (
    <div>
      <div role="tablist" aria-label="Filter by team" className="flex flex-wrap gap-2">
        {TEAMS.map((t) => {
          const count = t === "All" ? ROLES.length : ROLES.filter((r) => r.team === t).length;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={team === t}
              onClick={() => setTeam(t)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-4 text-[13.5px] transition-colors",
                team === t ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/65 hover:border-ink/40",
              )}
            >
              {t}
              <span className={cn("font-mono text-[11px]", team === t ? "text-paper/50" : "text-ink/35")}>{count}</span>
            </button>
          );
        })}
      </div>

      <motion.ul layout className="mt-10 border-t border-ink/12">
        <AnimatePresence initial={false} mode="popLayout">
          {roles.map((r) => {
            const isOpen = open === r.id;
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="border-b border-ink/12"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-6 text-left md:grid-cols-[minmax(0,1fr)_10rem_14rem_auto]"
                >
                  <span className="type-title text-[clamp(1.25rem,2vw,1.6rem)]">{r.title}</span>
                  <span className="hidden font-mono text-[12px] text-ink/50 md:block">{r.team}</span>
                  <span className="hidden font-mono text-[12px] text-ink/50 md:block">{r.location}</span>
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full border transition-colors",
                      isOpen ? "border-ink bg-ink text-paper" : "border-ink/15 group-hover:border-ink/40",
                    )}
                  >
                    <PlusIcon size={14} weight="bold" className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <div>
                          <p className="max-w-[56ch] text-[16px] leading-[1.6] text-ink/70">{r.summary}</p>
                          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-ink/55">
                            {r.points.map((p) => (
                              <li key={p} className="flex items-center gap-2">
                                <span className="size-1 bg-accent" />
                                {p}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 font-mono text-[12px] text-ink/45 md:hidden">
                            {r.team} · {r.location}
                          </p>
                        </div>
                        <a
                          href={`mailto:careers@auren.dev?subject=${encodeURIComponent(r.title)}`}
                          className="inline-flex h-11 items-center gap-2 self-start rounded-[6px] bg-ink px-4 text-[14px] font-medium text-paper transition-colors hover:bg-ink-3"
                        >
                          Apply
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
