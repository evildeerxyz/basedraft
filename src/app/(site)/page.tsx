import { ArrowRightIcon, TagIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { FaqSheet, PricingSheet } from "@/site/blocks";
import { Exits } from "@/site/exits";
import { SectionHead } from "@/site/heads";
import { ICON } from "@/site/icons";
import { LiveShowcase } from "@/site/live-showcase";
import { Note } from "@/site/plan-parts";
import { btn } from "@/site/sheet";
import { TEMPLATES, templateShot } from "@/site/live";
import { StudioStage } from "@/site/studio-stage";

/*
 * The home page tells one story, in order: these are finished websites (here they are, running),
 * you make one yours in Studio, then it goes to Figma, your machine or GitHub. Then which sites,
 * what it costs, and the questions people ask.
 */

const more = (href: string, label: string) => (
  <Link href={href} className={btn.link}>
    {label} <ArrowRightIcon size={13} weight="bold" />
  </Link>
);

export default function Overview() {
  return (
    <main id="main">
      <header className="bd-reveal px-1 pb-10 pt-12 md:pb-12 md:pt-20">
        <h1 className="max-w-[720px] text-balance text-display">Start from a finished website, not a blank page.</h1>
        <p className="mt-5 max-w-[600px] text-lead text-muted">
          {TEMPLATES.length} complete Next.js sites, every page included. Make one yours in Studio, then paste it into Figma as real layers or send the code to GitHub.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link href="/studio" className={btn.ink}>
            <ICON.studio size={16} weight="duotone" /> Open Studio, free
          </Link>
          <Link href="/templates" className={btn.quiet}>
            See the templates
          </Link>
        </div>
        <Note icon={TagIcon} className="mt-4 text-ui text-muted">
          Free to start. Pro is $149 once, with every update after that.
        </Note>
      </header>

      <LiveShowcase />

      <section className="mt-16 md:mt-24" aria-labelledby="studio-title">
        <SectionHead id="studio-title" title="Make it yours, right on the page" lead="Studio opens the real site at every breakpoint. Rearrange its sections and rewrite its words where they stand, the way you would in a design tool." action={more("/studio", "Open Studio")} />
        <StudioStage />
      </section>

      <section className="mt-16 md:mt-24" aria-labelledby="exits-title">
        <SectionHead id="exits-title" title="Then take it wherever you work" lead="The same site, as layers, as files or as a repository. Nothing to rebuild on the other side." />
        <Exits />
      </section>

      <section className="mt-16 md:mt-24" aria-labelledby="templates-title">
        <SectionHead id="templates-title" title="Whole sites, not just landing pages" lead="Pricing, security, status and blog pages come with every one, and the rest of what its product needs." action={more("/templates", "All templates")} />
        <ul className="grid gap-3 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <li key={t.slug} className="bd-reveal">
              <Link href={`/templates/${t.slug}`} className="group block overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)] transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.16),0_18px_40px_-24px_rgb(var(--bd-shade)/0.35)]">
                <span className="relative block aspect-[16/10] overflow-hidden border-b border-line bg-surface-2">
                  <Image src={templateShot(t.slug)} alt="" fill sizes="(min-width: 768px) 340px, 100vw" className="object-cover object-top transition-transform duration-700 ease-[var(--bd-ease)] group-hover:scale-[1.03]" />
                </span>
                <span className="block p-5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-heading">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                      {t.name}
                    </span>
                    <span className="text-ui tabular-nums text-muted">{t.price === "free" ? "Free" : `$${t.price}`}</span>
                  </span>
                  <span className="mt-1.5 block text-body text-muted">{t.tagline}</span>
                  <span className="mt-4 block text-meta text-subtle">
                    {t.category}, {t.pages.length} pages, {t.sections.length} sections
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 md:mt-24" aria-labelledby="pricing-head">
        <SectionHead id="pricing-head" title="Pay once, keep every update" lead="Try any template in Studio for free. Buy one for $79, or get every template, section and export with Pro." action={more("/pro#license", "Compare licenses")} />
        <PricingSheet bare />
      </section>

      <section className="mt-16 md:mt-24" aria-labelledby="faq-head">
        <SectionHead id="faq-head" title="Questions" lead={<>Something else? Write to <a href="mailto:hello@basedraft.site" className="text-fg underline-offset-2 hover:underline">hello@basedraft.site</a>.</>} />
        <FaqSheet bare />
      </section>
    </main>
  );
}
