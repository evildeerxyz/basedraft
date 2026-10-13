import { notFound } from "next/navigation";
import { POSTS, getPost } from "@/lib/content/blog";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "A post from the Auren blog";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return ogImage({
    eyebrow: `Blog / ${post.date}`,
    title: post.title,
    subtitle: `${post.author} · ${post.readTime}`,
    art: post.art,
  });
}
