import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Sign-in and sign-up get a quiet frame: logo home, help, and nothing else to distract. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Zuno home" className="rounded-[10px]">
          <Logo />
        </Link>
        <Link href="/help" className="text-[17px] text-white/70 transition-colors hover:text-white">
          Help
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-[1280px] px-5 pb-20 pt-8 lg:px-8 lg:pt-14">
        {children}
      </main>
    </div>
  );
}
