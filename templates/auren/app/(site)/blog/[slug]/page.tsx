import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/site/blocks";
import { PostCard } from "@/components/site/post-card";
import { Toc } from "@/components/site/toc";
import { DitherArt } from "@/components/ui/dither-art";
import { DitherBand } from "@/components/ui/primitives";
import { DitherReveal, FadeIn, RevealText } from "@/components/ui/reveal";
import { SmartLink } from "@/components/ui/smart-link";
import { POSTS, getPost } from "@/lib/content/blog";
import { headings } from "@/lib/content/types";
import { pageMeta } from "@/lib/metadata";

type Props = PageProps<"/blog/[slug]">;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? pageMeta(post.title, post.excerpt) : {};
}

export default function PostPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-ink" />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: { params: Props["params"] }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article>
      <header className="bg-ink pt-[calc(var(--nav-h)+clamp(3rem,8vh,5rem))] text-paper">
        <div className="container-x">
          <SmartLink href="/blog" className="type-label text-mute underline decoration-paper/20 underline-offset-4 transition-colors hover:text-paper">
            All posts
          </SmartLink>
          <h1 className="type-display mt-8 max-w-[18ch] text-[clamp(2.5rem,5.6vw,5.25rem)]">
            <RevealText lines={[post.title]} />
          </h1>
          <FadeIn delay={0.3}>
            <p className="mt-8 max-w-[56ch] text-[18px] leading-[1.55] text-fog">{post.excerpt}</p>
            <div className="mt-6 font-mono text-[12px] text-mute">
              {post.date} · {post.author} · {post.readTime}
            </div>
          </FadeIn>
          <DitherReveal scale={6} duration={1200} className="mt-14 overflow-hidden rounded-t-[10px]">
            <DitherArt variant={post.art.variant} seed={post.art.seed} cols={96} rows={40} className="aspect-[12/5] w-full" />
          </DitherReveal>
        </div>
      </header>
      <DitherBand from="var(--ink)" to="var(--paper)" rows={16} />

      <div className="bg-paper text-ink">
        <div className="container-x grid grid-cols-1 gap-12 pb-24 pt-10 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <Toc items={headings(post.blocks)} />
            </div>
          </aside>
          <Blocks blocks={post.blocks} className="text-[17.5px] lg:col-span-7" />
        </div>

        <div className="container-x border-t border-ink/12 pb-28 pt-14">
          <div className="type-label text-ink/45">More from the blog</div>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3">
            {more.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
