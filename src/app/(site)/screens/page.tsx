import { AppWindowIcon, DiamondIcon, LayoutIcon, StackIcon, SquaresFourIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { COMPONENTS } from "@/registry";
import { SCREENS } from "@/screens";
import { HeroFacts, LibraryHero, NextUp } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { SECTIONS, TEMPLATES } from "@/site/live";
import { btnLg } from "@/site/sheet";
import { ScreensGallery } from "@/site/screens";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("screens", { title: "Screens", description: "Whole pages of an app, dashboards and settings, each one file made of basedraft UI, with every component in it a click away." });

/* The screens: a light card that says what they are, then each of them live, shrunk into its tile. */
export default function ScreensPage() {
  const free = SCREENS.filter((s) => !s.pro).length;
  const pro = SCREENS.length - free;
  return (
    <main id="main">
      <LibraryHero
        facts={
          <HeroFacts
            items={[
              { icon: <AppWindowIcon weight="duotone" size={14} />, value: SCREENS.length, label: SCREENS.length === 1 ? "screen" : "screens" },
              ...(free ? [{ icon: <SquaresFourIcon weight="duotone" size={14} />, value: free, label: "free" }] : []),
              ...(pro ? [{ icon: <DiamondIcon weight="duotone" size={14} />, value: pro, label: "with Pro" }] : []),
            ]}
          />
        }
        title="Whole screens, made of the parts"
        lead="Whole pages of an app, each one file built from basedraft UI. Try them at any width, take the code, or open any component in them."
        actions={
          <>
            <Link href="#screens" className={btnLg.onPaper}>
              See the screens
            </Link>
            <Link href="/components" className={btnLg.onPaperOutline}>
              <StackIcon weight="duotone" size={15} /> The components
            </Link>
          </>
        }
      />
      <div id="screens" className="scroll-mt-[calc(var(--bd-header-h,80px)+16px)]">
        <ScreensGallery />
      </div>
      <div className={LIB_WRAP}>
        <NextUp
          title="The rest of the kit"
          items={[
            { href: "/components", label: "Components", count: COMPONENTS.length, lead: "Every part these screens are made of, live, with its props and its code.", icon: <StackIcon size={20} weight="duotone" /> },
            { href: "/blocks", label: "Blocks", count: SECTIONS.length, lead: "Whole sections from the templates, live at any width, with a copy for Figma.", icon: <SquaresFourIcon size={20} weight="duotone" /> },
            { href: "/templates", label: "Templates", count: TEMPLATES.length, lead: "Complete sites, every page written and wired, in Next.js and Astro.", icon: <LayoutIcon size={20} weight="duotone" /> },
          ]}
        />
      </div>
    </main>
  );
}
