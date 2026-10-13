import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TEMPLATES, templateOf, type TemplateSlug } from "@/site/live";
import { TemplateView } from "@/site/template-view";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/view/[slug]">): Promise<Metadata> {
  const t = templateOf((await params).slug);
  return t ? { title: `${t.name} live preview`, description: t.description } : {};
}

/* A template full window, with a card to buy it or open it in Studio. The page it opens on is in the address. */
export default function ViewPage({ params }: PageProps<"/view/[slug]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-canvas" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: PageProps<"/view/[slug]">["params"] }) {
  const t = templateOf((await params).slug);
  if (!t) notFound();
  return <TemplateView slug={t.slug as TemplateSlug} />;
}
