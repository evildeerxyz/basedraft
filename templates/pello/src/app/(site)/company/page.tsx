import type { Metadata } from "next";
import { PageHead } from "@/components/site/page";
import { ButtonLink, Container, SectionHead } from "@/components/site/ui";
import { OFFICES, TEAM } from "@/lib/team";

export const metadata: Metadata = {
  title: "Company",
  description: "We started pello because People teams spend their week on paperwork. 68 of us, in Berlin and New York.",
};

const NUMBERS = [
  { value: "2022", label: "Started, in Berlin" },
  { value: "68", label: "People on the team" },
  { value: "1,200", label: "Companies on pello" },
  { value: "190,000", label: "People whose HR it runs" },
];

const BELIEFS = [
  { title: "Ask a person when it matters.", body: "pello decides what a rule can decide. Everything else goes to someone, with what they need to decide it quickly." },
  { title: "Show where it came from.", body: "Every answer links to the passage it used. If people can check it, they can trust it, and so can you." },
  { title: "Be boring about money.", body: "Payroll is checked twice and explained line by line. Nobody gets paid until a person says so." },
];

export default function CompanyPage() {
  return (
    <>
      <PageHead title="People teams should spend their week on people." lead="Anna ran People at a 900 person company and spent most of her week on forms, inboxes and spreadsheets. Daniel had built payroll systems for ten years. In 2022 they started pello to take that week back." />

      <section className="pb-24">
        <Container>
          <dl className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {NUMBERS.map((n) => (
              <div key={n.label} className="flex flex-col-reverse bg-surface p-8">
                <dt className="mt-3 text-[17px] text-mute">{n.label}</dt>
                <dd className="tabular text-[clamp(2.6rem,4vw,3.6rem)] font-semibold leading-none tracking-[-0.05em] text-ink">{n.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="bg-surface py-28 lg:py-36">
        <Container>
          <SectionHead title="Three things we hold to." />
          <ol className="mt-16 grid gap-12 lg:grid-cols-3">
            {BELIEFS.map((b, i) => (
              <li key={b.title}>
                <span className="tabular font-mono text-[16px] text-accent">0{i + 1}</span>
                <p className="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">{b.title}</p>
                <p className="mt-4 text-[18px] leading-[1.6] text-ink-2">{b.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-28 lg:py-36">
        <Container>
          <SectionHead title="Who you'll talk to." lead="Most of us have done the work pello does, by hand, for years." />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((p) => (
              <li key={p.name} className="rounded-[24px] border border-line bg-surface p-6">
                <span aria-hidden className="grid size-14 place-items-center rounded-full bg-sunken text-[18px] font-semibold text-ink-2" style={{ boxShadow: `inset 0 0 0 2px ${p.hue}` }}>
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
                <p className="mt-6 text-[19px] font-semibold tracking-[-0.02em] text-ink">{p.name}</p>
                <p className="mt-1 text-[16px] text-ink-2">{p.role}</p>
                <p className="mt-4 text-[16px] leading-[1.5] text-mute">{p.before}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="pb-28 lg:pb-36">
        <Container className="grid gap-4 lg:grid-cols-2">
          {OFFICES.map((o) => (
            <div key={o.city} className="rounded-[28px] bg-night p-8 text-night-ink sm:p-10">
              <p className="text-[clamp(2.4rem,4vw,3.4rem)] font-semibold leading-none tracking-[-0.05em]">{o.city}</p>
              <p className="mt-4 text-[17px] text-night-mute">{o.address}</p>
              <p className="mt-10 text-[17px]">{o.people} of us work here.</p>
            </div>
          ))}
          <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:p-10 lg:col-span-2">
            <p className="text-[24px] font-semibold tracking-[-0.025em] text-ink">We&apos;re hiring in both offices.</p>
            <ButtonLink href="/careers" kind="ink" size="lg">
              See open roles
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
