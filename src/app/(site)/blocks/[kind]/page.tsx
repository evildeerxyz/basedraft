import { StackIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTION_ICON } from "@/site/icons";
import { FactPill, KindMenu, NextUp, PieceHead, PieceNav, SectionDock } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { SECTIONS, TEMPLATES, templateLogo, USED_KINDS } from "@/site/live";
import { LiveSectionShowcase } from "@/site/section-showcase";
import { glowAt } from "@/site/stage";
import { withCard } from "@/site/og";

const kindOf = (id: string) => USED_KINDS.find((k) => k.id === id);
const count = (id: string) => SECTIONS.filter((s) => s.kind === id).length;
/* A kind, for the arrows by the name. */
const link = (k?: (typeof USED_KINDS)[number]) => k && { href: `/blocks/${k.id}`, label: k.label };

export function generateStaticParams() {
  return USED_KINDS.map((k) => ({ kind: k.id }));
}

export async function generateMetadata({ params }: PageProps<"/blocks/[kind]">): Promise<Metadata> {
  const k = kindOf((await params).kind);
  return k ? withCard(`blocks-${k.id}`, { title: `${k.label} sections`, description: `${k.blurb} From the basedraft templates, live.` }) : {};
}

/* Prerendered for every kind. An unknown kind is turned away before anything is sent, so it's a real 404. */
export default async function KindPage({ params }: PageProps<"/blocks/[kind]">) {
  if (!kindOf((await params).kind)) notFound();
  return <Kind params={params} />;
}

async function Kind({ params }: { params: PageProps<"/blocks/[kind]">["params"] }) {
  const k = kindOf((await params).kind);
  if (!k) notFound();
  const list = SECTIONS.filter((s) => s.kind === k.id);
  const i = USED_KINDS.indexOf(k);
  const from = [...new Set(list.map((s) => s.template))];
  const name = (slug: string) => TEMPLATES.find((t) => t.slug === slug)?.name ?? slug;
  // Three other kinds to go on to: the ones after this one, wrapping at the end.
  const related = [1, 2, 3].map((d) => USED_KINDS[(i + d) % USED_KINDS.length]).filter((r) => r.id !== k.id);
  const I = SECTION_ICON[k.id];
  return (
    <main id="main">
      <div className={LIB_WRAP}>
        <PieceNav back={{ href: "/blocks", label: "Blocks" }} prev={link(USED_KINDS[i - 1])} next={link(USED_KINDS[i + 1])} menu={<KindMenu current={k.id} />} />
        <PieceHead
          kicker={
            <>
              <span className="grid size-8 place-items-center rounded-[10px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
                <I size={16} weight="duotone" />
              </span>
              Blocks
            </>
          }
          title={k.label}
          lead={`${k.blurb} ${list.length === 1 ? "It's" : `All ${list.length} are`} live from ${list.length === 1 ? "its" : "their"} own template, exactly as ${list.length === 1 ? "it ships" : "they ship"}.`}
          facts={
            <FactPill icon={<StackIcon weight="duotone" size={14} />}>
              {list.length} {list.length === 1 ? "section" : "sections"}, from
              {/* The templates they come from, as a small stack of their logos. */}
              <span className="flex -space-x-1">
                {from.map((slug) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={slug} src={templateLogo(slug)} alt={name(slug)} title={name(slug)} width={18} height={18} className="size-[18px] rounded-full ring-2 ring-canvas" />
                ))}
              </span>
            </FactPill>
          }
        />
      </div>
      {list.length > 1 && <SectionDock items={list.map((s) => ({ id: `${s.template}-${s.id}`, label: name(s.template), logo: templateLogo(s.template) }))} />}
      <div className={LIB_WRAP}>
        {list.map((s, j) => (
          <LiveSectionShowcase key={s.key} template={s.template} id={s.id} glow={glowAt(j)} />
        ))}
        <NextUp
          title="More kinds of section"
          items={related.map((r) => {
            const R = SECTION_ICON[r.id];
            return { href: `/blocks/${r.id}`, label: r.label, count: count(r.id), lead: r.blurb, icon: <R size={20} weight="duotone" /> };
          })}
        />
      </div>
    </main>
  );
}
