import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocArticle, DocSkeleton } from "@/components/site/doc-article";
import { DOCS, getDoc } from "@/lib/content/docs";
import { pageMeta } from "@/lib/metadata";

type Props = PageProps<"/docs/[slug]">;

export function generateStaticParams() {
  return DOCS.filter((d) => d.slug !== "introduction").map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getDoc((await params).slug);
  return doc ? pageMeta(`${doc.title} · Docs`, doc.description) : {};
}

export default function DocPage({ params }: Props) {
  return (
    <Suspense fallback={<DocSkeleton />}>
      <DocContent params={params} />
    </Suspense>
  );
}

async function DocContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  // the introduction lives at /docs
  if (!doc || slug === "introduction") notFound();
  return <DocArticle doc={doc} />;
}
