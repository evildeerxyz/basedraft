import { pageMeta } from "@/lib/metadata";
import { PageHero } from "@/components/site/page-hero";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { DitherArt } from "@/components/ui/dither-art";
import { PostCard } from "@/components/site/post-card";
import { DitherReveal, FadeIn } from "@/components/ui/reveal";
import { SmartLink } from "@/components/ui/smart-link";
import { POSTS } from "@/lib/content/blog";

export const metadata = pageMeta("Blog", "How we build Auren, and what we learn along the way.");

export default function BlogIndex() {
  const [featured, ...rest] = POSTS;
  return (
    <>
      <PageHero
        label="Blog"
        title={["Notes from", "the workbench."]}
        intro="How we build Auren, and what we learn along the way. New posts arrive with most major releases."
        sun={-0.22}
      >
        <SubscribeForm />
      </PageHero>

      <section className="bg-paper pb-24 pt-14 text-ink md:pb-32">
        <div className="container-x">
          <SmartLink href={`/blog/${featured.slug}`} prefetch className="group grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <DitherReveal scale={5} className="overflow-hidden rounded-[10px] lg:col-span-7">
              <DitherArt
                variant={featured.art.variant}
                seed={featured.art.seed}
                className="aspect-[16/10] w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            </DitherReveal>
            <div className="lg:col-span-5">
              <div className="font-mono text-[12px] text-ink/50">
                {featured.date} · {featured.author}
              </div>
              <h2 className="type-display mt-4 text-[clamp(2rem,3.6vw,3.25rem)]">{featured.title}</h2>
              <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.6] text-ink/60">{featured.excerpt}</p>
              <span className="mt-6 inline-block text-[14px] font-medium underline decoration-ink/25 underline-offset-4 transition-colors group-hover:decoration-ink">
                Read the post
              </span>
            </div>
          </SmartLink>

          <div className="mt-24 grid grid-cols-1 gap-x-8 gap-y-14 border-t border-ink/12 pt-14 md:grid-cols-3">
            {rest.map((post, i) => (
              <FadeIn key={post.slug} delay={i * 0.08}>
                <PostCard post={post} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
