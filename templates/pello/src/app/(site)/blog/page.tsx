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
      <PageHead title="Notes on HR, pay and people." lead="From the people building pello, and the People teams who use it." />
      <Band inner="pb-24 lg:pb-32">
        <Link href={`/blog/${first.slug}`} className="group grid gap-8 rounded-[14px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <Dithered src={first.cover} alt="" cell={3} focus={[0.5, 0.45]} className="aspect-[16/10] w-full rounded-[14px]" />
          <div>
            <p className="text-[15px] text-mute">
              {first.date}, <span className="tabular font-mono">{first.minutes}</span> min read
            </p>
            <h2 className="mt-3 text-balance text-[clamp(2rem,3.4vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink decoration-2 underline-offset-[6px] group-hover:underline">{first.title}</h2>
            <p className="mt-4 text-[17px] leading-[1.55] text-mute">{first.excerpt}</p>
            <p className="mt-6 text-[15px] font-medium text-ink">
              {first.author}, {first.role}
            </p>
          </div>
        </Link>
        <ul className="mt-20 border-t border-ink">
          {rest.map((p) => (
            <li key={p.slug} className="border-b border-line">
              <Link href={`/blog/${p.slug}`} className="group grid gap-5 rounded-[8px] py-7 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[200px_minmax(0,1fr)_220px] lg:items-center">
                <Dithered src={p.cover} alt="" cell={2} focus={[0.5, 0.45]} className="aspect-[16/10] w-full rounded-[10px]" />
                <div>
                  <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-ink decoration-2 underline-offset-[5px] group-hover:underline">{p.title}</h2>
                  <p className="mt-2 max-w-[560px] text-[16px] leading-[1.55] text-mute">{p.excerpt}</p>
                </div>
                <p className="text-[15px] text-mute lg:text-right">
                  {p.author}
                  <br className="max-lg:hidden" />
                  <span className="lg:hidden">, </span>
                  {p.date}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}
