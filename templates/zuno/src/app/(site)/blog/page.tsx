import type { Metadata } from "next";
import Link from "next/link";
import { BlogCover } from "@/components/pages/BlogCover";
import { PageHero } from "@/components/site/PageHero";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on money, markets and building Zuno.",
};

export default function BlogPage() {
  const [featured, ...rest] = POSTS;
  return (
    <main id="main">
      <PageHero lead="Notes on money," tail="markets and building Zuno." intro="Written by the people who build and run Zuno. No hot takes, no stock tips." />

      <section className="mx-auto max-w-[1280px] px-5 pb-28 lg:px-8">
        <Link href={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2 lg:grid-cols-2">
          <BlogCover seed={featured.seed} className="aspect-[16/10] lg:aspect-auto lg:min-h-[420px]" />
          <div className="flex flex-col justify-between p-7 lg:p-10">
            <div>
              <div className="text-[17px] font-medium text-accent">
                {featured.category} <span className="font-normal text-white/60">· {featured.readTime}</span>
              </div>
              <h2 className="mt-4 text-[clamp(2rem,3.8vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.04em] group-hover:text-accent">{featured.title}</h2>
              <p className="mt-5 max-w-[500px] text-[19px] leading-relaxed text-white/70">{featured.excerpt}</p>
            </div>
            <div className="mt-10 text-[17px] text-white/60">
              {featured.author.name} · {featured.date}
            </div>
          </div>
        </Link>

        <ul className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-2">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block">
                <BlogCover seed={p.seed} className="aspect-[16/10] rounded-[22px] border border-white/[0.08]" />
                <div className="mt-6 text-[16px] font-medium text-accent">
                  {p.category} <span className="font-normal text-white/60">· {p.readTime}</span>
                </div>
                <h3 className="mt-2 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.12] tracking-[-0.03em] group-hover:text-accent">{p.title}</h3>
                <p className="mt-3 max-w-[540px] text-[18px] leading-relaxed text-white/70">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
