import type { Metadata } from "next";
import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { Insights } from "@/components/home/insights";
import { Onboarding } from "@/components/home/onboarding";
import { Payroll } from "@/components/home/payroll";
import { TimeOff } from "@/components/home/time-off";
import { Integrations } from "@/components/product/integrations";
import { PageHead } from "@/components/site/page";
import { ButtonLink } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Product",
  description: "Answers from your handbook, time off within your rules, onboarding, payroll in four countries and a note on how the company is doing, every morning.",
};

const JUMPS = [
  { label: "Ask pello", href: "#ask" },
  { label: "Time off", href: "#time-off" },
  { label: "Onboarding", href: "#onboarding" },
  { label: "Payroll", href: "#payroll" },
  { label: "Insights", href: "#insights" },
  { label: "Integrations", href: "#integrations" },
];

export default function ProductPage() {
  return (
    <>
      <PageHead title="The paperwork, done. The decisions, still yours." lead="pello does the parts of HR that follow a rule, and hands the rest to the person who should decide. Here's each part, working.">
        <div className="mt-10 flex flex-wrap gap-2">
          {JUMPS.map((j) => (
            <ButtonLink key={j.href} href={j.href} kind="quiet">
              {j.label}
            </ButtonLink>
          ))}
        </div>
      </PageHead>
      <Ask />
      <TimeOff />
      <Onboarding />
      <Payroll />
      <Insights />
      <Integrations />
      <Cta />
    </>
  );
}
