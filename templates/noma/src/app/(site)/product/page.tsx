import type { Metadata } from "next";
import { APP_URL } from "@/lib/content";
import { ArchitectureSection, FinalCta } from "@/components/home/sections";
import { CompassIcon } from "@phosphor-icons/react/ssr";
import { Showcase } from "@/components/home/showcase";
import { Integrations, ProductTools } from "@/components/pages/product";
import { ButtonLink, Container, Index } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Product",
  description: "Ask Data, Tables, the SQL Editor, Relationships and Insights: five tools and one AI layer on top of the Postgres you already run.",
  alternates: { canonical: "/product" },
  openGraph: { url: "/product" },
};

export default function ProductPage() {
  return (
    <>
      <section>
        <Container className="grid gap-8 pb-12 pt-14 md:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Index>Product</Index>
            <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">One workspace for every question about your data.</h1>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-[460px] text-[18px] leading-relaxed text-ink-2">
              Five tools and one AI layer on top of the Postgres you already run. Below, the workspace answers questions on a sample database, one step at a time.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href={APP_URL} variant="accent" size="lg">
                Start free
              </ButtonLink>
              <ButtonLink href="#tools" variant="secondary" size="lg" icon={CompassIcon}>
                Tour the tools
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
      <section className="pb-20">
        <Container>
          <Showcase />
        </Container>
      </section>
      <ProductTools />
      <ArchitectureSection />
      <Integrations />
      <FinalCta />
    </>
  );
}
