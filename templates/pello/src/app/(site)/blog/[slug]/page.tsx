import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Cta } from "@/components/home/cta";
import { Prose } from "@/components/site/page";
import { Container } from "@/components/site/ui";
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
      <article className="pb-24 pt-14 lg:pt-20">
        <Container>
          <Link href="/blog" className="inline-flex h-11 items-center gap-2 rounded-[12px] text-[16px] font-medium text-ink-2 transition-colors hover:text-ink">
            <ArrowLeftIcon size={17} />
            All notes
          </Link>
          <h1 className="mt-8 max-w-[960px] text-balance text-[clamp(2.8rem,6.4vw,5.6rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-ink">{post.title}</h1>
          <p className="mt-8 max-w-[680px] text-[clamp(1.18rem,1.6vw,1.32rem)] leading-[1.5] text-ink-2">{post.excerpt}</p>
          <p className="mt-8 text-[16px] text-mute">
            {post.author}, {post.role} · {post.date} · {post.minutes} min read
          </p>
          <Prose className="mt-16">
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
                <figure key={i} className="my-12 rounded-[24px] bg-surface p-8">
                  <blockquote className="text-[24px] font-medium leading-[1.4] tracking-[-0.02em] text-ink">{b.quote}</blockquote>
                  <figcaption className="mt-4 text-[16px] text-mute">{b.by}</figcaption>
                </figure>
              ),
            )}
          </Prose>
        </Container>
      </article>
      <section className="pb-12">
        <Container>
          <p className="text-[19px] font-semibold text-ink">Read next</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="block rounded-[24px] border border-line bg-surface p-7 transition-colors hover:bg-sunken">
                  <span className="block text-[24px] font-semibold tracking-[-0.025em] text-ink">{p.title}</span>
                  <span className="mt-2 block text-[17px] text-ink-2">{p.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <Cta />
    </>
  );
}
