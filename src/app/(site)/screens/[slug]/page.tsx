import { AppWindowIcon, StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isNew } from "@/registry";
import { SCREENS, screenOf } from "@/screens";
import { SCREEN_SOURCES } from "@/screens/sources";
import { FactPill, PieceHead, PieceNav, PiecePart, SectionDock } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { withCard } from "@/site/og";
import { PieceSkeleton } from "@/site/piece-skeleton";
import { MoreScreens, ScreenMenu, ScreenStage, TakeScreen, UsedComponents } from "@/site/screens";
import { NewBadge } from "@/site/sheet";

export function generateStaticParams() {
  return SCREENS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/screens/[slug]">): Promise<Metadata> {
  const s = screenOf((await params).slug);
  return s ? withCard(`screen-${s.slug}`, { title: `${s.title} screen`, description: `${s.description} Made of ${s.uses.length} basedraft UI components.` }) : {};
}

/*
 * The page's frame comes first, so a click shows it at once with the page's shape in gray, and the
 * screen streams into it. Every screen is prerendered whole; an unknown one is a real 404 from the
 * Worker (cloudflare/worker.ts) before Next runs.
 */
export default function ScreenPage({ params }: PageProps<"/screens/[slug]">) {
  return (
    <main id="main" className={LIB_WRAP}>
      <Suspense fallback={<PieceSkeleton dock />}>
        <Screen params={params} />
      </Suspense>
    </main>
  );
}

const link = (s?: (typeof SCREENS)[number]) => s && { href: `/screens/${s.slug}`, label: s.title };

async function Screen({ params }: { params: PageProps<"/screens/[slug]">["params"] }) {
  const s = screenOf((await params).slug);
  if (!s) notFound();
  const source = SCREEN_SOURCES[s.slug] ?? null;
  const i = SCREENS.indexOf(s);
  const others = [...SCREENS.slice(i + 1), ...SCREENS.slice(0, i)].slice(0, 2);
  // What it is and what it's made of: under its name on a phone, at the end of the dock's row on a desk.
  const facts = (
    <>
      <FactPill icon={<AppWindowIcon weight="duotone" size={14} />}>{s.kind}</FactPill>
      <FactPill icon={<StackIcon weight="duotone" size={14} />}>{s.uses.length} components</FactPill>
    </>
  );
  return (
    <>
      <PieceNav back={{ href: "/screens", label: "Screens" }} prev={link(SCREENS[i - 1])} next={link(SCREENS[i + 1])} menu={<ScreenMenu slug={s.slug} />} />
      <PieceHead
        kicker={
          <>
            <span className="grid size-8 place-items-center rounded-[10px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
              <AppWindowIcon size={16} weight="duotone" />
            </span>
            {s.kind}
            {isNew(s) && <NewBadge size="md" className="ml-1" />}
          </>
        }
        title={s.title}
        lead={s.description}
        facts={facts}
      />
      <SectionDock
        label="This page"
        end={facts}
        items={[
          { id: "preview", label: "Preview" },
          { id: "made-of", label: "Components used" },
          { id: "take", label: "Take it home" },
        ]}
      />
      <div className="pt-6">
        <ScreenStage s={s} source={source} />
      </div>
      <PiecePart id="made-of" title="Components used" lead={`${s.title} is made of these ${s.uses.length}. Each one has its own page, with every prop, examples and its code.`}>
        <UsedComponents names={s.uses} />
      </PiecePart>
      <TakeScreen s={s} source={source} />
      {others.length > 0 && (
        <PiecePart title="More screens">
          <MoreScreens slugs={others.map((o) => o.slug)} />
        </PiecePart>
      )}
    </>
  );
}
