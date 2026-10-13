/*
 * Sample status page for the Noma template. Components, uptime and incidents
 * are static placeholder data; wire them to your monitoring before launch.
 */

import type { Metadata } from "next";
import { StatusScene } from "@/components/gl/lazy";
import { IncidentIcon, Subscribe, UptimeRow, type Day } from "@/components/pages/status";
import { Container, Index, Section, SectionHeading } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Status",
  description: "Live status, 90 day uptime and past incidents for every part of Noma.",
  alternates: { canonical: "/status" },
  openGraph: { url: "/status" },
};

/** 90 days of history for a component. Incidents are fixed days so the page renders the same everywhere. */
function history(incidents: Record<number, Day>): Day[] {
  return Array.from({ length: 90 }, (_, i) => incidents[i] ?? "ok");
}

const REGIONS = [
  { name: "us-east-1", place: "Virginia", p50: "38ms", p99: "212ms" },
  { name: "eu-west-1", place: "Ireland", p50: "41ms", p99: "228ms" },
  { name: "ap-southeast-1", place: "Singapore", p50: "47ms", p99: "251ms" },
];

const COMPONENTS = [
  { name: "Web app", note: "app.noma.so", uptime: "99.99%", days: history({ 61: "degraded" }) },
  { name: "Ask Data", note: "Drafting and explaining SQL", uptime: "99.97%", days: history({ 82: "degraded", 83: "degraded" }) },
  { name: "Query runner", note: "Running approved queries", uptime: "99.99%", days: history({}) },
  { name: "Approvals", note: "Review gate and audit log", uptime: "100%", days: history({}) },
  { name: "Insights", note: "Daily digests and alerts", uptime: "99.95%", days: history({ 34: "down", 35: "degraded" }) },
  { name: "Integrations", note: "Slack, Teams, Notion and webhooks", uptime: "99.96%", days: history({ 70: "degraded" }) },
];

const INCIDENTS = [
  {
    date: "Oct 2, 2026",
    kind: "incident" as const,
    title: "Slower Ask Data responses in eu-west-1",
    body: "A model provider region slowed down. We moved traffic to a second provider in 9 minutes. No queries failed and no data was affected.",
    took: "23 minutes",
  },
  {
    date: "Sep 18, 2026",
    kind: "incident" as const,
    title: "Delayed Slack notifications",
    body: "Slack rate limits delayed some insight alerts by up to 15 minutes. We now batch alerts per channel.",
    took: "41 minutes",
  },
  {
    date: "Aug 29, 2026",
    kind: "maintenance" as const,
    title: "Planned upgrade of the Postgres connector",
    body: "Upgraded the connector to support Postgres 17. Announced a week ahead. Connections reconnected automatically.",
    took: "12 minutes",
  },
];

export default function StatusPage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="grid items-center gap-10 pb-12 pt-14 md:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <div>
            <Index>Status</Index>
            <h1 className="mt-5 flex items-center gap-3.5 text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">
              <span className="relative inline-flex size-3 shrink-0 md:size-3.5">
                <span className="absolute inset-0 animate-ping rounded-[3px] bg-ok opacity-40" />
                <span className="relative size-full rounded-[3px] bg-ok" />
              </span>
              All systems operational.
            </h1>
            <p className="mt-5 max-w-[520px] text-[18px] leading-relaxed text-ink-2">Checked every minute from three regions. Get an email the moment something changes.</p>
            <div className="mt-8">
              <Subscribe />
            </div>
          </div>
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px]">
            <StatusScene regions={REGIONS.map((region) => region.name)} className="absolute inset-0" />
          </div>
        </Container>
      </section>

      <Section inner="py-20">
        <SectionHeading title="Components" description="The last 90 days. Hover a day for details." />
        <ul className="mt-10 rounded-[6px] border border-line bg-surface">
          {COMPONENTS.map((component) => (
            <UptimeRow key={component.name} {...component} />
          ))}
        </ul>
      </Section>

      <Section inner="py-12">
        <SectionHeading title="Regions" />
        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {REGIONS.map((region) => (
            <li key={region.name} className="rounded-[6px] border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[14px] text-ink">{region.name}</span>
                <span className="flex items-center gap-1.5 text-[13px] text-ok">
                  <span className="size-2 rounded-[2px] bg-ok" />
                  Healthy
                </span>
              </div>
              <p className="mt-1 text-[13.5px] text-ink-3">{region.place}</p>
              <dl className="mt-5 grid grid-cols-2 border-t border-line pt-4">
                <div>
                  <dt className="text-[12.5px] text-ink-3">Median</dt>
                  <dd className="mt-1 text-[22px] font-medium tracking-[-0.03em] text-ink">{region.p50}</dd>
                </div>
                <div className="border-l border-line pl-4">
                  <dt className="text-[12.5px] text-ink-3">Slowest 1%</dt>
                  <dd className="mt-1 text-[22px] font-medium tracking-[-0.03em] text-ink">{region.p99}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Section>

      <Section inner="pb-28 pt-16">
        <SectionHeading title="Past incidents" />
        <ol className="mt-8 border-t border-line">
          {INCIDENTS.map((incident) => (
            <li key={incident.title} className="grid gap-3 border-b border-line py-6 md:grid-cols-[160px_1fr_auto] md:gap-8">
              <span className="text-[14px] text-ink-3">{incident.date}</span>
              <div className="flex gap-3">
                <IncidentIcon kind={incident.kind} />
                <div>
                  <h3 className="text-[16px] font-medium text-ink">{incident.title}</h3>
                  <p className="mt-1 max-w-[620px] text-[14.5px] leading-relaxed text-ink-2">{incident.body}</p>
                </div>
              </div>
              <span className="text-[13.5px] text-ink-3 md:text-right">
                {incident.kind === "incident" ? "Resolved" : "Completed"} in {incident.took}
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
