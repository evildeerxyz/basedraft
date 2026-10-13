"use client";

import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Face, Moment, Segmented, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { personOf } from "@/lib/people";
import { AFTER, BEFORE, DAYS, FROM, TO, hours, type Kind } from "@/lib/week";

/*
 * 16:40. Hannah, who runs People at Fieldwork, leaves early. Her calendar, before pello and with
 * it: switch between them and the blocks move, and the hours of paperwork and of people count to
 * their new totals.
 */

const HANNAH = personOf("hannah");
const BLOCK: Record<Kind, string> = {
  admin: "bg-sunken text-mute",
  people: "bg-ink text-page",
  fixed: "bg-page text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)]",
  pello: "bg-page text-accent shadow-[inset_0_0_0_1.5px_var(--pl-accent)]",
};
const HOUR = 34;

function Hours({ value }: { value: number }) {
  const v = useMotionValue(value);
  const text = useTransform(v, (n) => `${Math.round(n)}`);
  useEffect(() => {
    const a = animate(v, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [value, v]);
  return <motion.span className="tabular">{text}</motion.span>;
}

export function Week() {
  const [when, setWhen] = useState<"before" | "after">("after");
  const blocks = when === "after" ? AFTER : BEFORE;
  return (
    <Moment id="week" time={momentOf("week").at} where="Berlin" title="Hannah's leaving early. Her week is done." lead="Before pello, her Fridays went on the payroll sheet and the weekly report. Switch between her week before pello and with it.">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <div>
          <Segmented
            label="Hannah's week"
            value={when}
            onChange={setWhen}
            options={[
              { value: "before", label: "Before pello" },
              { value: "after", label: "With pello" },
            ]}
          />
          <dl className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-1">
            <div>
              <dt className="text-[15px] text-mute">On paperwork</dt>
              <dd className="tabular mt-1 font-mono text-[56px] font-medium leading-none tracking-[-0.06em] text-ink">
                <Hours value={hours(blocks, ["admin", "pello"])} />
                <span className="text-[24px] text-mute">h</span>
              </dd>
            </div>
            <div>
              <dt className="text-[15px] text-mute">With people</dt>
              <dd className="tabular mt-1 font-mono text-[56px] font-medium leading-none tracking-[-0.06em] text-ink">
                <Hours value={hours(blocks, ["people"])} />
                <span className="text-[24px] text-mute">h</span>
              </dd>
            </div>
          </dl>
          <ul className="mt-8 grid gap-2 text-[15px] text-ink-2">
            <li className="flex items-center gap-2.5">
              <span className="size-3.5 rounded-[3px] bg-sunken" /> Paperwork
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-3.5 rounded-[3px] bg-ink" /> Time with people
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-3.5 rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--pl-accent)]" /> What pello hands her
            </li>
          </ul>
        </div>

        <Window title={`${HANNAH.name}, week of October 26`} icon={<Face person={HANNAH} size={26} />} aside={<span className="text-[15px] text-mute">{HANNAH.role}</span>} className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[36px_repeat(5,minmax(0,1fr))] gap-1 p-3">
            <span />
            {DAYS.map((d, i) => (
              <p key={d} className={cn("pb-2 text-center text-[15px] font-medium", i === 4 ? "text-ink" : "text-mute")}>
                {d} <span className="tabular font-mono">{26 + i}</span>
              </p>
            ))}
            <div className="relative" style={{ height: (TO - FROM) * HOUR }}>
              {Array.from({ length: TO - FROM }, (_, h) => (
                <span key={h} className="tabular absolute right-1 font-mono text-[15px] leading-none text-mute" style={{ top: h * HOUR }}>
                  {FROM + h}
                </span>
              ))}
            </div>
            {DAYS.map((d, day) => (
              <div key={d} className="relative rounded-[6px] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_33px,var(--pl-line)_33px,var(--pl-line)_34px)]" style={{ height: (TO - FROM) * HOUR }}>
                <LayoutGroup id={`week-${day}`}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {blocks
                      .filter((x) => x.day === day)
                      .map((x, i) => (
                        <motion.div
                          key={x.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1, transition: { delay: 0.08 + i * 0.04, type: "spring", stiffness: 380, damping: 30 } }}
                          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 32 }}
                          title={x.text}
                          className={cn("absolute inset-x-0.5 overflow-hidden rounded-[5px] px-2 text-[15px] font-medium leading-[30px]", BLOCK[x.kind])}
                          style={{ top: (x.start - FROM) * HOUR + 1, height: x.len * HOUR - 2 }}
                        >
                          {x.len >= 1 && <span className="block truncate">{x.text}</span>}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </LayoutGroup>
              </div>
            ))}
          </div>
        </Window>
      </div>
    </Moment>
  );
}
