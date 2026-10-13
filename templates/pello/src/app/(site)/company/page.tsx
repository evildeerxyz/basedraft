import type { Metadata } from "next";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { ButtonLink, Container, SectionHead } from "@/components/site/ui";
import { SCENES, teamPhoto } from "@/lib/photos";
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
          <Dithered src={SCENES.office} alt="The pello office in Berlin, people at their desks" cell={3} focus={[0.5, 0.5]} className="aspect-[21/9] rounded-[4px]" />
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NUMBERS.map((n) => (
              <div key={n.label} className="flex flex-col-reverse rounded-[4px] bg-surface p-7">
                <dt className="mt-2 text-[17px] text-mute">{n.label}</dt>
                <dd className="tabular font-display text-[clamp(3.4rem,5vw,4.6rem)] font-extrabold leading-none text-ink">{n.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="bg-ink py-28 text-page lg:py-36">
        <Container>
          <SectionHead dark title="Three things we hold to." />
          <ol className="mt-16 grid gap-12 lg:grid-cols-3">
            {BELIEFS.map((b, i) => (
              <li key={b.title}>
                <span className="tabular font-mono text-[16px] text-accent">0{i + 1}</span>
                <p className="mt-4 font-display text-[44px] font-extrabold leading-[0.92]">{b.title}</p>
                <p className="mt-5 text-[19px] leading-[1.55] text-night-mute">{b.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-28 lg:py-36">
        <Container>
          <SectionHead title="Who you'll talk to." lead="Most of us have done the work pello does, by hand, for years." />
          <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {TEAM.map((p) => (
              <li key={p.name}>
                <Dithered src={teamPhoto(p.name)} alt={p.name} cell={2} focus={[0.5, 0.3]} className="aspect-[4/5] rounded-[4px]" />
                <p className="mt-4 font-display text-[28px] font-extrabold leading-none text-ink">{p.name}</p>
                <p className="mt-1.5 text-[17px] font-semibold text-ink-2">{p.role}</p>
                <p className="mt-2 text-[16px] leading-[1.5] text-mute">{p.before}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="pb-28 lg:pb-36">
        <Container className="grid gap-4 lg:grid-cols-2">
          {OFFICES.map((o) => (
            <div key={o.city} className="rounded-[4px] bg-surface p-8 sm:p-10">
              <p className="font-display text-[clamp(3rem,5vw,4.6rem)] font-extrabold leading-none text-ink">{o.city}</p>
              <p className="mt-4 text-[18px] text-ink-2">{o.address}</p>
              <p className="mt-10 text-[18px] text-ink">
                <span className="tabular font-mono">{o.people}</span> of us work here.
              </p>
            </div>
          ))}
          <div className="flex flex-col items-start justify-between gap-6 rounded-[4px] bg-accent p-8 text-accent-ink sm:flex-row sm:items-center sm:p-10 lg:col-span-2">
            <p className="font-display text-[40px] font-extrabold leading-none">We&apos;re hiring in both offices.</p>
            <ButtonLink href="/careers" kind="ink" size="lg" arrow>
              See open roles
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
