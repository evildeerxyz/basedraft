import type { Metadata } from "next";
import { Ask } from "@/components/home/ask";
import { Cta } from "@/components/home/cta";
import { Features } from "@/components/home/features";
import { How } from "@/components/home/how";
import { Integrations } from "@/components/home/integrations";
import { More } from "@/components/home/more";
import { Payroll } from "@/components/home/payroll";
import { TimeOff } from "@/components/home/time-off";
import { PageHead } from "@/components/site/page";
import { ButtonLink } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Product",
  description: "Answers from your handbook, time off within your rules, payroll in four countries, onboarding and a note on how the company is doing, every morning.",
};

const JUMPS = [
  { label: "Ask pello", href: "#ask" },
  { label: "Time off", href: "#time-off" },
  { label: "Payroll", href: "#payroll" },
  { label: "Onboarding and more", href: "#features" },
  { label: "Integrations", href: "#integrations" },
];

export default function ProductPage() {
  return (
    <>
      <PageHead title="The paperwork, done. The decisions, still yours." lead="pello does the parts of HR that follow a rule, and hands the rest to the person who should decide. Here's each part, working.">
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {JUMPS.map((j) => (
            <ButtonLink key={j.href} href={j.href} kind="light" chevron={false}>
              {j.label}
            </ButtonLink>
          ))}
        </div>
      </PageHead>
      <Ask />
      <TimeOff />
      <Payroll />
      <Features />
      <How />
      <More />
      <Integrations />
      <Cta />
    </>
  );
}
