import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Customers",
  description: "How Halden, Brightwater, Kestrel and 1,200 other People teams use pello, in their own words.",
};

export default function CustomersPage() {
  return (
    <>
      <PageHead title="1,200 People teams, and what they stopped doing." lead="Six of them, in their own words: what took up their week before pello, and what does now." />
      <Band inner="pb-24 lg:pb-32">
        <ol>
          {STORIES.map((s) => (
            <li key={s.slug} id={s.slug} className="grid scroll-mt-24 gap-8 border-t border-ink py-12 first:pt-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
              <div>
                <p className="text-[26px] font-semibold tracking-[-0.04em] text-ink">{s.company}</p>
                <p className="mt-1 text-[15px] text-mute">
                  {s.what}, <span className="tabular font-mono">{s.size.toLocaleString("en-US")}</span> people
                </p>
                <p className="tabular mt-8 font-mono text-[44px] font-medium leading-none tracking-[-0.05em] text-ink">{s.result}</p>
                <p className="mt-2 max-w-[220px] text-[15px] leading-[1.45] text-mute">{s.resultLabel}</p>
              </div>
              <div>
                <blockquote className="max-w-[760px] text-pretty text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium leading-[1.3] tracking-[-0.03em] text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Dithered src={customerPhoto(s.name)} alt="" cell={1} focus={[0.5, 0.3]} develop={false} className="size-11 rounded-full" />
                  <p className="text-[15px] text-mute">
                    <span className="font-medium text-ink">{s.name}</span>, {s.role}
                  </p>
                </div>
                <div className="mt-8 grid max-w-[680px] gap-4 text-[17px] leading-[1.65] text-ink-2">
                  {s.story.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Band>
      <Cta />
    </>
  );
}
