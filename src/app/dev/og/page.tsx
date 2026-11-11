import { AppWindowIcon, PenNibIcon, SparkleIcon, SquaresFourIcon, StackIcon } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { COMPONENTS } from "@/registry";
import { SCREENS } from "@/screens";
import { SECTION_ICON } from "@/site/icons";
import { KINDS, RELEASED_TEMPLATES, templateLogo } from "@/site/live";
import { BaseDraftMark } from "@/site/logo";
import { GLOW, glowAt, type Glow } from "@/site/stage";
import { OgComponentIcon } from "./demo";

/*
 * Every page's share card, 1200 by 630, one under the next: scripts/og.mjs saves each one to
 * public/og/<key>.jpg, and src/site/og.ts points the page at it. All of them the same calm card in
 * the hero's light: a small tile with the page's icon or logo, its name large and centered, one
 * line under it, and the address at the foot. Only released templates are drawn. Development only.
 */

/** One card. */
function Card({ k, glow = "a", tile, title, lead, path }: { k: string; glow?: Glow; tile?: ReactNode; title: ReactNode; lead: ReactNode; path: string }) {
  return (
    <section data-og={k} className={cn("bd-light bd-paper relative isolate flex h-[630px] w-[1200px] shrink-0 flex-col items-center overflow-hidden px-24 text-center", GLOW[glow])}>
      <div className="flex items-center gap-3 pt-16 text-paper-ink">
        <BaseDraftMark size={36} />
        <span className="text-[26px] font-medium leading-none tracking-[-0.035em]">basedraft</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center pb-6">
        {tile && <span className="mb-9 grid size-[92px] place-items-center rounded-[26px] bg-white text-paper-ink shadow-[0_18px_40px_-18px_rgb(20_22_30/0.3),0_0_0_1px_rgb(20_22_30/0.06)]">{tile}</span>}
        <h1 className="max-w-[960px] text-balance font-display text-[88px] font-medium leading-[0.98] tracking-[-0.05em] text-paper-ink">{title}</h1>
        <p className="mt-6 max-w-[780px] text-balance text-[28px] leading-[1.35] text-paper-muted">{lead}</p>
      </div>
      <p className="pb-14 text-[20px] text-paper-muted">basedraft.site{path === "/" ? "" : path}</p>
    </section>
  );
}

/** A template's logo, filling its tile. */
const Logo = ({ slug }: { slug: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={templateLogo(slug)} alt="" className="size-[92px] rounded-[26px]" />
);

export default function ShareCards() {
  if (process.env.NODE_ENV === "production") notFound();
  // Read here rather than when the module loads, so the data modules have all settled first.
  const SECTIONS = RELEASED_TEMPLATES.flatMap((t) => t.sections);
  const used = KINDS.filter((k) => SECTIONS.some((s) => s.kind === k.id));
  return (
    <main className="flex flex-col items-start gap-10 bg-[#888] p-10">
      <Card k="home" title="Start from a finished website" lead={`${RELEASED_TEMPLATES.length} complete sites and every section in them, in Next.js and Astro.`} path="/" />
      <Card k="templates" glow="b" tile={<StackIcon size={44} weight="duotone" />} title="Templates" lead="Finished sites, every page written and wired." path="/templates" />
      {RELEASED_TEMPLATES.map((t, i) => (
        <Card key={t.slug} k={`template-${t.slug}`} glow={glowAt(i + 1)} tile={<Logo slug={t.slug} />} title={t.name} lead={t.tagline} path={`/templates/${t.slug}`} />
      ))}
      <Card k="components" glow="c" tile={<SquaresFourIcon size={44} weight="duotone" />} title="Components that move well" lead="Our own React components, one file each, free." path="/components" />
      {COMPONENTS.map((c, i) => (
        <Card key={c.name} k={`component-${c.name}`} glow={glowAt(i)} tile={<OgComponentIcon name={c.name} />} title={c.title} lead={c.description} path={`/components/${c.name}`} />
      ))}
      <Card k="screens" glow="b" tile={<AppWindowIcon size={44} weight="duotone" />} title="Whole screens, made of the parts" lead="Dashboards and settings, each one file built from basedraft UI." path="/screens" />
      {SCREENS.map((sc, i) => (
        <Card key={sc.slug} k={`screen-${sc.slug}`} glow={glowAt(i + 1)} tile={<AppWindowIcon size={44} weight="duotone" />} title={sc.title} lead={`${sc.kind}, made of ${sc.uses.length} basedraft UI components.`} path={`/screens/${sc.slug}`} />
      ))}
      <Card k="blocks" glow="d" tile={<SquaresFourIcon size={44} weight="duotone" />} title="Every section, from real sites" lead="Live at any width, with their code and a copy for Figma." path="/blocks" />
      {used.map((k, i) => {
        const I = SECTION_ICON[k.id];
        return <Card key={k.id} k={`blocks-${k.id}`} glow={glowAt(i + 2)} tile={<I size={44} weight="duotone" />} title={k.label} lead={k.blurb} path={`/blocks/${k.id}`} />;
      })}
      <Card k="whats-new" glow="c" tile={<SparkleIcon size={44} weight="duotone" />} title="What's new" lead="New templates, components and blocks, newest first." path="/whats-new" />
      <Card k="studio" glow="d" tile={<PenNibIcon size={44} weight="duotone" />} title="Make it yours, right on the page" lead="Rearrange and rewrite a template on the live site, then take it home." path="/studio" />
    </main>
  );
}
