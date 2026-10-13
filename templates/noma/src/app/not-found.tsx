import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import Template from "./(site)/template";
import { TrayScene } from "@/components/gl/lazy";
import { Section, buttonClass } from "@/components/site/ui";

export default function NotFound() {
  // Same chrome and entrance as before the site's nav and footer moved into (site).
  return (
    <div className="relative">
      <Nav />
      <main>
        <Template>
          <Section inner="grid items-center gap-8 pb-24 pt-10 lg:grid-cols-2">
            <div className="relative mx-auto aspect-square w-full max-w-[460px] lg:order-2">
              <TrayScene className="absolute inset-0" />
            </div>
            <div className="flex flex-col items-start gap-6">
              <span className="font-mono text-[13px] text-ink-3">Error 404 · 0 rows</span>
              <h1 className="text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">This query returned zero rows.</h1>
              <p className="max-w-md text-[17px] leading-relaxed text-ink-2">The page you are looking for does not exist, or it has not been approved yet.</p>
              <Link href="/" className={buttonClass("primary", "lg")}>
                Back home
              </Link>
            </div>
          </Section>
        </Template>
      </main>
      <Footer />
    </div>
  );
}
