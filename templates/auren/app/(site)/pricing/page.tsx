import { pageMeta } from "@/lib/metadata";
import { PricingPlans } from "@/components/sections/pricing";
import { Comparison } from "@/components/site/comparison";
import { PageHero } from "@/components/site/page-hero";
import { Accordion } from "@/components/ui/accordion";
import { SectionLabel, buttonClass } from "@/components/ui/primitives";
import { RevealText } from "@/components/ui/reveal";
import { SmartLink } from "@/components/ui/smart-link";
import { FAQ } from "@/lib/content/pricing";

export const metadata = pageMeta("Pricing", "Tab is free on every plan. Pay for agents, not for typing.");

export default function PricingPage() {
  return (
    <>
      <PageHero
        index="Auren"
        label="Pricing"
        title={["Pay for agents,", "not for typing."]}
        intro="Tab runs on your machine, so it is free and unlimited on every plan. You only pay when agents do work for you."
        sun={-0.12}
      />

      <section className="bg-paper pb-24 pt-16 text-ink md:pb-32 md:pt-20">
        <div className="container-x">
          <PricingPlans />

          <div className="mt-28">
            <SectionLabel index="01">Compare</SectionLabel>
            <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
              <RevealText lines={["Every feature,", "side by side."]} />
            </h2>
            <Comparison />
          </div>

          <div className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="02">Questions</SectionLabel>
              <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
                <RevealText lines={["Asked,", "answered."]} />
              </h2>
            </div>
            <div className="lg:col-span-8">
              <Accordion items={FAQ} />
            </div>
          </div>

          <div className="mt-28 grid grid-cols-1 gap-6 rounded-[10px] bg-ink p-8 text-paper md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-12">
            <div>
              <div className="type-label text-mute">Enterprise</div>
              <p className="type-title mt-3 max-w-[30ch] text-[clamp(1.5rem,2.6vw,2.1rem)]">
                Self-hosted gateway, your own models, volume pricing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SmartLink href="/security" className={buttonClass("ghost-dark", "lg")}>
                Security overview
              </SmartLink>
              <a href="mailto:sales@auren.dev" className={buttonClass("light", "lg")}>
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
