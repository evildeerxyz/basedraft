import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { ButtonLink, Container, Status } from "@/components/site/ui";

export default function NotFound() {
  // The site's nav and footer live in (site)'s layout, so the 404 page brings its own.
  return (
    <>
      <Nav />
      <main id="main">
        <section className="py-24 lg:py-36">
          <Container>
            <Status tone="good">Approved, 1 day off</Status>
            <h1 className="mt-8 max-w-[900px] text-balance text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-ink">This page took the day off.</h1>
            <p className="mt-8 max-w-[560px] text-[clamp(1.18rem,1.6vw,1.32rem)] leading-[1.5] text-ink-2">It may have moved, or it was never here. Everything else is where you left it.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/" kind="ink" size="lg">
                Back home
              </ButtonLink>
              <Link href="/contact" className="inline-flex h-[52px] items-center rounded-[14px] px-6 text-[17px] font-medium text-ink-2 transition-colors hover:text-ink">
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
