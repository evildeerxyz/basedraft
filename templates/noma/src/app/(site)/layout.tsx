import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";

/* The site's chrome, moved here from the root layout unchanged, so BaseDraft's single-section pages can render without it. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
