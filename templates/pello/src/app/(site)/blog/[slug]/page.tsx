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
        <h1 className="mt-6 max-w-[860px] text-balance font-display text-[clamp(2.6rem,5vw,4.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">{post.title}</h1>
        <p className="mt-5 max-w-[640px] text-[18px] leading-[1.55] text-mute">{post.excerpt}</p>
        <p className="mt-6 text-[15px] text-mute">
          {post.author}, {post.role} · {post.date} · <span className="tabular font-mono">{post.minutes}</span> min read
        </p>
        <div className="pl-card mt-10 overflow-hidden rounded-[16px]">
          <Dithered src={post.cover} alt="" cell={3} focus={[0.5, 0.45]} className="aspect-[21/9]" />
        </div>
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
              <figure key={i} className="pl-card my-10 rounded-[16px] p-7">
                <blockquote className="font-display text-[24px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink">&ldquo;{b.quote}&rdquo;</blockquote>
                <figcaption className="mt-3 text-[15px] text-mute">{b.by}</figcaption>
              </figure>
            ),
          )}
        </Prose>
      </Band>
      <Band rule inner="py-16">
        <p className="font-display text-[24px] font-semibold tracking-[-0.015em] text-ink">Read next</p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="pl-card block rounded-[16px] p-6">
                <span className="block font-display text-[20px] font-semibold tracking-[-0.01em] text-ink">{p.title}</span>
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
