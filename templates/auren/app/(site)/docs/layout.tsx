import { DocsSearch, DocsSidebar } from "@/components/site/docs-nav";
import { DitherBand } from "@/components/ui/primitives";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="bg-paper text-ink">
      <div className="bg-ink pt-[var(--nav-h)] text-paper">
        <div className="container-x flex flex-wrap items-end justify-between gap-6 pb-10 pt-14">
          <div>
            <div className="type-label text-mute">Auren / Documentation</div>
            <p className="type-display mt-5 text-[clamp(2.25rem,4.6vw,4rem)]">Docs</p>
          </div>
          <DocsSearch />
        </div>
      </div>
      <DitherBand from="var(--ink)" to="var(--paper)" rows={20} />
      <div className="container-x grid grid-cols-1 gap-10 pb-28 pt-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[13rem_minmax(0,1fr)_12rem]">
        <DocsSidebar />
        {children}
      </div>
    </div>
  );
}
