import { DOC_NAV, docHref, docOrder, getDoc, type Doc } from "@/lib/content/docs";
import { headings } from "@/lib/content/types";
import { SmartLink } from "../ui/smart-link";
import { Blocks } from "./blocks";
import { Helpful } from "./docs-nav";
import { Toc } from "./toc";

export function DocArticle({ doc }: { doc: Doc }) {
  const section = DOC_NAV.find((s) => s.slugs.includes(doc.slug))?.title;
  const i = docOrder.indexOf(doc.slug);
  const prev = i > 0 ? getDoc(docOrder[i - 1]) : undefined;
  const next = i < docOrder.length - 1 ? getDoc(docOrder[i + 1]) : undefined;

  return (
    <>
      <article className="min-w-0 max-w-[720px]">
        <div className="type-label text-ink/45">{section}</div>
        <h1 className="type-display mt-4 text-[clamp(2.25rem,4.4vw,3.75rem)]">{doc.title}</h1>
        <p className="mt-4 max-w-[52ch] text-[18px] leading-[1.55] text-ink/55">{doc.description}</p>
        <Blocks blocks={doc.blocks} className="mt-10" />

        <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prev ? (
            <SmartLink href={docHref(prev.slug)} className="group rounded-[8px] border border-ink/12 p-5 transition-colors hover:border-ink/35">
              <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-ink/45">
                Previous
              </span>
              <span className="type-title mt-2 block text-[19px]">{prev.title}</span>
            </SmartLink>
          ) : (
            <span />
          )}
          {next && (
            <SmartLink
              href={docHref(next.slug)}
              className="group rounded-[8px] border border-ink/12 p-5 text-right transition-colors hover:border-ink/35"
            >
              <span className="flex items-center justify-end gap-1.5 font-mono text-[11.5px] text-ink/45">
                Next
              </span>
              <span className="type-title mt-2 block text-[19px]">{next.title}</span>
            </SmartLink>
          )}
        </div>
        <div className="mt-10 border-t border-ink/12 pt-6">
          <Helpful />
        </div>
      </article>
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <Toc items={headings(doc.blocks)} />
        </div>
      </aside>
    </>
  );
}

/** Shell shown while a doc page's params resolve on navigation. */
export function DocSkeleton() {
  return (
    <div aria-hidden className="max-w-[720px] animate-pulse space-y-5">
      <div className="h-3 w-24 rounded bg-ink/[0.07]" />
      <div className="h-12 w-2/3 rounded bg-ink/[0.07]" />
      <div className="h-4 w-1/2 rounded bg-ink/[0.07]" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-4 rounded bg-ink/[0.05]" style={{ width: `${92 - i * 7}%` }} />
      ))}
    </div>
  );
}
