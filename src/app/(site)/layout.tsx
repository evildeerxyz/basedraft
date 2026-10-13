import { SiteShell } from "@/site/shell";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-fg focus:px-3 focus:py-2 focus:text-ui focus:text-canvas">
        Skip to content
      </a>
      <SiteShell>{children}</SiteShell>
    </>
  );
}
