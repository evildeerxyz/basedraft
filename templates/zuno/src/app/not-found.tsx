import Link from "next/link";
import { NotFoundArt } from "@/components/site/NotFoundArt";
import { ButtonLink } from "@/components/site/ButtonLink";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1280px] items-center px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Zuno home">
          <Logo />
        </Link>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-12 px-5 pb-20 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-[18px] font-medium text-accent">Error 404</p>
          <h1 className="mt-4 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.05em]">
            This page is gone.
            <span className="text-white/45"> Your money isn&apos;t.</span>
          </h1>
          <p className="mt-7 max-w-[480px] text-[20px] leading-relaxed text-white/70">The link may be old or mistyped. Everything in your account is exactly where you left it.</p>
          <div className="mt-10 flex flex-wrap items-center gap-7">
            <ButtonLink href="/">Back to home</ButtonLink>
            <ButtonLink href="/help" kind="text">
              Visit the help center
            </ButtonLink>
          </div>
        </div>
        <NotFoundArt />
      </main>
    </div>
  );
}
