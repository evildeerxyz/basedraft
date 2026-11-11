"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/*
 * How much of an allowance is used: a plan's minutes, a quota, seats. The share in large figures,
 * a bar that fills in ink, turns amber near the end and red past it, and, ahead of the fill,
 * hatched, where it'll be by the end of the period at this pace. Folded small for a sidebar's
 * rail, it's a ring with the share in it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const n = new Intl.NumberFormat("en-US");

export type AllowanceProps = {
  label: string;
  used: number;
  limit: number;
  /** After the figures: min, GB, seats. */
  unit?: string;
  /** Where it'll be by the period's end at this pace: drawn hatched ahead of the fill. */
  projected?: number;
  /** A line under the bar: when it renews, what happens at the limit. */
  note?: ReactNode;
  /** A button or link at its foot: add more, upgrade. */
  action?: ReactNode;
  icon?: ReactNode;
  /** A ring with the share in it, for a sidebar folded to a rail. */
  compact?: boolean;
  /** From this share up, it turns amber. */
  warnAt?: number;
  className?: string;
};

export function Allowance({ label, used, limit, unit, projected, note, action, icon, compact = false, warnAt = 0.8, className }: AllowanceProps) {
  const still = useReducedMotion();
  const share = limit > 0 ? used / limit : 0;
  const ahead = projected !== undefined && limit > 0 ? Math.min(projected / limit, 1) : 0;
  const over = share >= 1;
  const warn = !over && (share >= warnAt || (projected ?? 0) > limit);
  const color = over ? "var(--bd-ui-stop)" : warn ? "var(--bd-ui-wait)" : "var(--bd-fg)";
  const pct = Math.round(share * 100);
  const said = `${label}: ${n.format(used)} of ${n.format(limit)}${unit ? ` ${unit}` : ""}, ${pct}%${projected !== undefined ? `, heading for ${n.format(projected)}` : ""}`;

  if (compact) {
    const C = 2 * Math.PI * 15;
    return (
      <span role="meter" aria-label={said} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} title={said} className={cx("relative grid size-10 shrink-0 place-items-center", className)}>
        <svg viewBox="0 0 36 36" className="size-[34px] -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bd-ui-track)" strokeWidth="3" />
          <motion.circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.min(share, 1)) }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }} />
        </svg>
        <span className="absolute font-mono text-[9.5px] font-medium tabular-nums text-[var(--bd-fg)]">{pct}</span>
      </span>
    );
  }

  return (
    <div role="group" aria-label={label} className={cx("rounded-[14px] bg-[var(--bd-surface)] p-3 text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line-subtle),0_1px_2px_rgb(var(--bd-shade)/0.05)]", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-[var(--bd-ui-track)] text-[var(--bd-fg)] [&_svg]:size-3.5">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{label}</span>
        <span className="font-mono text-[12px] font-medium tabular-nums" style={{ color: over || warn ? color : undefined }}>
          {pct}%
        </span>
      </div>
      <div role="meter" aria-label={said} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
        {ahead > share && <span aria-hidden className="absolute inset-y-0 left-0 rounded-full opacity-45 [background:repeating-linear-gradient(135deg,currentColor_0_1.5px,transparent_1.5px_4px)]" style={{ width: `${ahead * 100}%`, color }} />}
        <motion.span aria-hidden className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(share, 1) * 100}%` }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }} />
      </div>
      {/* The figures and the note share a line while there's room, and the note drops under them when there isn't. */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--bd-muted)]">
        <span className="font-mono tabular-nums">
          {n.format(used)} / {n.format(limit)}
          {unit && ` ${unit}`}
        </span>
        {note && <span className="whitespace-nowrap">{note}</span>}
      </div>
      {action && <div className="mt-2.5 flex">{action}</div>}
    </div>
  );
}
