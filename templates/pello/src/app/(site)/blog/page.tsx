import type { Metadata } from "next";
import Link from "next/link";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band } from "@/components/site/ui";
import { POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes from the pello team on HR, payroll and the work People teams should be doing.",
};

export default function BlogPage() {
  const [first, ...rest] = POSTS;
  return (
    <>
      <PageHead title="Notes on HR, pay and people" lead="From the people building pello, and the People teams who use it." />
      <Band inner="pb-24 lg:pb-32">
        <Link href={`/blog/${first.slug}`} className="pl-card group grid overflow-hidden rounded-[16px] lg:grid-cols-[1.1fr_1fr]">
          <Dithered src={first.cover} alt="" cell={3} focus={[0.5, 0.45]} className="aspect-[16/10] lg:aspect-auto lg:min-h-[400px]" />
          <div className="flex flex-col justify-between gap-8 p-7 sm:p-10">
            <div>
              <p className="text-[15px] text-mute">
                {first.date} · <span className="tabular font-mono">{first.minutes}</span> min read
              </p>
              <h2 className="mt-3 text-balance font-display text-[clamp(2rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink">{first.title}</h2>
              <p className="mt-3 text-[17px] leading-[1.55] text-mute">{first.excerpt}</p>
            </div>
            <p className="text-[15px] font-medium text-ink">
              {first.author}, {first.role}
            </p>
          </div>
        </Link>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="pl-card group flex h-full flex-col overflow-hidden rounded-[16px]">
                <Dithered src={p.cover} alt="" cell={2} focus={[0.5, 0.45]} className="aspect-[16/10]" />
                <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                  <div>
                    <h2 className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink">{p.title}</h2>
                    <p className="mt-2 text-[15px] leading-[1.55] text-mute">{p.excerpt}</p>
                  </div>
                  <p className="text-[15px] text-mute">
                    {p.author} · {p.date}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}
