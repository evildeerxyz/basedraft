import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Band, ButtonLink, Tag } from "@/components/site/ui";

export default function NotFound() {
  // The site's nav and footer live in (site)'s layout, so the 404 page brings its own.
  return (
    <>
      <Nav />
      <main id="main">
        <Band inner="py-24 lg:py-36">
          <p className="tabular font-mono text-[48px] font-medium leading-none tracking-[-0.05em] text-accent">404</p>
          <h1 className="mt-8 max-w-[760px] text-balance text-[clamp(2.8rem,6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-ink">This page took the day off.</h1>
          <p className="mt-6 max-w-[480px] text-[19px] leading-[1.5] text-mute">It may have moved, or it was never here. Everything else is where you left it.</p>
          <p className="mt-6">
            <Tag tone="done">Approved by pello, 1 day</Tag>
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
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
