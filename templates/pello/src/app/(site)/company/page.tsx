import type { Metadata } from "next";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band, ButtonLink, Chip, SectionHead } from "@/components/site/ui";
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
  { title: "Ask a person when it matters", body: "pello decides what a rule can decide. Everything else goes to someone, with what they need to decide it quickly." },
  { title: "Show where it came from", body: "Every answer links to the passage it used. If people can check it, they can trust it, and so can you." },
  { title: "Be boring about money", body: "Payroll is checked twice and explained line by line. Nobody gets paid until a person says so." },
];

export default function CompanyPage() {
  return (
    <>
      <PageHead title="People teams should spend their week on people" lead="Anna ran People at a 900 person company and spent most of her week on forms, inboxes and spreadsheets. Daniel had built payroll systems for ten years. In 2022 they started pello to take that week back." />

      <Band inner="pb-20">
        <div className="pl-card -mx-2 overflow-hidden rounded-[16px] sm:-mx-6 lg:-mx-[64px]">
          <Dithered src={SCENES.office} alt="The pello office in Berlin" cell={3} focus={[0.5, 0.5]} className="aspect-[21/9]" />
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {NUMBERS.map((n, i) => (
              <div key={n.label} className={`flex flex-col-reverse p-6 sm:p-8 ${i ? "shadow-[-1px_0_0_var(--pl-line)]" : ""}`}>
                <dt className="mt-2 text-[15px] text-mute">{n.label}</dt>
                <dd className="tabular font-display text-[clamp(2.2rem,3.6vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-ink">{n.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Band>

      <Band rule inner="py-24 lg:py-32">
        <SectionHead title="Three things we hold to" />
        <ol className="mt-12 grid gap-3 lg:grid-cols-3">
          {BELIEFS.map((b, i) => (
            <li key={b.title} className="pl-card rounded-[16px] p-6 sm:p-7">
              <Chip>0{i + 1}</Chip>
              <p className="mt-5 font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">{b.title}</p>
              <p className="mt-3 text-[16px] leading-[1.6] text-mute">{b.body}</p>
            </li>
          ))}
        </ol>
      </Band>

      <Band rule inner="py-24 lg:py-32">
        <SectionHead title="Who you'll talk to" lead="Most of us have done the work pello does, by hand, for years." />
        <ul className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TEAM.map((p) => (
            <li key={p.name} className="pl-card overflow-hidden rounded-[16px]">
              <Dithered src={teamPhoto(p.name)} alt={p.name} cell={2} focus={[0.5, 0.3]} className="aspect-[4/5]" />
              <div className="p-4 sm:p-5">
                <p className="text-[16px] font-semibold text-ink">{p.name}</p>
                <p className="text-[15px] text-mute">{p.role}</p>
                <p className="mt-2 text-[15px] leading-[1.5] text-ink-2">{p.before}</p>
              </div>
            </li>
          ))}
        </ul>
      </Band>

      <Band rule inner="py-24 lg:py-32">
        <div className="grid gap-3 lg:grid-cols-2">
          {OFFICES.map((o) => (
            <div key={o.city} className="pl-card rounded-[16px] p-7 sm:p-8">
              <p className="font-display text-[34px] font-semibold tracking-[-0.025em] text-ink">{o.city}</p>
              <p className="mt-2 text-[16px] text-mute">{o.address}</p>
              <p className="mt-8 text-[16px] text-ink-2">
                <span className="tabular font-mono text-ink">{o.people}</span> of us work here.
              </p>
            </div>
          ))}
          <div className="pl-card flex flex-col items-start justify-between gap-6 rounded-[16px] p-7 sm:flex-row sm:items-center sm:p-8 lg:col-span-2">
            <p className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">We&apos;re hiring in both offices</p>
            <ButtonLink href="/careers">See open roles</ButtonLink>
          </div>
        </div>
      </Band>
    </>
  );
}
