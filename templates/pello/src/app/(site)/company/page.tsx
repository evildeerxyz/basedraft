import type { Metadata } from "next";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band, ButtonLink, SectionHead } from "@/components/site/ui";
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

      <Band inner="pb-24">
        <Dithered src={SCENES.office} alt="The pello office in Berlin" cell={3} focus={[0.5, 0.5]} className="aspect-[21/9] w-full rounded-[14px]" />
        <dl className="mt-10 grid grid-cols-2 gap-x-10 gap-y-8 lg:grid-cols-4">
          {NUMBERS.map((n) => (
            <div key={n.label} className="flex flex-col-reverse border-t border-ink pt-4">
              <dt className="mt-2 text-[15px] text-mute">{n.label}</dt>
              <dd className="tabular font-mono text-[clamp(2.2rem,3.6vw,3rem)] font-medium leading-none tracking-[-0.05em] text-ink">{n.value}</dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band tint inner="py-24 lg:py-32">
        <SectionHead title="What we hold to" />
        <ol className="mt-14">
          {BELIEFS.map((b) => (
            <li key={b.title} className="grid gap-3 border-t border-ink py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <p className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-ink">{b.title}</p>
              <p className="max-w-[520px] text-[17px] leading-[1.6] text-mute">{b.body}</p>
            </li>
          ))}
        </ol>
      </Band>

      <Band inner="py-24 lg:py-32">
        <SectionHead title="Who you'll talk to" lead="Most of us have done the work pello does, by hand, for years." />
        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {TEAM.map((p) => (
            <li key={p.name}>
              <Dithered src={teamPhoto(p.name)} alt={p.name} cell={2} focus={[0.5, 0.3]} className="aspect-[4/5] w-full rounded-[12px]" />
              <p className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-ink">{p.name}</p>
              <p className="text-[15px] text-mute">{p.role}</p>
              <p className="mt-2 text-[15px] leading-[1.5] text-ink-2">{p.before}</p>
            </li>
          ))}
        </ul>
      </Band>

      <Band inner="pb-24 lg:pb-32">
        <div className="grid gap-10 border-t border-ink pt-10 lg:grid-cols-2">
          {OFFICES.map((o) => (
            <div key={o.city}>
              <p className="text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-none tracking-[-0.05em] text-ink">{o.city}</p>
              <p className="mt-3 text-[17px] text-mute">{o.address}</p>
              <p className="mt-6 text-[17px] text-ink-2">
                <span className="tabular font-mono text-ink">{o.people}</span> of us work here.
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
          <p className="text-[24px] font-semibold tracking-[-0.035em] text-ink">We&apos;re hiring in both offices.</p>
          <ButtonLink href="/careers" chevron>
            See open roles
          </ButtonLink>
        </div>
      </Band>
    </>
  );
}
