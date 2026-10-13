import { CheckIcon } from "@phosphor-icons/react/ssr";
import { Fragment } from "react";
import { Band, SectionHead } from "@/components/site/ui";

/* Every plan, line by line. A tick is included; an empty cell is not. */

type Cell = boolean | string;
const ROWS: Array<{ group: string; rows: Array<[string, Cell, Cell, Cell]> }> = [
  {
    group: "Answers",
    rows: [
      ["Ask pello in Slack, Teams and email", true, true, true],
      ["Answers linked to your own handbook", true, true, true],
      ["Questions it can't answer sent to a person", true, true, true],
    ],
  },
  {
    group: "Requests",
    rows: [
      ["Time off with your own rules", true, true, true],
      ["Expenses within budgets", true, true, true],
      ["Documents and e-signing", true, true, true],
      ["Onboarding and offboarding", false, true, true],
    ],
  },
  {
    group: "Pay",
    rows: [
      ["Payroll in the US, UK, Germany and Canada", false, true, true],
      ["Changes explained before you approve", false, true, true],
      ["Your payroll provider everywhere else", false, true, true],
    ],
  },
  {
    group: "Company",
    rows: [
      ["Insights and a note every morning", false, true, true],
      ["Admins", "2", "As many as you need", "As many as you need"],
      ["Single sign-on and SCIM", false, false, true],
      ["Custom roles and approvals", false, false, true],
      ["Data kept in the EU or the US", false, false, true],
      ["Help", "Email", "Email and chat", "A named person"],
    ],
  },
];

function Value({ v }: { v: Cell }) {
  if (typeof v === "string") return <span className="text-[15px] text-ink">{v}</span>;
  return v ? (
    <span className="inline-grid size-6 place-items-center rounded-full bg-ink text-surface">
      <CheckIcon size={12} weight="bold" />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="sr-only">Not included</span>
  );
}

export function Compare() {
  return (
    <Band rule inner="py-24 lg:py-32">
      <SectionHead title="Every plan, side by side" />
      <div className="pl-card mt-12 overflow-x-auto rounded-[16px]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-[40%] p-5">
                <span className="sr-only">Feature</span>
              </th>
              {["Starter", "Growth", "Enterprise"].map((p) => (
                <th key={p} className="p-5 font-display text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((g) => (
              <Fragment key={g.group}>
                <tr>
                  <th colSpan={4} className="bg-sunken px-5 py-2.5 text-[15px] font-semibold text-ink">
                    {g.group}
                  </th>
                </tr>
                {g.rows.map(([label, ...cells]) => (
                  <tr key={label} className="shadow-[0_1px_0_var(--pl-line)]">
                    <th scope="row" className="px-5 py-3.5 text-[15px] font-normal text-ink-2">
                      {label}
                    </th>
                    {cells.map((c, i) => (
                      <td key={i} className="px-5 py-3.5">
                        <Value v={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Band>
  );
}
