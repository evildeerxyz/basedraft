import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Container, Index } from "@/components/site/ui";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * A legal document: the short version up top, then numbered sections with a
 * sticky contents list. Plain language first, detail second.
 */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  intro,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  summary: { icon: Icon; title: string; body: string }[];
  sections: LegalSection[];
}) {
  return (
    <>
      <section className="border-b border-line">
        <Container className="pb-12 pt-14 md:pt-20">
          <Index>{eyebrow}</Index>
          <h1 className="mt-5 max-w-[760px] text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">{title}</h1>
          <p className="mt-5 max-w-[620px] text-[18px] leading-relaxed text-ink-2">{intro}</p>
          <p className="mt-6 text-[13.5px] text-ink-3">Last updated {updated}</p>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          <h2 className="text-[15px] font-medium text-ink">The short version</h2>
          <ul className="mt-5 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {summary.map(({ icon: ItemIcon, title: itemTitle, body }) => (
              <li key={itemTitle} className="border-b border-r border-line p-6">
                <ItemIcon size={26} weight="duotone" className="text-accent" />
                <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-ink">{itemTitle}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section>
        <Container className="grid gap-12 pb-28 pt-4 lg:grid-cols-[240px_1fr] lg:gap-20">
          <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[13.5px] text-ink-3">Contents</p>
            <ol className="mt-4 grid gap-2 text-[14px]">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex gap-3 text-ink-2 transition-colors hover:text-ink">
                    <span className="w-5 shrink-0 font-mono text-[12px] leading-[1.6] text-ink-3">{i + 1}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="grid max-w-[720px] gap-12">
            {sections.map((section, i) => (
              <article key={section.id} id={section.id} className="scroll-mt-24 border-t border-line pt-8">
                <h2 className="flex items-baseline gap-3 text-[24px] font-medium tracking-[-0.03em] text-ink">
                  <span className="font-mono text-[13px] font-normal text-ink-3">{i + 1}</span>
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-4 text-[16px] leading-[1.75] text-ink-2 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-ink [&_ul]:grid [&_ul]:gap-2">
                  {section.body}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

/** A two-column table for legal pages. */
export function LegalTable({ head, rows }: { head: [string, string, string?]; rows: [string, string, string?][] }) {
  const three = head.length === 3 && head[2] !== undefined;
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[520px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-ink">
            {head.filter(Boolean).map((cell) => (
              <th key={cell} className="px-4 py-3 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-line-soft last:border-b-0">
              <td className="px-4 py-3 font-medium text-ink">{row[0]}</td>
              <td className="px-4 py-3 text-ink-2">{row[1]}</td>
              {three && <td className="px-4 py-3 text-ink-2">{row[2]}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
