import { pageMeta } from "@/lib/metadata";
import { PageHero } from "@/components/site/page-hero";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { UptimeBars } from "@/components/site/uptime-bars";
import { SectionLabel } from "@/components/ui/primitives";
import { FadeIn } from "@/components/ui/reveal";
import { INCIDENTS, SERVICES, uptime } from "@/lib/content/status";

export const metadata = pageMeta("Status", "Live and historical status for Auren services.");

export default function StatusPage() {
  return (
    <>
      <PageHero
        label="Status"
        title={["All systems", "normal."]}
        intro="Every Auren service is operating as expected. The editor and Tab keep working offline even when ours do not."
        sun={0.34}
      >
        <SubscribeForm />
      </PageHero>

      <section className="bg-paper py-20 text-ink md:py-28">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionLabel index="01">Services</SectionLabel>
            <div className="flex gap-5 font-mono text-[11.5px] text-ink/50">
              <span className="flex items-center gap-2">
                <span className="size-2 bg-ink/80" />
                Operational
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 bg-accent" />
                Degraded
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 bg-del" />
                Outage
              </span>
            </div>
          </div>
          <ul className="mt-10 border-t border-ink/12">
            {SERVICES.map((s, i) => (
              <FadeIn as="li" key={s.name} delay={i * 0.05} className="grid grid-cols-1 gap-5 border-b border-ink/12 py-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 bg-add" />
                    <span className="type-title text-[21px]">{s.name}</span>
                  </div>
                  <p className="mt-1 pl-[18px] text-[14px] text-ink/55">{s.detail}</p>
                </div>
                <div className="lg:col-span-7">
                  <UptimeBars days={s.days} name={s.name} />
                </div>
                <div className="font-mono text-[13px] lg:col-span-1 lg:text-right">{uptime(s.days)}%</div>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-24 text-ink md:pb-32">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="02">Past incidents</SectionLabel>
          </div>
          <ol className="border-t border-ink/12 lg:col-span-8">
            {INCIDENTS.map((inc) => (
              <li key={inc.title} className="border-b border-ink/12 py-7">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[12px] text-ink/50">
                  {inc.date}
                  <span className="rounded-full border border-ink/15 px-2 py-0.5 text-ink/60">{inc.state}</span>
                </div>
                <h3 className="type-title mt-3 text-[22px]">{inc.title}</h3>
                <p className="mt-2 max-w-[60ch] text-[15.5px] leading-[1.6] text-ink/60">{inc.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
