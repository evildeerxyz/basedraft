import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/site/blocks";
import { PageHero } from "@/components/site/page-hero";
import { Toc } from "@/components/site/toc";
import { SmartLink } from "@/components/ui/smart-link";
import { LEGAL } from "@/lib/content/company";
import { headings } from "@/lib/content/types";
import { pageMeta } from "@/lib/metadata";
import { cn } from "@/lib/site";

type Props = PageProps<"/legal/[slug]">;

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = LEGAL[(await params).slug];
  return doc ? pageMeta(doc.title, `${doc.title} for Auren. Last updated ${doc.updated}.`) : {};
}

export default function LegalPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-ink" />}>
      <LegalContent params={params} />
    </Suspense>
  );
}

async function LegalContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const doc = LEGAL[slug];
  if (!doc) notFound();

  return (
    <>
      <PageHero
        index="Legal"
        label={doc.title}
        title={[doc.title]}
        intro={`Last updated ${doc.updated}. Questions go to legal@auren.dev, and a person reads every one.`}
        figure={false}
      />
      <section className="bg-paper pb-28 pt-8 text-ink">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="space-y-10 lg:sticky lg:top-24">
              <nav aria-label="Legal documents">
                <div className="type-label text-ink/45">Documents</div>
                <ul className="mt-4 space-y-1">
                  {Object.entries(LEGAL).map(([key, d]) => (
                    <li key={key}>
                      <SmartLink
                        href={`/legal/${key}`}
                        prefetch
                        aria-current={key === slug ? "page" : undefined}
                        className={cn(
                          "block rounded-[6px] px-2 py-1.5 text-[14px] transition-colors",
                          key === slug ? "bg-ink/[0.06] text-ink" : "text-ink/55 hover:text-ink",
                        )}
                      >
                        {d.title}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="hidden lg:block">
                <Toc items={headings(doc.blocks)} />
              </div>
            </div>
          </aside>
          <Blocks blocks={doc.blocks} className="max-w-[720px] lg:col-span-8 lg:col-start-5" />
        </div>
      </section>
    </>
  );
}
