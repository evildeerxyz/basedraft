import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";

/* The site's chrome around every page. basedraft's single-section pages draw without it. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only z-[300] rounded-[12px] bg-ink px-4 py-3 text-[16px] font-medium text-page focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
