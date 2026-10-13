import type { Post } from "@/lib/content/blog";
import { DitherArt } from "../ui/dither-art";
import { SmartLink } from "../ui/smart-link";

export function PostCard({ post }: { post: Post }) {
  return (
    <SmartLink href={`/blog/${post.slug}`} prefetch className="group block">
      <div className="overflow-hidden rounded-[8px]">
        <DitherArt
          variant={post.art.variant}
          seed={post.art.seed}
          cols={56}
          rows={35}
          className="aspect-[16/10] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-5 font-mono text-[12px] text-ink/50">
        {post.date} · {post.readTime}
      </div>
      <h3 className="type-title mt-2 text-[23px] leading-[1.1] transition-colors group-hover:text-ink/70">{post.title}</h3>
      <p className="mt-2.5 text-[15px] leading-[1.55] text-ink/55">{post.excerpt}</p>
    </SmartLink>
  );
}
