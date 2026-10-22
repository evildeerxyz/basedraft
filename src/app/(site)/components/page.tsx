import { BookOpenTextIcon, FileTsxIcon, LayoutIcon, PackageIcon, SquaresFourIcon, StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { claudePromptAll, COMPONENTS } from "@/registry";
import { HeroFacts, LibraryHero, NextUp } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { SECTIONS, TEMPLATES } from "@/site/live";
import { ClaudeMark } from "@/site/claude-mark";
import { btnLg } from "@/site/sheet";
import { ClaudeCodeButton, ComponentsBrowser } from "@/site/ui-library";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("components", { title: "Components", description: "basedraft UI: our own React components, free. Each one is a single file to copy or download, sharing one theme in light and dark." });

/* The components: a light card that says what they are, then every one of them, live, in a gallery the dock filters. */
export default function ComponentsPage() {
  return (
    <main id="main">
      <LibraryHero
        facts={
          <HeroFacts
            items={[
              { icon: <StackIcon weight="duotone" size={14} />, value: COMPONENTS.length, label: "components" },
              { icon: <PackageIcon weight="duotone" size={14} />, value: "Free", label: "to copy" },
              { icon: <FileTsxIcon weight="duotone" size={14} />, value: "One", label: "npm package" },
            ]}
          />
        }
        title="Components that move well"
        lead="basedraft UI: our own React components, made to be touched. One npm package, one stylesheet, light and dark, with or without Tailwind."
        actions={
          <>
            <ClaudeCodeButton prompt={claudePromptAll} />
            <Link href="/components/get-started" className={btnLg.onPaperOutline}>
              <BookOpenTextIcon weight="duotone" size={15} /> Get started
            </Link>
          </>
        }
      />
      <ComponentsBrowser />
      <div className={LIB_WRAP}>
        <NextUp
          title="Bigger pieces"
          items={[
            { href: "/blocks", label: "Blocks", count: SECTIONS.length, lead: "Whole sections from the templates, live at any width, with a copy for Figma.", icon: <SquaresFourIcon size={20} weight="duotone" /> },
            { href: "/templates", label: "Templates", count: TEMPLATES.length, lead: "Complete sites, every page written and wired, in Next.js and Astro.", icon: <LayoutIcon size={20} weight="duotone" /> },
            { href: "/llms.txt", label: "llms.txt", lead: "This library written out for Claude Code and other AI tools, with a command for each component.", icon: <ClaudeMark size={20} /> },
          ]}
        />
      </div>
    </main>
  );
}
