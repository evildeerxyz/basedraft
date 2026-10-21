import { ArrowRightIcon, ArrowUpRightIcon, LayoutIcon, SquaresFourIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { FaqSheet, PricingSheet } from "@/site/blocks";
import { DotField } from "@/site/dot-field";
import { ExportScene } from "@/site/export-scene";
import { isFree, kindOf, SECTIONS, sectionShot, TEMPLATES, templateLogo, templateShot, type LiveSection } from "@/site/live";
import { HeroInstall } from "@/site/hero-install";
import { LiveShowcase } from "@/site/live-showcase";
import { btnLg, ProBadge, wrap } from "@/site/sheet";
import { SectionHeading, TextLink } from "@/site/showcase";
import { ShellLine } from "@/site/shell-line";
import { GLOW, glowAt, onStage, type Glow } from "@/site/stage";
import { StudioStage } from "@/site/studio-stage";
import { cn } from "@/lib/utils";
import { installCommand, themeCommand } from "@/registry";
import type { CSSProperties } from "react";

/*
 * The home page tells one story, in order: these are finished websites (here they are, running),
 * every section in them works on its own, you make one yours in Studio, then it goes to Figma,
 * your machine or GitHub. Then which sites, what it costs and the questions people ask; the footer
 * holds the way in.
 */

/* The hero's dots: faint, clear across the middle where the words sit, only along the far edges. */
const HERO_FADE = "radial-gradient(72% 66% at 50% 50%, transparent 58%, rgb(0 0 0 / 0.35) 84%, #000 100%)";
/* Two slow flickers in the top corners, not six. */
const HERO_PATCHES = [
  { x: 0.05, top: 30, size: 200, every: 9.5, delay: -2.4 },
  { x: 0.95, top: 50, size: 200, every: 11, delay: -6.1 },
];

const titleOf = (s: LiveSection) => `${TEMPLATES.find((t) => t.slug === s.template)!.name} ${s.name.toLowerCase()}`;

/* The sections worth showing in the moving rows: every one but the bars, footers and dividers, which read as thin strips. */
const SHOWN = SECTIONS.filter((s) => !["nav", "footer", "divider", "logos"].includes(s.kind));

/** One section as a card in a moving row: its screenshot on a frame in the hero's light, its name, and what kind it is. */
function SectionCard({ s, hidden, glow }: { s: LiveSection; hidden: boolean; glow: Glow }) {
  const t = TEMPLATES.find((x) => x.slug === s.template)!;
  return (
    <li aria-hidden={hidden || undefined} className="w-[300px] shrink-0 pr-4 sm:w-[380px]">
      <Link href={`/blocks/${s.kind}#${s.template}-${s.id}`} tabIndex={hidden ? -1 : undefined} className={cn("bd-panel group block rounded-[24px] p-2", GLOW[glow])}>
        <span className={cn(onStage, "relative block aspect-[16/10]")}>
          <Image src={sectionShot(s)} alt="" fill sizes="380px" className="object-cover object-top transition-transform duration-700 ease-[var(--bd-ease)] group-hover:scale-[1.04]" />
        </span>
        <span className="flex items-center gap-2 px-2 pb-1.5 pt-3 text-ui">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={templateLogo(t.slug)} alt="" width={18} height={18} className="size-[18px] shrink-0 rounded-[5px]" />
          <span className="truncate font-medium">{titleOf(s)}</span>
          {!isFree(s) && <ProBadge />}
          <span className="ml-auto shrink-0 text-meta text-paper-muted">{kindOf(s.kind).label}</span>
        </span>
      </Link>
    </li>
  );
}

/** A row of sections moving slowly across the page, the other way to the row above, still while the pointer rests on it. */
function SectionRow({ items, reverse, seconds }: { items: LiveSection[]; reverse?: boolean; seconds: number }) {
  return (
    <div className="bd-marquee-pause overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
      <ul className={cn("bd-marquee flex w-max py-1", reverse && "bd-marquee-reverse")} style={{ "--duration": `${seconds}s` } as CSSProperties}>
        {[...items, ...items].map((s, i) => (
          <SectionCard key={`${s.key}-${i}`} s={s} hidden={i >= items.length} glow={glowAt(i)} />
        ))}
      </ul>
    </div>
  );
}

/* The number of templates as a word, for a heading. Only released templates count, so production says three while pello waits. */
const COUNT: Record<number, string> = { 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight" };

/* What Claude Code can run to put basedraft into a project, colored as a terminal colors it. */
const AGENT_LINES = ["curl -fsSL https://basedraft.site/llms.txt", themeCommand, installCommand("switch")];

export default function Overview() {
  return (
    <main id="main">
      {/* The hero: lit in draft blue, lilac and mint, dots around its edges, and the promise in the middle. */}
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Light paper in both modes, the way the footer is. */}
        <section aria-labelledby="hero-title" className="bd-light bd-paper relative isolate flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-[32px] px-5 py-20 text-center md:min-h-[640px] md:py-24">
          <DotField fade={HERO_FADE} layers={1} patches={HERO_PATCHES} className="opacity-50" />
          {/* What's here, in one frosted pill: the templates, the sections, and Pro. */}
          <nav aria-label="What's in basedraft" className="bd-reveal mb-8 flex h-9 items-center rounded-full bg-paper/70 p-1 text-meta text-paper-muted shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_10%,transparent),var(--bd-shadow-resting)] backdrop-blur">
            <Link href="/templates" className="flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-paper-ink/[0.05] hover:text-paper-ink">
              <LayoutIcon size={14} weight="duotone" /> <span className="font-medium text-paper-ink">{TEMPLATES.length}</span> templates
            </Link>
            <span aria-hidden className="h-4 w-px bg-paper-ink/10" />
            <Link href="/blocks" className="flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-paper-ink/[0.05] hover:text-paper-ink">
              <SquaresFourIcon size={14} weight="duotone" /> <span className="font-medium text-paper-ink">{SECTIONS.length}</span> sections
            </Link>
            <span aria-hidden className="h-4 w-px bg-paper-ink/10 max-sm:hidden" />
            <Link href="/pro" className="group flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-paper-ink/[0.05] hover:text-paper-ink max-sm:hidden">
              <ProBadge /> $149 once
              <ArrowRightIcon weight="regular" size={11} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </nav>
          {/* The promise: the finished website under a light blue highlighter stroke, the blank page set back in gray. */}
          <h1 id="hero-title" className="bd-reveal max-w-[1040px] text-balance text-display">
            Start from a <span className="whitespace-nowrap bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--bd-brand)_22%,transparent)_62%,color-mix(in_oklab,var(--bd-brand)_22%,transparent)_90%,transparent_90%)] [box-decoration-break:clone]">finished website</span>, <span className="text-paper-ink/40">not a blank page.</span>
          </h1>
          <p className="bd-reveal mt-6 max-w-[560px] text-pretty text-lead text-paper-muted">
            {TEMPLATES.length} complete sites and their {SECTIONS.length} sections, in Next.js and Astro. Make one yours in Studio, then take it to Figma or GitHub.
          </p>
          <div className="bd-reveal mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/studio" className={btnLg.onPaper}>
              Open Studio, free <ArrowRightIcon weight="regular" size={15} />
            </Link>
            <Link href="/templates" className={btnLg.onPaperOutline}>
              See the templates
            </Link>
          </div>
          {/* The command is for a desk, not a phone. */}
          <div className="bd-reveal flex w-full justify-center max-sm:hidden">
            <HeroInstall />
          </div>
        </section>
      </div>

      <section className={cn(wrap, "mt-28 md:mt-36")} aria-labelledby="live-title">
        <SectionHeading id="live-title" title="The real sites, running" lead="Pick one and it runs right here, at desktop, tablet or phone width, its links and motion and all. Nothing below is a screenshot." action={<TextLink href="/templates">Browse all {TEMPLATES.length} templates</TextLink>} />
        <LiveShowcase />
      </section>

      <section className="mt-28 md:mt-36" aria-labelledby="sections-title">
        <div className={wrap}>
          <SectionHeading id="sections-title" title="Take any section on its own" lead={`Each of the ${SECTIONS.length} sections is a part of a finished template. Open one to see it live at any width, with its code.`} action={<TextLink href="/blocks">Browse all {SECTIONS.length} blocks</TextLink>} />
        </div>
        <div className="bd-reveal space-y-4">
          <SectionRow items={SHOWN.filter((_, i) => i % 2 === 0)} seconds={SHOWN.length * 4} />
          <div className="max-sm:hidden">
            <SectionRow items={SHOWN.filter((_, i) => i % 2 === 1)} seconds={SHOWN.length * 4.6} reverse />
          </div>
        </div>
      </section>

      <section className={cn(wrap, "mt-28 md:mt-36")} aria-label="Studio">
        <StudioStage />
      </section>

      {/* Where it goes next: the words on the left, the three ways out on the right. */}
      <section className={cn(wrap, "mt-28 grid items-center gap-x-20 gap-y-12 md:mt-36 lg:grid-cols-[minmax(0,1fr)_620px]")} aria-labelledby="export-title">
        <div className="bd-reveal">
          <h2 id="export-title" className="max-w-[560px] text-balance text-headline">
            Then take it wherever you work
          </h2>
          <p className="mb-7 mt-5 max-w-[440px] text-body text-muted">The same site, as layers in Figma, as files on your machine or as a repository on GitHub. Nothing to rebuild on the other side.</p>
          <TextLink href="/pro">What comes with Pro</TextLink>
        </div>
        <div className="bd-reveal">
          <ExportScene />
        </div>
      </section>

      {/* Ready for an AI agent: the free components and the guide it reads, one command each. */}
      <section className={cn(wrap, "mt-28 grid grid-cols-[minmax(0,1fr)] items-center gap-x-20 gap-y-12 md:mt-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]")} aria-labelledby="agent-title">
        <div className="bd-reveal">
          <h2 id="agent-title" className="max-w-[560px] text-balance text-headline">
            Ready for Claude Code
          </h2>
          <p className="mb-7 mt-5 max-w-[460px] text-body text-muted">Every component is one file to download, sharing one theme, and basedraft&apos;s guide for agents lives at /llms.txt. Each template comes with a prompt that sets it up for you.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <TextLink href="/components">Browse the components</TextLink>
            <TextLink href="/llms.txt" up>
              Read llms.txt
            </TextLink>
          </div>
        </div>
        <div className="bd-reveal bd-paper glow-d rounded-[var(--bd-r-stage)] p-2 max-sm:hidden sm:p-3">
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--bd-shadow-raised)]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span key={d} aria-hidden className="size-2.5 rounded-full bg-fg/15" />
              ))}
              <span className="ml-2 text-meta text-subtle">Terminal</span>
            </div>
            <div className="space-y-3 overflow-x-auto px-5 py-5 no-scrollbar">
              {AGENT_LINES.map((l) => (
                <p key={l} className="whitespace-nowrap">
                  <ShellLine command={l} />
                </p>
              ))}
              <p className="whitespace-nowrap font-mono text-[13px] text-[var(--code-comment)]"># Then ask Claude Code to build with them.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(wrap, "mt-28 md:mt-36")} aria-labelledby="templates-title">
        <SectionHeading id="templates-title" title={`${COUNT[TEMPLATES.length] ?? TEMPLATES.length} sites, ${(COUNT[TEMPLATES.length] ?? String(TEMPLATES.length)).toLowerCase()} looks`} lead="Each one with its own brand, drawn from scratch. Pick the one closest to yours." action={<TextLink href="/templates">All templates</TextLink>} />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TEMPLATES.map((t, i) => (
            <li key={t.slug} className="bd-reveal min-w-0">
              <Link href={`/templates/${t.slug}`} aria-label={`${t.name} template`} className={cn("bd-panel group relative flex h-full flex-col overflow-hidden rounded-[var(--bd-r-stage)] px-6 pt-6 sm:px-8 sm:pt-8", GLOW[glowAt(i + 2)])}>
                <span className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={templateLogo(t.slug)} alt="" width={44} height={44} className="size-11 shrink-0 rounded-[12px] shadow-[var(--bd-shadow-resting)]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-[26px] leading-none">{t.name}</span>
                      <ProBadge>{t.price === "free" ? "Free" : `$${t.price}`}</ProBadge>
                    </span>
                    <span className="mt-2 block text-ui text-paper-muted">{t.tagline}</span>
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper/70 text-paper-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_10%,transparent)] backdrop-blur transition-colors group-hover:bg-paper-ink group-hover:text-paper">
                    <ArrowUpRightIcon weight="regular" size={15} />
                  </span>
                </span>
                <span className="mt-5 flex flex-wrap gap-2 text-meta text-paper-muted max-sm:hidden">
                  {[t.category, `${t.pages.length} pages`, `${t.sections.length} sections`, "Next.js and Astro"].map((f) => (
                    <span key={f} className="rounded-full bg-paper/60 px-2.5 py-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_8%,transparent)] backdrop-blur">
                      {f}
                    </span>
                  ))}
                </span>
                {/* The home page, rising a little out of the card's foot as you point at it. */}
                <span className="relative -mb-10 mt-8 block translate-y-2 overflow-hidden rounded-t-[16px] border border-b-0 border-line bg-white shadow-[var(--bd-shadow-float)] transition-transform duration-700 ease-[var(--bd-ease)] group-hover:translate-y-0">
                  <span className="relative block aspect-[16/10]">
                    <Image src={templateShot(t.slug)} alt="" fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover object-top" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={cn(wrap, "mt-28 md:mt-36")} aria-labelledby="pricing-title">
        <SectionHeading center id="pricing-title" title="Pay once, keep every update" lead="Try any template in Studio for free. Pro is every template, section and export, paid for once." />
        <PricingSheet />
        <div className="mt-6 flex justify-center">
          <TextLink href="/pro#license">Compare every plan</TextLink>
        </div>
      </section>

      <div className={wrap}>
        <FaqSheet id="faq" />
      </div>

    </main>
  );
}
