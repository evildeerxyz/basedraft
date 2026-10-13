import { LegalNav } from "@/components/site/LegalNav";

export default function LegalLayout({ children }: LayoutProps<"/legal">) {
  return (
    <main id="main" className="mx-auto max-w-[1280px] px-5 pb-28 pt-32 lg:px-8 lg:pt-44">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-20">
        <LegalNav />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
