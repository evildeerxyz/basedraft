import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/page";
import { Container } from "@/components/site/ui";
import { POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes from the pello team on HR, payroll and the work People teams should be doing.",
};

export default function BlogPage() {
  const [first, ...rest] = POSTS;
  return (
    <>
      <PageHead title="Notes on HR, pay and people." lead="From the people building pello, and the People teams who use it." />
      <section className="pb-28 lg:pb-36">
        <Container>
          <Link href={`/blog/${first.slug}`} className="group grid gap-8 rounded-[32px] bg-night p-8 text-night-ink transition-transform duration-300 hover:-translate-y-1 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:p-16">
            <h2 className="text-balance text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.05em]">{first.title}</h2>
            <div className="flex flex-col justify-between gap-8">
              <p className="text-[19px] leading-[1.55] text-night-mute">{first.excerpt}</p>
              <p className="text-[16px] text-night-mute">
                {first.author} · {first.date} · {first.minutes} min read
              </p>
            </div>
          </Link>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col justify-between gap-10 rounded-[28px] border border-line bg-surface p-8 transition-transform duration-300 hover:-translate-y-1">
                  <div>
                    <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink group-hover:text-accent">{p.title}</h2>
                    <p className="mt-4 text-[17px] leading-[1.55] text-ink-2">{p.excerpt}</p>
                  </div>
                  <p className="text-[15px] text-mute">
                    {p.author} · {p.date}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
