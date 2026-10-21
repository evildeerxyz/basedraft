import { ArrowRightIcon, CodeIcon, FigmaLogoIcon, PenNibIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CHANGELOG } from "./changelog";
import { SECTIONS, TEMPLATES, templateLogo } from "./live";
import { ShellLine } from "./shell-line";
import { ClaudeMark } from "./claude-mark";

/*
 * What Pro pays for, as a grid of what's really in it: the templates and their sections, Studio,
 * the Figma copy, the code, Claude Code, every update after today, and the refund. The two wide
 * tiles sit on the hero's light; the rest are plain cards, each with its icon and a line on it.
 */

const CARD = "flex flex-col rounded-[28px] border border-line bg-surface p-6 sm:p-7";

function Tile({ icon: I, title, children, className, foot }: { icon: Icon | typeof ClaudeMark; title: string; children: ReactNode; className?: string; foot?: ReactNode }) {
  return (
    <li className={cn(CARD, className)}>
      <span className="grid size-10 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
        <I weight="duotone" size={20} />
      </span>
      <h3 className="mt-5 font-display text-[22px] leading-[1.15]">{title}</h3>
      <p className="mt-2 text-ui leading-[1.6] text-muted">{children}</p>
      {foot && <div className="mt-auto pt-6">{foot}</div>}
    </li>
  );
}

/** The latest changes, as a short list: a tag and a title each. */
function Latest() {
  const changes = CHANGELOG.flatMap((d) => d.changes).slice(0, 4);
  return (
    <ul className="grid gap-1.5">
      {changes.map((c) => (
        <li key={c.title} className="flex items-center gap-3 rounded-full bg-paper/70 py-1.5 pl-1.5 pr-4 text-ui shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_8%,transparent)] backdrop-blur">
          <span className={cn("shrink-0 rounded-full px-2 py-1 text-[11px] font-medium leading-none", c.tag === "Coming" ? "text-paper-muted shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_25%,transparent)] [border-style:dashed]" : c.tag === "New" ? "bg-brand-soft text-brand-ink" : "bg-paper-ink/[0.06] text-paper-ink")}>{c.tag ?? "Update"}</span>
          <span className="truncate text-paper-ink">{c.title}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProWorth() {
  const pages = TEMPLATES.reduce((n, t) => n + t.pages.length, 0);
  return (
    <ul className="bd-reveal grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
      {/* Everything in it: the figures, and the templates' own icons. */}
      <li className="bd-paper glow-c flex flex-col justify-between gap-10 rounded-[28px] p-6 sm:p-8 lg:col-span-2">
        <div>
          <h3 className="font-display text-[26px] leading-[1.12]">Every template, every section</h3>
          <p className="mt-2 max-w-[460px] text-ui leading-[1.6] text-paper-muted">Whole sites with every page, and each of their sections on its own. New templates come with Pro as they ship.</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <dl className="flex gap-8 sm:gap-12">
            {[
              [TEMPLATES.length, "templates"],
              [SECTIONS.length, "sections"],
              [pages, "pages"],
            ].map(([n, label]) => (
              <div key={label}>
                <dd className="font-display text-[44px] leading-none tabular-nums">{n}</dd>
                <dt className="mt-2 text-meta text-paper-muted">{label}</dt>
              </div>
            ))}
          </dl>
          <div className="flex -space-x-2">
            {TEMPLATES.map((t) => (
              <Image key={t.slug} src={templateLogo(t.slug)} alt={t.name} title={t.name} width={40} height={40} unoptimized className="size-10 rounded-[12px] shadow-[0_0_0_3px_var(--bd-paper)]" />
            ))}
          </div>
        </div>
      </li>
      <Tile icon={PenNibIcon} title="Studio, on the real site" foot={<Link href="/studio" className="bd-link inline-flex items-center gap-2 text-ui font-medium">Open Studio <ArrowRightIcon weight="regular" size={14} /></Link>}>
        Rewrite the words and rearrange the sections on the live pages, at desktop, tablet or phone width. Free to try.
      </Tile>
      <Tile icon={FigmaLogoIcon} title="Copy to Figma">
        Paste a section or a whole page into Figma with auto layout and components. The blocks pages copy to Paper and SVG too.
      </Tile>
      <Tile icon={CodeIcon} title="The code, your way" foot={<div className="overflow-x-auto rounded-[14px] bg-surface-2 px-3.5 py-2.5 no-scrollbar"><ShellLine command="npm install && npm run dev" className="whitespace-nowrap text-[12px]" /></div>}>
        Next.js 16 or Astro 7. Download the project, or send it to GitHub as a new repository or a pull request.
      </Tile>
      <Tile icon={ClaudeMark} title="Ready for Claude Code" foot={<div className="overflow-x-auto rounded-[14px] bg-surface-2 px-3.5 py-2.5 no-scrollbar"><ShellLine command="curl https://basedraft.site/llms.txt" className="whitespace-nowrap text-[12px]" /></div>}>
        A prompt that sets a template up in Claude Code, components that download as single files, and /llms.txt for AI tools.
      </Tile>
      {/* Every update after today, with the latest few to show it's real. */}
      <li className="bd-paper glow-d grid gap-6 rounded-[28px] p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-8 lg:col-span-2">
        <div className="flex flex-col">
          <h3 className="font-display text-[26px] leading-[1.12]">Every update after today</h3>
          <p className="mt-2 text-ui leading-[1.6] text-paper-muted">Fixes, new pages and new templates land on your Purchases page, including the dashboard designs coming next.</p>
          <Link href="/whats-new" className="bd-link mt-auto inline-flex items-center gap-2 pt-6 text-ui font-medium text-paper-ink">
            What&apos;s new <ArrowRightIcon weight="regular" size={14} />
          </Link>
        </div>
        <Latest />
      </li>
      <Tile icon={ShieldCheckIcon} title="14 days to decide">
        Ask within 14 days for a full refund, no questions asked.
      </Tile>
    </ul>
  );
}
