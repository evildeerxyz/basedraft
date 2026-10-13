import type { Metadata } from "next";
import { CHANGELOG } from "@/lib/content";
import { ReleaseScene } from "@/components/gl/lazy";
import { Timeline } from "@/components/pages/changelog";
import { Container, Index } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Changelog",
  description: "New in Noma, every other Tuesday. Small releases, shipped often.",
  alternates: { canonical: "/changelog" },
  openGraph: { url: "/changelog" },
};

export default function ChangelogPage() {
  const versions = CHANGELOG.slice(0, 4)
    .map((entry) => `v${entry.version}`)
    .reverse();
  const latest = CHANGELOG[0];
  return (
    <>
      <section>
        <Container className="pt-14 md:pt-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[640px]">
              <Index>Changelog</Index>
              <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">New in Noma, every other Tuesday.</h1>
              <p className="mt-5 max-w-[520px] text-[18px] leading-relaxed text-ink-2">Small releases, shipped often. What changed, and why it matters for the questions you ask.</p>
            </div>
            <p className="text-[14px] text-ink-2">
              Latest <span className="font-mono text-ink">v{latest.version}</span> · {latest.date}
            </p>
          </div>
          <div className="relative mt-10 aspect-[2/1] w-full border-y border-line md:aspect-[4/1]">
            <ReleaseScene versions={versions} span={21} className="absolute inset-0" />
          </div>
        </Container>
      </section>
      <Timeline />
    </>
  );
}
