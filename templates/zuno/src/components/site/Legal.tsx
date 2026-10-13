import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** A legal document: title, effective date, an on-page index and prose sections. */
export function LegalDoc({ title, updated, intro, sections }: { title: string; updated: string; intro?: ReactNode; sections: LegalSection[] }) {
  return (
    <article>
      <h1 className="text-[clamp(2.8rem,6vw,4.75rem)] font-semibold leading-[0.96] tracking-[-0.045em]">{title}</h1>
      <p className="mt-5 text-[17px] text-white/60">Last updated {updated}</p>
      {intro && <div className="mt-10 max-w-[720px] text-[21px] leading-relaxed text-white/80">{intro}</div>}
      <nav aria-label="On this page" className="mt-12 rounded-[22px] bg-ink-2 p-7">
        <h2 className="text-[17px] font-medium text-white">On this page</h2>
        <ol className="mt-4 grid gap-x-10 gap-y-2.5 text-[17px] sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex gap-3 text-white/70 transition-colors hover:text-white">
                <span className="w-6 shrink-0 tabular-nums text-white/60 group-hover:text-accent">{i + 1}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="zn-prose mt-6 max-w-[760px]">
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </article>
  );
}
