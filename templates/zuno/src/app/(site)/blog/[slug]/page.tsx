import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DitherAvatar } from "@/components/dither/DitherAvatar";
import { BlogCover } from "@/components/pages/BlogCover";
import { SectionTitle } from "@/components/ui/Section";
import { getPost, POSTS, type BlogBlock } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

function Block({ b }: { b: BlogBlock }) {
  if (b.type === "h2") return <h2>{b.text}</h2>;
  if (b.type === "quote") return <blockquote>{b.text}</blockquote>;
  if (b.type === "ul")
    return (
      <ul>
        {b.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    );
  return <p>{b.text}</p>;
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main id="main">
      <article className="mx-auto max-w-[1280px] px-5 pb-24 pt-28 lg:px-8 lg:pt-36">
        <Link href="/blog" className="group inline-flex items-center gap-2 text-[17px] text-white/70 transition-colors hover:text-white">
          <ArrowLeftIcon size={18} className="transition-transform group-hover:-translate-x-1" /> All posts
        </Link>
        <header className="mt-10 max-w-[960px]">
          <div className="text-[17px] text-white/60">
            <span className="font-medium text-accent">{post.category}</span> · {post.date} · {post.readTime}
          </div>
          <SectionTitle as="h1" lead={post.title} className="mt-5 text-[clamp(2.6rem,6vw,5.2rem)]" />
          <p className="mt-7 max-w-[680px] text-[21px] leading-relaxed text-white/70">{post.excerpt}</p>
          <div className="mt-8 flex items-center gap-3">
            <DitherAvatar seed={post.author.seed} name={post.author.name} size={52} tone="paper" />
            <div className="leading-tight">
              <div className="text-[17px] font-medium">{post.author.name}</div>
              <div className="text-[15px] text-white/60">{post.author.role}</div>
            </div>
          </div>
        </header>
        <BlogCover seed={post.seed} className="mt-12 aspect-[21/9] rounded-[24px] border border-white/[0.08]" />
        <div className="zn-prose mx-auto mt-16 max-w-[720px] text-[19px]">
          {post.body.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </div>
      </article>

      <section className="mx-auto max-w-[1280px] px-5 py-24 lg:px-8">
        <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold tracking-[-0.04em]">Keep reading</h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block">
                <BlogCover seed={p.seed} className="aspect-[16/10] rounded-[18px] border border-white/[0.08]" />
                <div className="mt-5 text-[16px] font-medium text-accent">{p.category}</div>
                <h3 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.02em] group-hover:text-accent">{p.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
