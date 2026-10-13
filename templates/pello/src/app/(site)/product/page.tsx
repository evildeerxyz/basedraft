import type { Metadata } from "next";
import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { DayOne } from "@/components/home/day-one";
import { Insights } from "@/components/home/insights";
import { Overtime } from "@/components/home/overtime";
import { Payroll } from "@/components/home/payroll";
import { Privacy } from "@/components/home/privacy";
import { TimeOff } from "@/components/home/time-off";
import { WorksWith } from "@/components/home/works-with";
import { PageHead } from "@/components/site/page";
import { MOMENTS } from "@/lib/day";

export const metadata: Metadata = {
  title: "Product",
  description: "Answers from your handbook, time off within your rules, payroll in four countries, onboarding and a note on how the company is doing, every morning.",
};

const SHOWN = MOMENTS.filter((m) => m.id !== "week");

export default function ProductPage() {
  return (
    <>
      <PageHead title="The paperwork, done. The decisions, still yours." lead="pello does the parts of HR that follow a rule, and hands the rest to the person who should decide. Here's each part, working, on one Friday at Fieldwork.">
        <ol className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {SHOWN.map((m) => (
            <li key={m.id}>
              <a href={`#${m.id}`} className="group flex items-baseline gap-2 rounded-[4px] text-[16px] font-medium text-ink">
                <span className="tabular font-mono text-[15px] text-mute transition-colors group-hover:text-accent">{m.at}</span>
                <span className="underline decoration-line-strong underline-offset-[6px] transition-colors group-hover:decoration-ink">{m.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </PageHead>
      <TimeOff />
      <Ask />
      <Payroll />
      <DayOne />
      <Overtime />
      <Privacy />
      <Insights />
      <WorksWith />
      <Cta />
    </>
  );
}
