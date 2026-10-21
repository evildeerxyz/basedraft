import { ArrowLeftIcon, ArrowUpRightIcon, PenNibIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { isFree, kindOf, sectionOf, sectionShot, TEMPLATES, templateOf, viewUrl, type TemplateSlug } from "@/site/live";
import { btnLg, ProBadge, Tick, wrap } from "@/site/sheet";
import { TextLink } from "@/site/showcase";
import { Caption, onStage, Stage } from "@/site/stage";
import { TemplateBuy, TemplatePrice } from "@/site/template-buy";
import { TemplateLogo } from "@/site/template-parts";
import { TakeHome, TemplateLive } from "@/site/template-preview";
import { COLORS, SLOT_LABEL, SLOTS } from "@/site/theme";

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

/* The code it's written in. */
const STACK = ["Next.js 16", "Astro 7", "React 19", "Tailwind 4", "TypeScript"];

/** A part of the page: a title on the left, a short line on the right. */
function Head({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
      <h2 id={id} className="text-title">
        {title}
      </h2>
      {note && <p className="text-ui text-muted">{note}</p>}
    </div>
  );
}

/*
 * A template, top to bottom: what it is and the one thing to do about it, every page running
 * live, its home page section by section, its brand and what's in the download, and the ways to
 * take it home.
 */
async function Template({ params }: { params: PageProps<"/templates/[slug]">["params"] }) {
  const t = templateOf((await params).slug);
  if (!t) notFound();
  const slug = t.slug as TemplateSlug;
  const look = COLORS[slug];
  // The home page's sections in order, each once.
  const home = [...new Set(t.home)].map((id) => sectionOf(t.slug, id)!).filter(Boolean);
  const facts = [
    { label: "Pages", value: String(t.pages.length) },
    { label: "Sections", value: String(t.sections.length) },
    { label: "Code", value: "Next.js, Astro" },
    { label: "Modes", value: look.dark ? "Light, dark" : "Light" },
  ];
  const gets = [...t.highlights, `All ${t.pages.length} pages, each one wired and written`, `${t.sections.length} sections, each also on its own in the library`, "The same site in Next.js 16 and in Astro 7", "Every future update, on your Purchases page"];
  const others = TEMPLATES.filter((x) => x.slug !== t.slug);
  return (
    <main id="main">
      <div className={cn(wrap, "grid grid-cols-1 gap-24 pb-24 pt-6 sm:gap-28")}>
        <div className="grid gap-10">
          <Link href="/templates" className="bd-link inline-flex h-9 w-fit items-center gap-2 text-ui text-muted transition-colors hover:text-fg">
            <ArrowLeftIcon weight="regular" size={14} /> All templates
          </Link>

          {/* What it is, on the left; its numbers on a frosted card in the hero's light on the right. */}
          <section aria-labelledby="template-title" className="bd-reveal grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
            <div>
              <div className="flex items-center gap-3">
                <TemplateLogo slug={slug} size={52} />
                <ProBadge className="h-[22px] px-[9px] text-meta">
                  <TemplatePrice slug={slug} />
                </ProBadge>
              </div>
              <h1 id="template-title" className="mt-6 text-display">
                {t.name}
              </h1>
              <p className="mt-2 text-lead text-muted">{t.category}</p>
              <p className="mt-5 max-w-[560px] text-pretty text-body text-muted">{t.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TemplateBuy slug={slug} className={btnLg.ink} />
                <Link href={`/studio?template=${t.slug}`} className={btnLg.outline}>
                  <PenNibIcon weight="duotone" size={16} /> Open in Studio
                </Link>
                <a href={viewUrl(t.slug)} target="_blank" rel="noreferrer" className="bd-link ml-1 inline-flex items-center gap-2 text-ui transition-opacity hover:opacity-70">
                  Full screen <ArrowUpRightIcon weight="regular" size={14} />
                </a>
              </div>
            </div>
            <dl className="bd-paper glow-c grid grid-cols-2 gap-2 rounded-[var(--bd-r-stage)] p-2">
              {facts.map((f) => (
                <div key={f.label} className="rounded-[20px] bg-paper/65 px-5 py-4 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_7%,transparent)] backdrop-blur">
                  <dt className="text-meta text-paper-muted">{f.label}</dt>
                  <dd className="mt-1.5 font-display text-[21px] leading-none text-paper-ink sm:text-[26px]">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <TemplateLive slug={t.slug} />

        <section aria-labelledby="sections-title">
          <Head id="sections-title" title="Its home page, section by section" note={`${home.length} sections. Each one also works on its own, on any page you build.`} />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.map((s) => {
              const href = `/blocks/${s.kind}#${s.template}-${s.id}`;
              return (
                <li key={s.id} className="bd-reveal flex min-w-0 flex-col">
                  <Link href={href} aria-label={s.name} className="group flex flex-1">
                    <Stage quiet className="flex-1" inner="flex h-full items-center p-2 sm:p-3">
                      <span className={cn(onStage, "relative block aspect-[16/10] w-full")}>
                        <Image src={sectionShot(s)} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 ease-[var(--bd-ease)] group-hover:scale-[1.02]" />
                      </span>
                    </Stage>
                  </Link>
                  <Caption title={s.name} badge={!isFree(s) ? <ProBadge /> : undefined} note={kindOf(s.kind).label} href={href} />
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <TextLink href="/blocks">Every section in the library</TextLink>
          </div>
        </section>

        {/* Its brand, and what's in the download, side by side. */}
        <section aria-label={`${t.name}'s brand and what's in the download`} className="grid gap-4 lg:grid-cols-2">
          <div className="bd-reveal flex flex-col rounded-[var(--bd-r-stage)] border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-title">Brand</h2>
            <p className="mt-2 text-ui text-muted">The colors and type {t.name} is set in. Pick another palette in Studio.</p>
            {[{ label: look.dark ? "Light" : null, base: look.base }, ...(look.dark ? [{ label: "Dark", base: look.dark.base }] : [])].map((p) => (
              <div key={p.label ?? "base"} className="mt-6">
                {p.label && <p className="mb-2.5 text-meta text-subtle">{p.label}</p>}
                <ul className="grid grid-cols-4 gap-2">
                  {SLOTS.map((slot) => (
                    <li key={slot}>
                      <span className="block h-16 rounded-[14px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_9%,transparent)]" style={{ background: p.base[slot] }} />
                      <span className="mt-2 block text-meta">{SLOT_LABEL[slot]}</span>
                      <code className="block font-mono text-[11.5px] uppercase text-[var(--code-string)]">{p.base[slot]}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <span className="text-meta text-subtle">Type</span>
                <span className="text-ui font-medium">{look.font.label}</span>
              </div>
            </div>
          </div>
          <div className="bd-reveal flex flex-col rounded-[var(--bd-r-stage)] border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-title">In the download</h2>
            <ul className="mt-6 space-y-3">
              {gets.map((g) => (
                <li key={g} className="flex gap-3 text-ui leading-[1.55] text-muted">
                  <Tick className="mt-[3px]" />
                  {g}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <ul className="flex flex-wrap gap-1.5 border-t border-line pt-5">
                {[...STACK, look.font.label].map((s) => (
                  <li key={s} className="rounded-full bg-surface-2 px-3 py-1.5 text-meta text-muted">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* The ways to take it home, as tabs, beside the price and the one thing to do. */}
        <section aria-labelledby="take-title" className="bd-paper glow-d grid grid-cols-1 items-start gap-8 rounded-[var(--bd-r-stage)] p-6 sm:p-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:p-12">
          <div>
            <TemplateLogo slug={slug} size={44} />
            <h2 id="take-title" className="mt-5 text-headline">
              Take {t.name} home
            </h2>
            <p className="mt-4 text-pretty text-ui leading-[1.65] text-paper-muted">The whole site, every page, in Next.js or Astro, with every update after today.</p>
            <p className="mt-7 flex items-baseline gap-2">
              <TemplatePrice slug={slug} className="font-display text-[44px] leading-none text-paper-ink" />
              <span className="text-ui text-paper-muted">{t.price === "free" ? "" : "once"}</span>
            </p>
            <p className="mt-2 text-meta text-paper-muted">
              Or every template with{" "}
              <Link href="/pro" className="font-medium text-paper-ink underline decoration-paper-ink/25 underline-offset-4 hover:decoration-paper-ink">
                Pro
              </Link>
              , $149 once.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <TemplateBuy slug={slug} className={btnLg.ink} />
              <Link href={`/studio?template=${t.slug}`} className={btnLg.onPaperOutline}>
                Make it yours first
              </Link>
            </div>
          </div>
          <TakeHome slug={t.slug} />
        </section>

        {/* The other templates, as a quiet row to move on to. */}
        <section aria-labelledby="others-title">
          <Head id="others-title" title="The other templates" />
          <ul className="grid gap-2 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/templates/${o.slug}`} className="group flex items-center gap-3.5 rounded-[20px] border border-line bg-surface p-3.5 pr-4 transition-colors hover:bg-surface-2">
                  <TemplateLogo slug={o.slug} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ui font-medium">{o.name}</span>
                    <span className="block truncate text-meta text-muted">{o.category}</span>
                  </span>
                  <ArrowUpRightIcon weight="regular" size={14} className="shrink-0 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
