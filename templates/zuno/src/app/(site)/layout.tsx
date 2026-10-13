import { Footer } from "@/components/sections/Footer";
import { Nav } from "@/components/sections/Nav";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[300] rounded-[10px] bg-lime px-4 py-3 font-medium text-on-lime focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
