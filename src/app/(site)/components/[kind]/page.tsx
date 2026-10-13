import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SECTION_ICON } from "@/site/icons";
import { KINDS, SECTIONS, type SectionKind } from "@/site/live";
import { LiveSectionShowcase } from "@/site/section-showcase";
import { PageHead } from "@/site/heads";
import { btn } from "@/site/sheet";

/* The kinds that have sections, in page order. */
const USED = KINDS.filter((k) => SECTIONS.some((s) => s.kind === k.id));
const kindOf = (id: string) => USED.find((k) => k.id === id);

export function generateStaticParams() {
  return USED.map((k) => ({ kind: k.id }));
}

export async function generateMetadata({ params }: PageProps<"/components/[kind]">): Promise<Metadata> {
  const k = kindOf((await params).kind);
  return k ? { title: `${k.label} sections`, description: `${k.blurb} From the basedraft templates, live.` } : {};
}

/* Prerendered for every kind; the kind is read inside Suspense so the route's shell stays instant. */
export default function KindPage({ params }: PageProps<"/components/[kind]">) {
  return (
    <Suspense fallback={<main id="main" className="min-h-[80vh]" />}>
      <Kind params={params} />
    </Suspense>
  );
}

async function Kind({ params }: { params: PageProps<"/components/[kind]">["params"] }) {
  const k = kindOf((await params).kind);
  if (!k) notFound();
  const list = SECTIONS.filter((s) => s.kind === k.id);
  const i = USED.indexOf(k);
  const prev = USED[i - 1];
  const next = USED[i + 1];
  const Icon = SECTION_ICON[k.id as SectionKind];
  return (
    <main id="main">
      <PageHead
        back={{ href: "/components", label: "Components" }}
        title={
          <span className="flex items-center gap-3">
            <Icon size={40} weight="duotone" className="text-subtle" /> {k.label}
          </span>
        }
        lead={`${k.blurb} ${list.length === 1 ? "It's" : `All ${list.length} are`} shown live, from ${list.length === 1 ? "its" : "their"} own template, exactly as ${list.length === 1 ? "it ships" : "they ship"}.`}
        actions={
          <>
            {prev && (
              <Link href={`/components/${prev.id}`} className={btn.quiet}>
                <ArrowLeftIcon size={13} weight="bold" /> {prev.label}
              </Link>
            )}
            {next && (
              <Link href={`/components/${next.id}`} className={btn.quiet}>
                {next.label} <ArrowRightIcon size={13} weight="bold" />
              </Link>
            )}
          </>
        }
      />
      <div className="space-y-3">
        {list.map((s) => (
          <LiveSectionShowcase key={s.key} template={s.template} id={s.id} />
        ))}
      </div>
    </main>
  );
}
