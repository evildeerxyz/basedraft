import { ArrowRightIcon, LayoutIcon, PenNibIcon, SquaresFourIcon, StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { COMPONENTS } from "@/registry";
import { BlocksBrowser, HeroFacts, LibraryHero, NextUp } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { SECTIONS, TEMPLATES, USED_KINDS } from "@/site/live";
import { btnLg } from "@/site/sheet";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("blocks", { title: "Blocks", description: "Every section from the basedraft templates, live, at any width, with its code and a copy for Figma." });

/* Blocks: a light card that says what they are, then every section, a group per kind, which the dock filters. */
export default function BlocksPage() {
  return (
    <main id="main">
      <LibraryHero
        facts={
          <HeroFacts
            items={[
              { icon: <SquaresFourIcon weight="duotone" size={14} />, value: SECTIONS.length, label: "sections" },
              { icon: <StackIcon weight="duotone" size={14} />, value: USED_KINDS.length, label: "kinds" },
              { icon: <LayoutIcon weight="duotone" size={14} />, value: TEMPLATES.length, label: "templates" },
            ]}
          />
        }
        title="Every section, from real sites"
        lead={`All ${SECTIONS.length} sections from the ${TEMPLATES.length} templates, live at any width, with their code and a copy for Figma.`}
        actions={
          <>
            <Link href="/studio" className={btnLg.onPaper}>
              Try them in Studio <ArrowRightIcon weight="regular" size={15} />
            </Link>
            <Link href="/pro" className={btnLg.onPaperOutline}>
              Get them all with Pro
            </Link>
          </>
        }
      />
      <BlocksBrowser />
      <div className={LIB_WRAP}>
        <NextUp
          title="Bigger and smaller pieces"
          items={[
            { href: "/templates", label: "Templates", count: TEMPLATES.length, lead: "The whole sites these sections come from, every page written and wired.", icon: <LayoutIcon size={20} weight="duotone" /> },
            { href: "/components", label: "Components", count: COMPONENTS.length, lead: "basedraft's own React components, free, one file each.", icon: <StackIcon size={20} weight="duotone" /> },
            { href: "/studio", label: "Studio", lead: "Put sections together into a page, rewrite them, and take the result home.", icon: <PenNibIcon size={20} weight="duotone" /> },
          ]}
        />
      </div>
    </main>
  );
}
