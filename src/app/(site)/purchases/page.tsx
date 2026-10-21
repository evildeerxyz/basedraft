import type { Metadata } from "next";
import { Suspense } from "react";
import { Purchases } from "@/site/purchases";
import { wrap } from "@/site/sheet";

export const metadata: Metadata = {
  title: "Purchases",
  description: "Your basedraft templates, ready to download or send to GitHub.",
};

export default function PurchasesPage() {
  return (
    <main id="main" className={`${wrap} pt-[104px]`}>
      <header className="bd-reveal mx-auto mb-16 max-w-[716px] text-center">
        <h1 className="text-balance text-display">Purchases</h1>
        <p className="mx-auto mt-5 max-w-[520px] text-pretty text-lead text-muted">Everything you&apos;ve bought, ready to take: download a template as a zip, or send it straight to a new GitHub repository.</p>
      </header>
      {/* It reads the address (?download=, ?github=, ?checkout=), which only the browser knows. */}
      <Suspense fallback={<div className="h-[420px]" />}>
        <Purchases />
      </Suspense>
    </main>
  );
}
