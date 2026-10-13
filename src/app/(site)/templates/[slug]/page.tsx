import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHead, SectionHead } from "@/site/heads";
import { ICON, SectionGlyph } from "@/site/icons";
import { kindOf, sectionOf, sectionShot, TEMPLATES, templateOf, viewUrl } from "@/site/live";
import { btn } from "@/site/sheet";
import { TemplatePreview } from "@/site/template-preview";

/*
 * Four pages to a row, two on smaller screens. A short last row shares the width between what's
 * in it, so the grid always ends square: one fills it, two take half each, three a third.
 */
const SM: Record<number, string> = { 6: "sm:col-span-6", 12: "sm:col-span-12" };
const LG: Record<number, string> = { 3: "lg:col-span-3", 4: "lg:col-span-4", 6: "lg:col-span-6", 12: "lg:col-span-12" };
function span(i: number, n: number) {
  const odd = n % 2 === 1 && i === n - 1;
  const left = n % 4;
  const last = left > 0 && i >= n - left;
  return `${SM[odd ? 12 : 6]} ${LG[last ? 12 / left : 3]}`;
}

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const t = templateOf((await params).slug);
  return t ? { title: `${t.name} template`, description: t.description } : {};
}

/*
 * Every template's page is prerendered from generateStaticParams. Reading the slug inside a
 * Suspense boundary keeps the route's shell instant for any other address too.
 */
export default function TemplatePage({ params }: PageProps<"/templates/[slug]">) {
  return (
    <Suspense fallback={<main id="main" className="min-h-[80vh]" />}>
      <Template params={params} />
    </Suspense>
  );
}

async function Template({ params }: { params: PageProps<"/templates/[slug]">["params"] }) {
  const t = templateOf((await params).slug);
  if (!t) notFound();
  const free = t.price === "free";
  // The home page's sections in order, each once.
  const home = [...new Set(t.home)].map((id) => sectionOf(t.slug, id)!).filter(Boolean);
  const facts = [t.category, `${t.pages.length} pages`, `${t.sections.length} sections`, "Next.js 16, React 19, Tailwind 4"];
  return (
    <main id="main">
      <PageHead
        back={{ href: "/templates", label: "Templates" }}
        title={t.name}
        lead={t.description}
        actions={
          <>
            <Link href={`/studio?template=${t.slug}`} className={btn.quiet}>
              <ICON.studio size={16} weight="duotone" /> Open in Studio
            </Link>
            <Link href={free && t.repo ? t.repo : `/checkout?product=${t.slug}`} prefetch={false} className={btn.ink}>
              <ICON.pro size={16} weight="duotone" />
              {free ? "Get it on GitHub" : `Buy for $${t.price}`}
            </Link>
          </>
        }
      >
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {facts.map((f) => (
            <li key={f} className="rounded-[6px] bg-fg/[0.05] px-2.5 py-1 text-meta text-muted">
              {f}
            </li>
          ))}
        </ul>
      </PageHead>

      <div className="bd-reveal overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface-2 p-3 shadow-[0_0_0_1px_var(--bd-line)]">
        <TemplatePreview slug={t.slug} />
      </div>

      <section className="mt-20" aria-labelledby="pages-title">
        <SectionHead id="pages-title" title={`All ${t.pages.length} pages, included`} lead="Every one is in the download and opens in Studio. Open any of them live." />
        <ul className="bd-reveal grid gap-px overflow-hidden rounded-[var(--bd-r-sheet)] bg-line shadow-[0_0_0_1px_var(--bd-line)] sm:grid-cols-12">
          {t.pages.map((p, i) => (
            <li key={p.path} className={`bg-surface ${span(i, t.pages.length)}`}>
              <a href={viewUrl(t.slug, p.path)} target="_blank" rel="noreferrer" className="group flex h-full items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-fg/[0.03]">
                <span className="min-w-0">
                  <span className="block truncate text-ui font-medium">{p.label}</span>
                  <span className="block truncate font-mono text-[12px] text-subtle">{p.path}</span>
                </span>
                <ArrowUpRightIcon size={14} className="shrink-0 text-subtle transition-colors group-hover:text-fg" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="sections-title">
        <SectionHead id="sections-title" title="On the home page" lead={`${home.length} sections, in order. Each one also works on its own, on any page you build.`} />
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
          {home.map((s) => (
            <li key={s.id} className="bd-reveal">
              <Link href={`/components/${s.kind}#${s.template}-${s.id}`} className="group block">
                <span className="relative block aspect-[16/10] overflow-hidden rounded-[8px] bg-surface shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
                  <Image src={sectionShot(s)} alt="" fill sizes="(min-width: 768px) 240px, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </span>
                {/* The kind sits under the section's name, not under its icon. */}
                <span className="mt-2 flex gap-1.5 px-0.5 text-ui">
                  <SectionGlyph kind={s.kind} className="mt-[calc((1lh_-_15px)/2)] shrink-0 text-subtle" />
                  <span className="min-w-0">
                    <span className="block truncate text-ui font-medium">{s.name}</span>
                    <span className="block truncate text-meta text-subtle">{kindOf(s.kind).label}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
