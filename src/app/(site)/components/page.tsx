import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHead } from "@/site/heads";
import { SECTION_ICON } from "@/site/icons";
import { isFree, KINDS, SECTIONS, sectionShot, TEMPLATES, templateOf } from "@/site/live";
import { btn } from "@/site/sheet";

export const metadata: Metadata = {
  title: "Components",
  description: "Every section from the three basedraft templates, live, at any width, with its code and a copy for Figma.",
};

export default function ComponentsPage() {
  const kinds = KINDS.filter((k) => SECTIONS.some((s) => s.kind === k.id));
  return (
    <main id="main">
      <PageHead title="Components" lead={`All ${SECTIONS.length} sections from the ${TEMPLATES.length} templates, sorted by what they do. Each one is the template's own code, live, at any width, with a copy for Figma.`} />
      <div className="space-y-14">
        {kinds.map((k) => {
          const list = SECTIONS.filter((s) => s.kind === k.id);
          const Icon = SECTION_ICON[k.id];
          return (
            <section key={k.id} aria-labelledby={`kind-${k.id}`} className="bd-reveal">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-1">
                <div className="min-w-0">
                  <h2 id={`kind-${k.id}`} className="flex items-center gap-2 text-heading">
                    <Icon size={17} weight="duotone" className="text-subtle" />
                    {k.label}
                    <span className="text-ui font-normal tabular-nums text-subtle">{list.length}</span>
                  </h2>
                  <p className="mt-1 text-body text-muted">{k.blurb}</p>
                </div>
                <Link href={`/components/${k.id}`} className={btn.link}>
                  See them live <ArrowRightIcon size={13} weight="bold" />
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {list.map((s, i) => (
                  // A lone last one on a phone's two columns takes the row.
                  <li key={s.key} className={list.length % 2 && i === list.length - 1 ? "max-md:col-span-2" : undefined}>
                    <Link href={`/components/${k.id}#${s.template}-${s.id}`} className="group block">
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-[8px] bg-surface shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
                        <Image src={sectionShot(s)} alt="" fill sizes="(min-width: 768px) 240px, 50vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 px-0.5 text-ui">
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: templateOf(s.template)!.accent }} />
                        <span className="truncate">
                          {templateOf(s.template)!.name} {s.name.toLowerCase()}
                        </span>
                        {!isFree(s) && <span className="ml-auto shrink-0 rounded-[5px] bg-fg/[0.06] px-1.5 py-0.5 text-meta font-medium text-muted">Pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
