import { PackageIcon, StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { claudePrompt, COMPONENTS, componentOf, PACKAGE } from "@/registry";
import { DOCS } from "@/registry/docs";
import { DEPS } from "@/registry/exports";
import { SOURCES } from "@/registry/sources";
import { FactPill, PieceHead, PieceNav, PiecePart, SectionDock } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { AccessCard, ComponentGlyph, ComponentMenu, ExampleList, GuideCard, MoreComponents, TakeComponent, UsageCard, Workbench } from "@/site/ui-library";
import { withCard } from "@/site/og";


export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ name: c.name }));
}

export async function generateMetadata({ params }: PageProps<"/components/[name]">): Promise<Metadata> {
  const c = componentOf((await params).name);
  return c ? withCard(`component-${c.name}`, { title: `${c.title} component`, description: `${c.description} Part of basedraft UI: free, one file to copy or download.` }) : {};
}

/* Prerendered for every component. An unknown name is turned away before anything is sent, so it's a real 404. */
export default async function ComponentPage({ params }: PageProps<"/components/[name]">) {
  const c = componentOf((await params).name);
  if (!c || (!c.pro && !SOURCES[c.name])) notFound();
  return <Component params={params} />;
}

/* A neighbor in the list, for the arrows by the name. */
const link = (c?: (typeof COMPONENTS)[number]) => c && { href: `/components/${c.name}`, label: c.title };

async function Component({ params }: { params: PageProps<"/components/[name]">["params"] }) {
  const c = componentOf((await params).name);
  // A Pro component's source never comes here: the page gets it from the gated route, for Pro.
  const source = c && !c.pro ? SOURCES[c.name] : null;
  if (!c || (!source && !c.pro)) notFound();
  const doc = DOCS[c.name];
  const deps = DEPS[c.name] ?? [];
  const i = COMPONENTS.indexOf(c);
  // Three more to try: the rest of its group first, then the ones after it.
  const others = [...COMPONENTS.filter((x) => x.group === c.group), ...COMPONENTS.slice(i + 1), ...COMPONENTS.slice(0, i)].filter((x, j, all) => x !== c && all.indexOf(x) === j).slice(0, 3);
  // Every part's props; a component documented the older way has one part, itself.
  const parts = doc?.parts?.length ? doc.parts : doc?.props ? [{ name: c.title.replace(/\s+(\w)/g, (_, l: string) => l.toUpperCase()), props: doc.props }] : [];
  const guide = !!(doc?.use?.length || doc?.avoid?.length);
  const access = !!(doc?.keyboard?.length || doc?.a11y?.length);
  // The page's parts, for the dock that follows you down it.
  const sections = [
    { id: "preview", label: "Preview" },
    { id: "take", label: "Install" },
    ...(guide ? [{ id: "when", label: "When to use it" }] : []),
    ...(doc?.examples?.length ? [{ id: "examples", label: "Examples" }] : []),
    ...(doc ? [{ id: "usage", label: "Props" }] : []),
    ...(access ? [{ id: "access", label: "Keyboard and accessibility" }] : []),
  ];
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
            <FactPill icon={<PackageIcon weight="duotone" size={14} />}>{c.pro ? "Pro" : PACKAGE}</FactPill>
            <FactPill icon={<StackIcon weight="duotone" size={14} />}>{deps.length ? deps.join(", ") : "No dependencies"}</FactPill>
          </>
        }
      />
      <SectionDock label="This page" items={sections} />
      <div className="pt-6">
        <Workbench name={c.name} title={c.title} source={source} prompt={c.pro ? "" : claudePrompt(c)} pro={c.pro} />
      </div>
      <TakeComponent name={c.name} title={c.title} deps={deps} source={source} prompt={c.pro ? "" : claudePrompt(c)} pro={c.pro} />
      {guide && (
        <PiecePart id="when" title="When to use it">
          <GuideCard use={doc?.use} avoid={doc?.avoid} />
        </PiecePart>
      )}
      {doc?.examples?.length ? (
        <PiecePart id="examples" title="Examples" lead="Each one live, with the code that makes it.">
          <ExampleList name={c.name} examples={doc.examples} />
        </PiecePart>
      ) : null}
      {doc && (
        <PiecePart id="usage" title="Use it" lead={parts.length > 1 ? "An example to start from, and every prop each part takes." : "An example to start from, and every prop it takes."}>
          <UsageCard name={c.name} usage={doc.usage} parts={parts} />
        </PiecePart>
      )}
      {access && (
        <PiecePart id="access" title="Keyboard and accessibility">
          <AccessCard keyboard={doc?.keyboard} a11y={doc?.a11y} />
        </PiecePart>
      )}
      <PiecePart title="More components">
        <MoreComponents names={others.map((o) => o.name)} />
      </PiecePart>
    </main>
  );
}
