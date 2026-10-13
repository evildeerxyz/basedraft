import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Cta } from "@/components/home/cta";
import { Dithered } from "@/components/site/dither";
import { Prose } from "@/components/site/page";
import { Band } from "@/components/site/ui";
import { POSTS, postOf } from "@/lib/posts";

// Every post is drawn at build time, so opening one doesn't wait on anything; this tells Next's
// development check that reading the post's slug here is fine.
export const instant = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = postOf((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = postOf((await params).slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
  return (
    <>
      <Band inner="pb-20 pt-14 lg:pt-20">
        <Link href="/blog" className="inline-flex h-10 items-center gap-2 rounded-[10px] text-[15px] font-medium text-ink-2 transition-colors hover:text-ink">
          <ArrowLeftIcon size={16} />
          All notes
        </Link>
        <h1 className="mt-6 max-w-[880px] text-balance text-[clamp(2.6rem,5vw,4.4rem)] font-semibold leading-[1] tracking-[-0.055em] text-ink">{post.title}</h1>
        <p className="mt-6 max-w-[640px] text-[19px] leading-[1.5] text-mute">{post.excerpt}</p>
        <p className="mt-6 text-[15px] text-mute">
          {post.author}, {post.role}. {post.date}, <span className="tabular font-mono">{post.minutes}</span> min read
        </p>
        <Dithered src={post.cover} alt="" cell={3} focus={[0.5, 0.45]} className="mt-10 aspect-[21/9] w-full rounded-[14px]" />
        <Prose className="mt-12">
          {post.body.map((b, i) =>
            "h2" in b ? (
              <h2 key={i}>{b.h2}</h2>
            ) : "p" in b ? (
              <p key={i}>{b.p}</p>
            ) : "list" in b ? (
              <ul key={i}>
                {b.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            ) : (
              <figure key={i} className="my-10 border-l-2 border-accent pl-6">
                <blockquote className="text-[26px] font-medium leading-[1.3] tracking-[-0.03em] text-ink">&ldquo;{b.quote}&rdquo;</blockquote>
                <figcaption className="mt-3 text-[15px] text-mute">{b.by}</figcaption>
              </figure>
            ),
          )}
        </Prose>
      </Band>
      <Band inner="pb-20">
        <p className="border-t border-ink pt-6 text-[15px] font-medium text-mute">Read next</p>
        <ul className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block rounded-[8px]">
                <span className="block text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-ink decoration-2 underline-offset-[5px] group-hover:underline">{p.title}</span>
                <span className="mt-1.5 block text-[15px] leading-[1.55] text-mute">{p.excerpt}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Band>
      <Cta />
    </>
  );
}
