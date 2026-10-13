import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { ButtonLink, Container, Stamp } from "@/components/site/ui";

export default function NotFound() {
  // The site's nav and footer live in (site)'s layout, so the 404 page brings its own.
  return (
    <>
      <Nav />
      <main id="main">
        <section className="py-24 lg:py-36">
          <Container>
            <Stamp tone="accent" tilt={-6}>Approved, 1 day off</Stamp>
            <h1 className="mt-10 max-w-[1000px] text-balance font-display text-[clamp(4rem,11vw,10rem)] font-extrabold leading-[0.82] text-ink">This page took the day off.</h1>
            <p className="mt-8 max-w-[560px] text-[clamp(1.18rem,1.6vw,1.32rem)] leading-[1.5] text-ink-2">It may have moved, or it was never here. Everything else is where you left it.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/" kind="ink" size="lg" arrow>
                Back home
              </ButtonLink>
              <Link href="/contact" className="inline-flex h-14 items-center rounded-[4px] px-6 text-[18px] font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page">
                Book a demo
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
