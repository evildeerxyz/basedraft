"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { COMPARISON, PLANS } from "@/lib/content/pricing";
import { cn } from "@/lib/site";

function Cell({ value, featured }: { value: boolean | string; featured: boolean }) {
  if (value === true) return <CheckIcon size={16} weight="bold" aria-label="Included" className={featured ? "text-accent" : "text-ink"} />;
  if (value === false)
    return (
      <span aria-label="Not included" className={cn("inline-block size-1 rounded-full", featured ? "bg-paper/25" : "bg-ink/25")} />
    );
  return <span className="font-mono text-[12.5px]">{value}</span>;
}

/** Side-by-side table on wide screens; a plan switcher on phones. */
export function Comparison() {
  const [plan, setPlan] = useState(1);

  return (
    <>
      <div className="mt-12 hidden md:block">
        <table className="w-full border-collapse text-left text-[14.5px]">
          <thead>
            <tr>
              <th className="w-[38%] py-4" />
              {PLANS.map((p) => (
                <th key={p.name} scope="col" className={cn("px-5 py-4 align-bottom font-normal", p.featured && "bg-ink text-paper")}>
                  <span className="type-title block text-[20px]">{p.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          {COMPARISON.map((group) => (
            <tbody key={group.group}>
              <tr>
                <th scope="colgroup" className="type-label pb-3 pt-10 text-left font-normal text-ink/45">
                  {group.group}
                </th>
                {PLANS.map((p) => (
                  <td key={p.name} className={cn(p.featured && "bg-ink")} />
                ))}
              </tr>
              {group.rows.map(([label, ...values]) => (
                <tr key={label} className="border-t border-ink/10">
                  <th scope="row" className="py-3.5 pr-4 text-left font-normal text-ink/80">
                    {label}
                  </th>
                  {values.map((v, i) => (
                    <td key={i} className={cn("px-5 py-3.5", PLANS[i].featured && "border-t border-paper/10 bg-ink text-paper")}>
                      <Cell value={v} featured={!!PLANS[i].featured} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <div className="mt-10 md:hidden">
        <div role="tablist" aria-label="Plan" className="relative grid grid-cols-3 rounded-[7px] bg-ink/[0.06] p-1">
          {PLANS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              role="tab"
              aria-selected={plan === i}
              onClick={() => setPlan(i)}
              className={cn("relative z-10 h-9 text-[14px] transition-colors", plan === i ? "text-paper" : "text-ink/60")}
            >
              {plan === i && (
                <motion.span
                  layoutId="compare-plan"
                  className="absolute inset-0 -z-10 rounded-[5px] bg-ink"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              {p.name}
            </button>
          ))}
        </div>
        {COMPARISON.map((group) => (
          <div key={group.group} className="mt-8">
            <div className="type-label text-ink/45">{group.group}</div>
            <dl className="mt-3 border-t border-ink/10">
              {group.rows.map(([label, ...values]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-ink/10 py-3.5">
                  <dt className="text-[14.5px] text-ink/80">{label}</dt>
                  <dd className="shrink-0">
                    <Cell value={values[plan]} featured={false} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
