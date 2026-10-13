import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHead } from "@/site/heads";
import { ICON } from "@/site/icons";
import { TEMPLATES, templateShot } from "@/site/live";
import { btn } from "@/site/sheet";

export const metadata: Metadata = {
  title: "Templates",
  description: "Three finished Next.js sites, for fintech, AI and developer tools, with every page a real product needs.",
};

export default function TemplatesPage() {
  return (
    <main id="main">
      <PageHead title="Templates" lead="Finished Next.js sites with every page a real product needs. Open one in Studio to make it yours, or take it as it is and ship it." />
      <ul className="space-y-3">
        {TEMPLATES.map((t) => (
          <li key={t.slug} className="bd-reveal grid overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)] lg:grid-cols-[1.45fr_1fr]">
            <Link href={`/templates/${t.slug}`} className="group relative block aspect-[16/10] overflow-hidden border-b border-line bg-surface-2 lg:border-b-0 lg:border-r" aria-label={`${t.name} template`}>
              <Image src={templateShot(t.slug)} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover object-top transition-transform duration-700 ease-[var(--bd-ease)] group-hover:scale-[1.02]" />
            </Link>
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="flex items-center gap-2.5 text-title">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                </h2>
                <span className="text-heading tabular-nums">{t.price === "free" ? "Free" : `$${t.price}`}</span>
              </div>
              <p className="mt-1.5 text-ui text-subtle">
                {t.category}, {t.pages.length} pages, {t.sections.length} sections
              </p>
              <p className="mt-5 text-body text-muted">{t.description}</p>
              <ul className="mt-5 space-y-1.5">
                {t.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-ui">
                    <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-fg/40" />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-2 pt-8">
                <Link href={`/templates/${t.slug}`} className={btn.ink}>
                  <ICON.preview size={16} weight="duotone" /> View template
                </Link>
                <Link href={`/studio?template=${t.slug}`} className={btn.quiet}>
                  <ICON.studio size={16} weight="duotone" /> Open in Studio
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
