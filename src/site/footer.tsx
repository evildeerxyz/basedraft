import { AppWindowIcon, ArrowRightIcon, EnvelopeSimpleIcon, LayoutIcon, PackageIcon, PenNibIcon, QuestionIcon, ReceiptIcon, ScrollIcon, SparkleIcon, SquaresFourIcon, StackIcon, TagIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { TEMPLATES, templateLogo } from "./live";
import { BaseDraftLogo } from "./logo";
import { btnLg } from "./sheet";
import { Wordmark } from "./wordmark";

/*
 * The foot of every page, one big card in the hero's light: the way in, what basedraft is, where
 * everything is and the small print, then the name drawn as wide as the card, sinking off its foot.
 */

type FooterLink = { label: string; href: string; icon?: Icon; logo?: string };

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      { label: "Templates", href: "/templates", icon: LayoutIcon },
      { label: "Components", href: "/components", icon: StackIcon },
      { label: "Screens", href: "/screens", icon: AppWindowIcon },
      { label: "Blocks", href: "/blocks", icon: SquaresFourIcon },
      { label: "Studio", href: "/studio", icon: PenNibIcon },
      { label: "Pricing", href: "/pro", icon: TagIcon },
      { label: "What's new", href: "/whats-new", icon: SparkleIcon },
    ],
  },
  { title: "Templates", links: TEMPLATES.map((t) => ({ label: t.name, href: `/templates/${t.slug}`, logo: templateLogo(t.slug) })) },
  {
    title: "Help",
    links: [
      { label: "How you get a template", href: "/pro#delivery", icon: PackageIcon },
      { label: "Licenses", href: "/pro#license", icon: ScrollIcon },
      { label: "Questions", href: "/pro#faq", icon: QuestionIcon },
      { label: "Your purchases", href: "/purchases", icon: ReceiptIcon },
      { label: "Write to us", href: "mailto:hello@basedraft.site", icon: EnvelopeSimpleIcon },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-28 px-3 pb-3 sm:px-4 sm:pb-4 md:mt-36">
      {/* Light paper in both modes, the way the hero is. */}
      <div data-scroll="settle" className="bd-light bd-paper glow-c relative isolate overflow-hidden rounded-[32px]">
        <div className="mx-auto max-w-[1312px] px-6 sm:px-10 lg:px-14">
          {/* The way in, at the head of the card. */}
          <div className="flex flex-col items-start justify-between gap-8 border-b border-paper-ink/10 py-14 md:flex-row md:items-end md:py-20">
            <div>
              <span aria-hidden className="mb-6 grid size-12 place-items-center rounded-[16px] bg-paper/70 text-paper-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_9%,transparent),var(--bd-shadow-resting)] backdrop-blur">
                <PenNibIcon size={22} weight="duotone" />
              </span>
              <h2 className="max-w-[720px] text-balance text-headline">Your next site is already drafted</h2>
              <p className="mt-4 max-w-[460px] text-pretty text-body text-paper-muted">Open any template in Studio for free. Pay when you take it home.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/studio" className={btnLg.onPaper}>
                Open Studio, free <ArrowRightIcon weight="regular" size={15} />
              </Link>
              <Link href="/pro" className={btnLg.onPaperOutline}>
                See Pro
              </Link>
            </div>
          </div>
          <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-[360px]">
              <Link href="/" aria-label="basedraft home" className="inline-block">
                <BaseDraftLogo />
              </Link>
              <p className="mt-4 text-ui text-paper-muted max-sm:hidden">Finished websites in Next.js and Astro, and every section in them, to make your own in Studio and take to Figma or GitHub.</p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-10 sm:grid-cols-3">
              {COLUMNS.map((c) => (
                <div key={c.title} className="min-w-32">
                  <h2 className="mb-4 text-meta font-medium text-paper-muted/80">{c.title}</h2>
                  <ul className="space-y-3">
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="group flex items-center gap-2.5 text-ui text-paper-muted transition-colors hover:text-paper-ink">
                          {l.logo ? (
                            // A template's own app icon.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.logo} alt="" width={16} height={16} className="size-4 shrink-0 rounded-[4px]" />
                          ) : (
                            l.icon && <l.icon size={16} weight="duotone" className="shrink-0 text-paper-muted/80 transition-colors group-hover:text-paper-ink" />
                          )}
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-paper-ink/10 py-6 text-meta text-paper-muted">
            <span>© 2026 basedraft</span>
            <span className="flex flex-wrap gap-5">
              <Link href="/pro#license" className="transition-colors hover:text-paper-ink">
                License
              </Link>
              <Link href="/pro#faq" className="transition-colors hover:text-paper-ink">
                Questions
              </Link>
              <a href="mailto:hello@basedraft.site" className="transition-colors hover:text-paper-ink">
                hello@basedraft.site
              </a>
            </span>
          </div>
        </div>
        {/* The drawn name is for wide screens; a phone ends on the links. */}
        <div className="max-sm:hidden">
          <Wordmark />
        </div>
      </div>
    </footer>
  );
}
