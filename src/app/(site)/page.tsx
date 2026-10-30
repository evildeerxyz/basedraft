import { AppWindowIcon, ArrowRightIcon, LayoutIcon, StackIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { COMPONENTS } from "@/registry";
import { SCREENS } from "@/screens";
import { HomeCard } from "@/site/home-card";
import { TEMPLATES } from "@/site/live";
import { btnLg, ProBadge } from "@/site/sheet";

/*
 * The home page is its hero and nothing else: one light card, as tall as the screen allows, that
 * says what basedraft is (finished landing pages, dashboards, and the components they're built
 * from) and leads to each. The header's capsule and the search are set into its edges (home-card.tsx),
 * and the page ends without the footer.
 */

/* A link in the hero's pill: an icon, a count and its word. */
const PILL_LINK = "flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors hover:bg-paper-ink/[0.05] hover:text-paper-ink";

export default function Overview() {
  return (
    // The whole screen under the header and the announcement strip (while it's open). On a desk the
    // page is pulled up under the header (a 68px capsule here), so the capsule sits in the card's top edge.
    <main id="main" className="flex min-h-[calc(100dvh-64px)] flex-col sm:min-h-[calc(100dvh-104px)] sm:in-data-[announce=off]:min-h-[calc(100dvh-64px)] lg:-mt-[68px] lg:min-h-[calc(100dvh-40px)] lg:in-data-[announce=off]:min-h-dvh">
      {/* Edge to edge, a small margin all round, and room at the foot for the search's lower half. */}
      <div className="flex flex-1 flex-col px-3 pb-[42px] pt-3 sm:px-4 lg:pt-10">
        <HomeCard>
          {/* What's here, in one frosted pill, each a way in: the sites, the dashboards, the components, and Pro. */}
          <nav aria-label="What's in basedraft" className="bd-reveal mb-8 flex h-9 items-center rounded-full bg-paper/70 p-1 text-meta text-paper-muted shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_10%,transparent),var(--bd-shadow-resting)] backdrop-blur">
            <Link href="/templates" className={PILL_LINK}>
              <LayoutIcon size={14} weight="duotone" /> <span className="font-medium text-paper-ink">{TEMPLATES.length}</span> sites
            </Link>
            <span aria-hidden className="h-4 w-px bg-paper-ink/10" />
            <Link href="/screens" className={PILL_LINK}>
              <AppWindowIcon size={14} weight="duotone" /> <span className="font-medium text-paper-ink">{SCREENS.length}</span> {SCREENS.length === 1 ? "dashboard" : "dashboards"}
            </Link>
            <span aria-hidden className="h-4 w-px bg-paper-ink/10 max-sm:hidden" />
            <Link href="/components" className={cn(PILL_LINK, "max-sm:hidden")}>
              <StackIcon size={14} weight="duotone" /> <span className="font-medium text-paper-ink">{COMPONENTS.length}</span> components
            </Link>
            <span aria-hidden className="h-4 w-px bg-paper-ink/10 max-md:hidden" />
            <Link href="/pro" className={cn(PILL_LINK, "group max-md:hidden")}>
              <ProBadge /> $149 once
              <ArrowRightIcon weight="regular" size={11} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </nav>
          {/* The promise: the finished design under a light blue highlighter stroke, the blank page set back in gray. */}
          <h1 id="hero-title" className="bd-reveal max-w-[1040px] text-balance text-display">
            Start from a <span className="whitespace-nowrap bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--bd-brand)_22%,transparent)_62%,color-mix(in_oklab,var(--bd-brand)_22%,transparent)_90%,transparent_90%)] [box-decoration-break:clone]">finished design</span>, <span className="text-paper-ink/40">not a blank page.</span>
          </h1>
          <p className="bd-reveal mt-6 max-w-[600px] text-pretty text-lead text-paper-muted">
            Landing pages and app dashboards, finished, and the {COMPONENTS.length} components they&apos;re built from, in Next.js and Astro. Make yours in Studio, then take it to Figma or GitHub.
          </p>
          <div className="bd-reveal mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/studio" className={btnLg.onPaper}>
              Open Studio, free <ArrowRightIcon weight="regular" size={15} />
            </Link>
            <Link href="/templates" className={btnLg.onPaperOutline}>
              See the templates
            </Link>
          </div>
        </HomeCard>
      </div>
    </main>
  );
}
