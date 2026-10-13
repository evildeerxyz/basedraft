import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Band, ButtonLink, Tag } from "@/components/site/ui";

export default function NotFound() {
  // The site's nav and footer live in (site)'s layout, so the 404 page brings its own.
  return (
    <>
      <Nav />
      <main id="main">
        <Band inner="py-28 text-center lg:py-40">
          <Tag tone="done">Approved, 1 day off</Tag>
          <h1 className="mx-auto mt-6 max-w-[760px] text-balance font-display text-[clamp(2.8rem,6vw,4.8rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">This page took the day off</h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[18px] leading-[1.55] text-mute">It may have moved, or it was never here. Everything else is where you left it.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/">Back home</ButtonLink>
            <ButtonLink href="/contact" kind="light">
              Book a demo
            </ButtonLink>
          </div>
        </Band>
      </main>
      <Footer />
    </>
  );
}
