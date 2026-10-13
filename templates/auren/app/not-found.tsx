import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import Template from "./(site)/template";
import { DitherWordmark } from "@/components/dither/dither-wordmark";
import { buttonClass } from "@/components/ui/primitives";
import { SmartLink } from "@/components/ui/smart-link";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  // Same chrome and entrance as before the site's nav and footer moved into (site).
  return (
    <>
      <Nav />
      <main id="main">
        <Template>
          <section className="bg-ink pb-24 pt-[calc(var(--nav-h)+clamp(3rem,10vh,7rem))] text-paper">
            <div className="container-x">
              <div className="type-label text-mute">Error / 404</div>
              <div className="mt-10 max-w-[880px]">
                <DitherWordmark text="404" />
              </div>
              <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-7">
                  <h1 className="type-display text-[clamp(2.25rem,4.6vw,4rem)]">
                    This page fell off the index.
                  </h1>
                  <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.55] text-fog">
                    The link may be old, or we moved something. Everything we have is one ⌘K away.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
                  <SmartLink href="/" className={buttonClass("light", "lg")}>
                    Back home
                  </SmartLink>
                  <SmartLink href="/docs" className={buttonClass("ghost-dark", "lg")}>
                    Read the docs
                  </SmartLink>
                </div>
              </div>
            </div>
          </section>
        </Template>
      </main>
      <Footer />
    </>
  );
}
