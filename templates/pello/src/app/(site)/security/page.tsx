import type { Metadata } from "next";
import { Security } from "@/components/home/security";
import { PageHead } from "@/components/site/page";
import { Container, SectionHead } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Security",
  description: "How pello keeps salaries, health and reviews private: access by role, encryption, data kept in the EU or the US, and a log of every look.",
};

const PRACTICES = [
  { title: "Access by role", body: "What someone can see depends on who they are to the person: themselves, their manager, People or Payroll. pello's answers follow the same rules." },
  { title: "Encrypted, everywhere", body: "Data is encrypted in transit with TLS 1.3 and at rest with AES 256. Bank details and national ID numbers are encrypted again, with their own keys." },
  { title: "Kept where you choose", body: "Your data stays in the EU (Frankfurt) or the US (Virginia), and never moves between them." },
  { title: "Never used to train for others", body: "Your handbook and your people's data are used to answer your questions only. They're never used to train models for anyone else." },
  { title: "Every look is logged", body: "Each time a record is opened, by a person or by pello, it's written to a log you can read and export." },
  { title: "Checked by others", body: "SOC 2 Type II and ISO 27001, audited every year. An outside team tests pello for weaknesses twice a year." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHead title="Private stays private." lead="HR data is the most personal data a company keeps. Here's how pello looks after it, and how you can check that it does." />
      <Security />
      <section className="py-28 lg:py-36">
        <Container>
          <SectionHead title="How it's kept safe." />
          <ul className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map((p) => (
              <li key={p.title}>
                <p className="font-display text-[38px] font-extrabold leading-[0.95] text-ink">{p.title}</p>
                <p className="mt-3 text-[18px] leading-[1.55] text-ink-2">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section className="py-24">
        <Container>
          <div className="flex flex-col gap-6 rounded-[4px] bg-ink p-8 text-page sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-display text-[44px] font-extrabold leading-none">Found a problem?</p>
              <p className="mt-3 max-w-[560px] text-[18px] leading-[1.55] text-night-mute">Write to security@pello.example. A person on our security team replies within a day, and we credit everyone who reports something real.</p>
            </div>
            <a href="mailto:security@pello.example" className="inline-flex h-14 shrink-0 items-center justify-center rounded-[4px] bg-page px-6 text-[18px] font-semibold text-ink transition-colors hover:bg-accent hover:text-accent-ink">
              Report a problem
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
