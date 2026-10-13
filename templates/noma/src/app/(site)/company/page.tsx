import type { Metadata } from "next";
import { FUNDING } from "@/lib/content";
import { Careers, Funding, Team, Values } from "@/components/pages/company";
import { BriefcaseIcon, NewspaperIcon } from "@phosphor-icons/react/ssr";
import { ButtonLink, Container, Index } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Company",
  description: "Noma builds the interface between people and their data. Meet the team, our investors and our open roles.",
  alternates: { canonical: "/company" },
  openGraph: { url: "/company" },
};

const FACTS = [
  ["Founded", "2023"],
  ["People", "31"],
  ["Raised", FUNDING.total],
];

export default function CompanyPage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="grid gap-10 pb-16 pt-14 md:pt-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <Index>Company</Index>
            <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[64px]">The interface between people and their data.</h1>
          </div>
          <div className="lg:pt-10">
            <p className="text-pretty text-[21px] leading-[1.4] tracking-[-0.015em] text-ink md:text-[24px]">
              Databases hold the most important answers a company has. For forty years, getting them out took a translator. We think the translator should be software, and the decision should stay
              human.
            </p>
            <dl className="mt-10 grid grid-cols-3 border-t border-line">
              {FACTS.map(([term, value], i) => (
                <div key={term} className={i > 0 ? "border-l border-line pl-5 pt-4" : "pt-4"}>
                  <dt className="text-[13px] text-ink-3">{term}</dt>
                  <dd className="mt-1 text-[26px] font-medium tracking-[-0.04em] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="#careers" size="lg" icon={BriefcaseIcon}>
                See open roles
              </ButtonLink>
              <ButtonLink href="/blog/series-b" variant="secondary" size="lg" icon={NewspaperIcon}>
                Read the Series B news
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
      <Team />
      <Funding />
      <Values />
      <Careers />
    </>
  );
}
