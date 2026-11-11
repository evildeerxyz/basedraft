import { ArrowUpRightIcon, ChartBarIcon, PenNibIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SECTIONS, TEMPLATES, templateShot, viewUrl } from "@/site/live";
import { wrap } from "@/site/sheet";
import { TextLink } from "@/site/showcase";
import { GLOW, glowAt } from "@/site/stage";
import { TemplateLogo } from "@/site/template-parts";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("templates", { title: "Templates", description: "Finished sites in Next.js and Astro, each with every page a real product needs." });

/* Small pills that sit over a card's link, so they go somewhere of their own. */
const PILL = "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-paper/70 px-3 text-meta font-medium text-paper-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_9%,transparent)] backdrop-blur transition-colors hover:bg-paper";

/*
 * Every template as a card in the hero's light: its logo, name and price, a line on it, then its
 * home page rising from the card's foot, lifting a little under the pointer. The whole card opens
 * the template; two pills go straight to it full screen or in Studio. Dashboards come next.
 */
export default function TemplatesPage() {
  const pages = TEMPLATES.reduce((n, t) => n + t.pages.length, 0);
  const stats = [
    { label: "Templates", value: TEMPLATES.length },
    { label: "Pages", value: pages },
    { label: "Sections", value: SECTIONS.length },
  ];
  return (
    <main id="main" className={cn(wrap, "pb-24 pt-12 sm:pt-16")}>
      <header className="bd-reveal flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
        <div className="max-w-[600px]">
          <h1 className="text-display">Templates</h1>
          <p className="mt-5 text-pretty text-lead text-muted">Finished sites, every page written and wired, in Next.js and Astro. Open one live, make it yours in Studio, then take the code.</p>
        </div>
        <dl className="flex gap-8 pb-1">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-[36px] leading-none">{s.value}</dd>
              <dt className="mt-2 text-meta text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <ul data-reveal-stagger className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {TEMPLATES.map((t, i) => (
          <li key={t.slug} className="min-w-0">
            <article className={cn("bd-panel group relative isolate flex h-full flex-col overflow-hidden rounded-[var(--bd-r-stage)]", GLOW[glowAt(i)])}>
              <div className="flex items-start gap-4 p-6 sm:p-7">
                <TemplateLogo slug={t.slug} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2.5 text-title">
                    {/* The name is the card's link: it stretches over the whole card. */}
                    <Link href={`/templates/${t.slug}`} className="after:absolute after:inset-0 after:z-0 after:rounded-[inherit] focus-visible:outline-none">
                      {t.name}
                    </Link>
                  </h2>
                  <p className="mt-1.5 text-pretty text-ui text-paper-muted">{t.tagline}</p>
                </div>
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-paper/70 text-paper-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_9%,transparent)] backdrop-blur transition-[background-color,color,translate] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-paper-ink group-hover:text-paper">
                  <ArrowUpRightIcon weight="regular" size={15} />
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 sm:px-7">
                <p className="text-meta text-paper-muted">
                  {t.category} · {t.pages.length} pages · {t.sections.length} sections
                </p>
                <div className="flex gap-1.5">
                  <a href={viewUrl(t.slug)} target="_blank" rel="noreferrer" className={PILL}>
                    Full screen <ArrowUpRightIcon weight="regular" size={11} />
                  </a>
                  <Link href={`/studio?template=${t.slug}`} className={PILL}>
                    <PenNibIcon weight="duotone" size={13} /> Studio
                  </Link>
                </div>
              </div>
              {/* The home page, set in from the sides and running off the card's foot. */}
              <div className="relative mt-6 px-6 sm:px-7">
                <span className="relative -mb-10 block aspect-[16/10] translate-y-2 overflow-hidden rounded-t-[14px] border border-b-0 border-line bg-white shadow-[var(--bd-shadow-float)] transition-transform duration-700 ease-[var(--bd-ease)] group-hover:-translate-y-1">
                  <Image src={templateShot(t.slug)} alt="" fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover object-top" />
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {/* What's next: dashboards, drawn as a wireframe rather than shown as something that exists. */}
      <section aria-labelledby="dashboards-title" className="bd-reveal mt-4 grid items-center gap-10 overflow-hidden rounded-[var(--bd-r-stage)] border border-dashed border-line-strong bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <span className="grid size-11 place-items-center rounded-[14px] bg-brand-soft text-brand-ink">
            <ChartBarIcon weight="duotone" size={22} />
          </span>
          <h2 id="dashboards-title" className="mt-6 text-headline">
            Dashboards are next
          </h2>
          <p className="mt-4 max-w-[440px] text-pretty text-body text-muted">Admin and analytics dashboards, made the way the sites are: every screen finished, in Next.js and Astro, and yours to rework in Studio. Pro includes them as they ship.</p>
          <div className="mt-6">
            <TextLink href="/whats-new">Follow what&apos;s new</TextLink>
          </div>
        </div>
        <DashboardSketch />
      </section>
    </main>
  );
}

/** A dashboard as a wireframe: a sidebar, three figures, a chart and a table, all in placeholder shapes. */
function DashboardSketch() {
  const bars = [38, 52, 44, 66, 58, 74, 62, 81, 70, 88, 76, 92];
  return (
    <div aria-hidden className="bd-light bd-paper glow-b rounded-[24px] p-2">
      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 rounded-[18px] bg-paper/70 p-2 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_7%,transparent)] backdrop-blur sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="grid content-start gap-2 rounded-[12px] bg-paper-ink/[0.04] p-3">
          <span className="mb-2 h-3 w-12 rounded-full bg-paper-ink/20" />
          {[70, 56, 64, 48, 60].map((w, i) => (
            <span key={i} className={cn("h-2 rounded-full", i === 1 ? "bg-brand/50" : "bg-paper-ink/10")} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="grid gap-2">
          <div className="grid grid-cols-3 gap-2">
            {["w-10", "w-12", "w-8"].map((w, i) => (
              <div key={i} className="rounded-[12px] bg-surface p-3 shadow-[var(--bd-shadow-resting)]">
                <span className="block h-1.5 w-8 rounded-full bg-paper-ink/10" />
                <span className={cn("mt-2.5 block h-3.5 rounded-full bg-paper-ink/25", w)} />
              </div>
            ))}
          </div>
          <div className="flex h-28 items-end gap-1.5 rounded-[12px] bg-surface p-3 shadow-[var(--bd-shadow-resting)] sm:h-32">
            {bars.map((h, i) => (
              <span key={i} className={cn("flex-1 rounded-t-[4px]", i === bars.length - 1 ? "bg-brand/70" : "bg-brand-soft")} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="grid gap-1.5 rounded-[12px] bg-surface p-3 shadow-[var(--bd-shadow-resting)]">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3">
                <span className="size-4 rounded-full bg-paper-ink/10" />
                <span className="h-2 flex-1 rounded-full bg-paper-ink/10" />
                <span className="h-2 w-10 rounded-full bg-paper-ink/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
