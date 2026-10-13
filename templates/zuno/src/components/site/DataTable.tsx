import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Plain, readable table. First column is the row label; the rest are values. */
export function DataTable({
  columns,
  rows,
  caption,
  highlight,
  align = "right",
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlight?: number;
  /** Value columns are right-aligned for numbers; use "left" for prose. */
  align?: "left" | "right";
}) {
  return (
    <div className="no-scrollbar overflow-x-auto rounded-[16px] border border-white/[0.08]">
      <table className="w-full min-w-[560px] border-collapse text-left text-[16px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-white/[0.03]">
            {columns.map((c, i) => (
              <th key={c} scope="col" className={cn("px-5 py-4 font-medium text-white/60", i > 0 && align === "right" && "text-right", highlight === i && "text-accent")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-white/[0.06]">
              {r.map((cell, ci) =>
                ci === 0 ? (
                  <th key={ci} scope="row" className="px-5 py-4 font-normal text-white/85">
                    {cell}
                  </th>
                ) : (
                  <td key={ci} className={cn("px-5 py-4 tabular-nums text-white/85", align === "right" && "text-right", highlight === ci && "bg-white/[0.025] text-white")}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
