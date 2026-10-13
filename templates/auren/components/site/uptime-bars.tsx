"use client";

import { useState } from "react";
import type { DayState } from "@/lib/content/status";
import { cn } from "@/lib/site";

const LABEL: Record<DayState, string> = { ok: "No issues", degraded: "Degraded performance", outage: "Partial outage" };

// Oct 10, 2026 is "today"; bars run oldest to newest.
const TODAY = Date.UTC(2026, 9, 10);
const dayLabel = (i: number) =>
  new Date(TODAY - (89 - i) * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function UptimeBars({ days, name }: { days: DayState[]; name: string }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div role="img" aria-label={`${name}: 90 day history`} className="flex h-10 items-stretch gap-px sm:gap-[2px]">
        {days.map((d, i) => (
          <span
            key={i}
            onMouseEnter={() => setHover(i)}
            className={cn(
              "flex-1 rounded-[1px] transition-opacity",
              d === "ok" && "bg-ink/80",
              d === "degraded" && "bg-accent",
              d === "outage" && "bg-del",
              hover !== null && hover !== i && "opacity-40",
            )}
          />
        ))}
      </div>
      {hover !== null && (
        <div
          className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-3 py-2 font-mono text-[11.5px] text-paper"
          style={{ left: `${((hover + 0.5) / days.length) * 100}%` }}
        >
          {dayLabel(hover)} · {LABEL[days[hover]]}
        </div>
      )}
      <div className="mt-2 flex justify-between font-mono text-[11px] text-ink/40">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
