import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";

/* The site's chrome, moved here from the root layout unchanged, so BaseDraft's single-section pages can render without it. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
