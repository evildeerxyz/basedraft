import type { Metadata } from "next";
import { Roles } from "@/components/pages/roles";
import { PageHead } from "@/components/site/page";
import { Container, SectionHead } from "@/components/site/ui";

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
      <section className="pb-28">
        <Container>
          <Roles />
        </Container>
      </section>
      <section className="bg-surface py-28 lg:py-36">
        <Container>
          <SectionHead title="What working here is like." lead="We hold ourselves to the policies we help customers write." />
          <ul className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((p) => (
              <li key={p.title}>
                <p className="text-[24px] font-semibold tracking-[-0.025em] text-ink">{p.title}</p>
                <p className="mt-3 text-[17px] leading-[1.6] text-ink-2">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
