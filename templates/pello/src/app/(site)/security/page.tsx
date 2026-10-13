import type { Metadata } from "next";
import { FileAs } from "@/components/home/privacy";
import { PageHead } from "@/components/site/page";
import { Band, ButtonLink, SectionHead } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Security",
  description: "How pello keeps salaries, health and reviews private: access by role, encryption, data kept in the EU or the US, and a log of every look.",
};

const PRACTICES = [
  { title: "Access by role", body: "What someone can see depends on who they are to the person: themselves, their manager, People or Payroll. pello's answers follow the same rules." },
  { title: "Encrypted, everywhere", body: "Data is encrypted in transit with TLS 1.3 and at rest with AES 256. Bank details and national ID numbers are encrypted again, with their own keys." },
  { title: "Kept where you choose", body: "Your data stays in the EU (Frankfurt) or the US (Virginia), and never moves between them." },
  { title: "Never used to train for others", body: "Your handbook and your people's data are used to answer your questions only, never to train models for anyone else." },
  { title: "Every look is logged", body: "Each time a record is opened, by a person or by pello, it's written to a log you can read and export." },
  { title: "Checked by others", body: "SOC 2 Type II and ISO 27001, audited every year. An outside team tests pello for weaknesses twice a year." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHead title="Private stays private." lead="HR data is the most personal data a company keeps. Here's how pello looks after it, and how you can check that it does." />
      <Band inner="pb-24">
        <h2 className="text-[26px] font-semibold tracking-[-0.04em] text-ink">One file, seen by four people</h2>
        <p className="mt-2 max-w-[560px] text-[17px] leading-[1.55] text-mute">Pick who&apos;s asking about Grace. What they can&apos;t see is blacked out, and pello won&apos;t tell them either.</p>
        <FileAs className="mt-10" />
      </Band>
      <Band tint inner="py-24 lg:py-32">
        <SectionHead title="How it's kept safe" />
        <dl className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICES.map((p) => (
            <div key={p.title} className="border-t border-ink pt-4">
              <dt className="text-[19px] font-semibold tracking-[-0.025em] text-ink">{p.title}</dt>
              <dd className="mt-2 text-[16px] leading-[1.6] text-mute">{p.body}</dd>
            </div>
          ))}
        </dl>
      </Band>
      <Band inner="py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[26px] font-semibold tracking-[-0.04em] text-ink">Found a problem?</p>
            <p className="mt-2 max-w-[560px] text-[17px] leading-[1.55] text-mute">Write to security@pello.example. A person on our security team replies within a day, and we credit everyone who reports something real.</p>
          </div>
          <ButtonLink href="mailto:security@pello.example">Report a problem</ButtonLink>
        </div>
      </Band>
    </>
  );
}
