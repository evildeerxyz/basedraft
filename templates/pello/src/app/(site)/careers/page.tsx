import type { Metadata } from "next";
import { Roles } from "@/components/pages/roles";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Container, SectionHead } from "@/components/site/ui";
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
      <section className="pb-16">
        <Container>
          <Dithered src={SCENES.allHands} alt="The pello team at a Friday all hands" inks={["ink", "accent", "page"]} cell={3} focus={[0.5, 0.45]} className="aspect-[21/9] rounded-[4px]" />
        </Container>
      </section>
      <section className="pb-28">
        <Container>
          <Roles />
        </Container>
      </section>
      <section className="bg-ink py-28 text-page lg:py-36">
        <Container>
          <SectionHead dark title="What working here is like." lead="We hold ourselves to the policies we help customers write." />
          <ul className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((p) => (
              <li key={p.title}>
                <p className="font-display text-[38px] font-extrabold leading-[0.95] text-page">{p.title}</p>
                <p className="mt-3 text-[18px] leading-[1.55] text-night-mute">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
