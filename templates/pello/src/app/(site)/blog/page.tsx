import type { Metadata } from "next";
import Link from "next/link";
import { Dithered } from "@/components/site/dither";
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
          <Link href={`/blog/${first.slug}`} className="group grid overflow-hidden rounded-[4px] bg-ink text-page lg:grid-cols-[1.1fr_1fr]">
            <Dithered src={first.cover} alt="" inks={["ink", "accent", "page"]} cell={3} focus={[0.5, 0.45]} className="aspect-[16/10] bg-ink lg:aspect-auto lg:min-h-[460px]" />
            <div className="flex flex-col justify-between gap-10 p-8 sm:p-12">
              <h2 className="text-balance font-display text-[clamp(3rem,5.4vw,5.2rem)] font-extrabold leading-[0.86] transition-colors group-hover:text-accent">{first.title}</h2>
              <div>
                <p className="text-[20px] leading-[1.5] text-night-mute">{first.excerpt}</p>
                <p className="mt-6 text-[16px] text-night-mute">
                  {first.author} · {first.date} · <span className="tabular font-mono">{first.minutes}</span> min read
                </p>
              </div>
            </div>
          </Link>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[4px] bg-surface">
                  <Dithered src={p.cover} alt="" cell={2} focus={[0.5, 0.45]} className="aspect-[16/10]" />
                  <div className="flex flex-1 flex-col justify-between gap-8 p-7">
                  <div>
                    <h2 className="font-display text-[38px] font-extrabold leading-[0.92] text-ink transition-colors group-hover:text-accent">{p.title}</h2>
                    <p className="mt-4 text-[17px] leading-[1.55] text-ink-2">{p.excerpt}</p>
                  </div>
                  <p className="text-[15px] text-mute">
                    {p.author} · {p.date}
                  </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
