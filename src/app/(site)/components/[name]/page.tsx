import { FileTsxIcon, PackageIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { claudePrompt, COMPONENTS, componentOf } from "@/registry";
import { DOCS } from "@/registry/docs";
import { SOURCES } from "@/registry/sources";
import { FactPill, PieceHead, PieceNav, PiecePart } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { ComponentGlyph, ComponentMenu, MoreComponents, TakeComponent, UsageCard, Workbench } from "@/site/ui-library";

/* Packages a component can need beyond React, by how its source imports them. */
const PACKAGES = ["motion", "@phosphor-icons/react"];
const needs = (source: string) => PACKAGES.filter((p) => new RegExp(`from "${p.replace("/", "\\/")}(/[^"]*)?"`).test(source));

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ name: c.name }));
}

export async function generateMetadata({ params }: PageProps<"/components/[name]">): Promise<Metadata> {
  const c = componentOf((await params).name);
  return c ? { title: `${c.title} component`, description: `${c.description} Part of basedraft UI: free, one file to copy or download.` } : {};
}

/* Prerendered for every component; the name is read inside Suspense so the route's shell stays instant. */
export default function ComponentPage({ params }: PageProps<"/components/[name]">) {
  return (
    <Suspense fallback={<main id="main" className="min-h-[80vh]" />}>
      <Component params={params} />
    </Suspense>
  );
}

/* A neighbor in the list, for the arrows by the name. */
const link = (c?: (typeof COMPONENTS)[number]) => c && { href: `/components/${c.name}`, label: c.title };

async function Component({ params }: { params: PageProps<"/components/[name]">["params"] }) {
  const c = componentOf((await params).name);
  const source = c && SOURCES[c.name];
  if (!c || !source) notFound();
  const doc = DOCS[c.name];
  const deps = needs(source);
  const i = COMPONENTS.indexOf(c);
  // Three more to try: the rest of its group first, then the ones after it.
  const others = [...COMPONENTS.filter((x) => x.group === c.group), ...COMPONENTS.slice(i + 1), ...COMPONENTS.slice(0, i)].filter((x, j, all) => x !== c && all.indexOf(x) === j).slice(0, 3);
  return (
    <main id="main" className={LIB_WRAP}>
      <PieceNav back={{ href: "/components", label: "Components" }} prev={link(COMPONENTS[i - 1])} next={link(COMPONENTS[i + 1])} menu={<ComponentMenu name={c.name} />} />
      <PieceHead
        kicker={
          <>
            <ComponentGlyph name={c.name} />
            {c.group}
          </>
        }
        title={c.title}
        lead={c.description}
        facts={
          <>
            <FactPill icon={<FileTsxIcon weight="duotone" size={14} />}>{c.name}.tsx</FactPill>
            <FactPill icon={<PackageIcon weight="duotone" size={14} />}>{deps.length ? deps.join(", ") : "No dependencies"}</FactPill>
          </>
        }
      />
      <Workbench name={c.name} source={source} prompt={claudePrompt(c)} />
      <TakeComponent name={c.name} title={c.title} deps={deps} source={source} prompt={claudePrompt(c)} />
      {doc && (
        <PiecePart id="usage" title="Use it" lead="An example to start from, and every prop it takes.">
          <UsageCard name={c.name} usage={doc.usage} props={doc.props} />
        </PiecePart>
      )}
      <PiecePart title="More components">
        <MoreComponents names={others.map((o) => o.name)} />
      </PiecePart>
    </main>
  );
}
