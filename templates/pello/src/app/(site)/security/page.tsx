import type { Metadata } from "next";
import { FileAs } from "@/components/home/features";
import { PageHead } from "@/components/site/page";
import { Band, SectionHead } from "@/components/site/ui";

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
      <PageHead title="Private stays private" lead="HR data is the most personal data a company keeps. Here's how pello looks after it, and how you can check that it does." />
      <Band inner="pb-24">
        <div className="pl-card mx-auto grid max-w-[980px] items-center gap-10 rounded-[16px] p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">One file, seen by four people</h2>
            <p className="mt-3 text-[16px] leading-[1.6] text-mute">Pick who&apos;s looking at Grace&apos;s file. What they can&apos;t see is blacked out, and pello won&apos;t tell them either.</p>
          </div>
          <FileAs />
        </div>
      </Band>
      <Band rule inner="py-24 lg:py-32">
        <SectionHead title="How it's kept safe" />
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICES.map((p) => (
            <li key={p.title} className="pl-card rounded-[16px] p-6">
              <p className="font-display text-[20px] font-semibold tracking-[-0.01em] text-ink">{p.title}</p>
              <p className="mt-2 text-[15px] leading-[1.6] text-mute">{p.body}</p>
            </li>
          ))}
        </ul>
        <div className="pl-card mt-3 flex flex-col gap-5 rounded-[16px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">Found a problem?</p>
            <p className="mt-1 max-w-[560px] text-[15px] leading-[1.55] text-mute">Write to security@pello.example. A person on our security team replies within a day, and we credit everyone who reports something real.</p>
          </div>
          <a href="mailto:security@pello.example" className="pl-btn-dark inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] px-4 text-[15px] font-medium">
            Report a problem
          </a>
        </div>
      </Band>
    </>
  );
}
