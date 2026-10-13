"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Mark } from "@/components/site/logo";
import { Face, Moment, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { personOf } from "@/lib/people";

/*
 * 15:55. Lucas asks pello what Grace earns, and doesn't find out. Pick who's asking: Grace's file
 * shows only what that person may see, with the rest blacked out, and pello's answer follows the
 * same rules. The security page uses the same file.
 */

type Viewer = "grace" | "lucas" | "marco" | "hannah";
const VIEWERS: Array<{ id: Viewer; as: string }> = [
  { id: "lucas", as: "Her teammate" },
  { id: "grace", as: "Grace herself" },
  { id: "marco", as: "Her manager" },
  { id: "hannah", as: "Head of People" },
];
const ALL: Viewer[] = ["grace", "lucas", "marco", "hannah"];
const FIELDS: Array<{ label: string; value: string; who: Viewer[]; partial?: { who: Viewer[]; value: string } }> = [
  { label: "Role", value: "Account Executive, Sales", who: ALL },
  { label: "Manager", value: "Marco Ricci", who: ALL },
  { label: "Salary", value: "£62,000 a year", who: ["grace", "hannah"], partial: { who: ["marco"], value: "Band S3" } },
  { label: "Bank account", value: "Ending 4417", who: ["grace"] },
  { label: "Sick days this year", value: "3 days", who: ["grace", "hannah"] },
  { label: "Manager's notes", value: "Ready for bigger accounts.", who: ["marco", "hannah"] },
];
const ANSWER: Record<Viewer, string> = {
  grace: "Your salary is £62,000 a year. Your next review is in March.",
  lucas: "That's private to Grace, her manager and People, so I can't share it.",
  marco: "Grace is in band S3. For the exact figure, ask Hannah in People.",
  hannah: "£62,000 a year, unchanged since her review in March.",
};
const GRACE = personOf("grace");

/** Grace's file, as whoever's picked would see it, and what pello tells them when they ask. */
export function FileAs({ className }: { className?: string }) {
  const [viewer, setViewer] = useState<Viewer>("lucas");
  const asker = personOf(viewer);
  return (
    <div className={cn("grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]", className)}>
      <div>
        <p className="text-[15px] font-medium text-ink">Who&apos;s asking</p>
        <div role="radiogroup" aria-label="Who's asking" className="mt-3 grid gap-1">
          {VIEWERS.map((v) => {
            const p = personOf(v.id);
            const on = viewer === v.id;
            return (
              <button key={v.id} type="button" role="radio" aria-checked={on} onClick={() => setViewer(v.id)} className={cn("flex items-center gap-3 rounded-[10px] p-2 text-left transition-colors", on ? "bg-surface shadow-[inset_0_0_0_1px_var(--pl-line-strong)]" : "hover:bg-surface")}>
                <Face person={p} size={40} hot={on} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{p.name}</span>
                  <span className="block truncate text-[15px] text-mute">{v.as}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-line pt-5">
          <div className="flex gap-3">
            <Face person={asker} size={32} square />
            <p className="pt-1 text-[16px] leading-[1.5] text-ink">{viewer === "grace" ? "What do I earn?" : "What does Grace earn?"}</p>
          </div>
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-sunken">
              <Mark size={20} />
            </span>
            <AnimatePresence mode="wait">
              <motion.p key={viewer} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={cn("pt-1 text-[16px] leading-[1.5]", viewer === "lucas" ? "text-accent" : "text-ink")}>
                {ANSWER[viewer]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Window title={`${GRACE.name}, personnel file`} icon={<Face person={GRACE} size={26} />} aside={<span className="text-[15px] font-medium text-accent">Confidential</span>}>
        <dl className="px-5 py-2">
          {FIELDS.map((f) => {
            const full = f.who.includes(viewer);
            const part = !full && f.partial?.who.includes(viewer);
            const text = full ? f.value : part ? f.partial!.value : "";
            return (
              <div key={f.label} className="flex min-h-[54px] items-center justify-between gap-4 border-b border-line last:border-b-0">
                <dt className="text-[15px] text-mute">{f.label}</dt>
                <dd className="flex min-w-0 justify-end text-right text-[15px] font-medium text-ink">
                  <AnimatePresence mode="wait" initial={false}>
                    {text ? (
                      <motion.span key={`v-${text}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="truncate">
                        {text}
                      </motion.span>
                    ) : (
                      <motion.span key="hidden" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ originX: 1, width: `${Math.min(200, 36 + f.value.length * 7)}px` }} className="block h-5 rounded-[3px] bg-ink">
                        <span className="sr-only">Hidden</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="border-t border-line bg-surface px-5 py-3.5 text-[15px] text-mute">
          {asker.name.split(" ")[0]} sees {FIELDS.filter((f) => f.who.includes(viewer) || f.partial?.who.includes(viewer)).length} of {FIELDS.length} fields. Every look is in the audit log.
        </p>
      </Window>
    </div>
  );
}

export function Privacy() {
  return (
    <Moment id="privacy" time={momentOf("privacy").at} where="Slack, a direct message" title="Lucas asked what Grace earns. pello didn't tell him." lead="Salaries, health and reviews open only to the people who need them, and pello's answers follow the same rules. Pick who's asking.">
      <FileAs />
    </Moment>
  );
}
