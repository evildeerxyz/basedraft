import type { Metadata } from "next";
import { Roles } from "@/components/pages/roles";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band, SectionHead } from "@/components/site/ui";
import { SCENES } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Careers",
  description: "Help People teams get their week back. Open roles in Berlin, New York and remote in Europe.",
};

const PERKS = [
  { title: "30 days off", body: "Plus public holidays, and we check that you take them. pello sends the reminders." },
  { title: "Four day weeks in August", body: "The whole company, every August, without a pay cut." },
  { title: "Equity for everyone", body: "Every person at pello owns part of it, from their first day." },
  { title: "€2,000 to learn", body: "Each year, for books, courses and conferences, with no form to fill in." },
  { title: "Parental leave", body: "20 weeks at full pay for every parent, however they became one." },
  { title: "A desk at home", body: "€1,500 to set up, and €500 a year after that." },
];

export default function CareersPage() {
  return (
    <>
      <PageHead title="Help People teams get their week back." lead="We're 68 people in Berlin and New York, building the HR system we wished we'd had. Here's what's open." />
      <Band inner="pb-20">
        <Dithered src={SCENES.allHands} alt="The pello team at a Friday all hands" cell={3} focus={[0.5, 0.45]} className="aspect-[21/9] w-full rounded-[14px]" />
      </Band>
      <Band inner="pb-24 lg:pb-28">
        <Roles />
      </Band>
      <Band tint inner="py-24 lg:py-32">
        <SectionHead title="What working here is like" lead="We hold ourselves to the policies we help customers write." />
        <dl className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="border-t border-ink pt-4">
              <dt className="text-[22px] font-semibold tracking-[-0.035em] text-ink">{p.title}</dt>
              <dd className="mt-2 text-[16px] leading-[1.6] text-mute">{p.body}</dd>
            </div>
          ))}
        </dl>
      </Band>
    </>
  );
}
