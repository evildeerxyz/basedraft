import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHead } from "@/site/heads";
import { Purchases } from "@/site/purchases";

export const metadata: Metadata = {
  title: "Purchases",
  description: "Your basedraft templates, ready to download or send to GitHub.",
};

export default function PurchasesPage() {
  return (
    <main id="main">
      <PageHead title="Purchases" lead="Everything you've bought, ready to take: download a template as a zip, or send it straight to a new GitHub repository." />
      {/* It reads the address (?download=, ?github=, ?checkout=), which only the browser knows. */}
      <Suspense fallback={<div className="h-[420px]" />}>
        <Purchases />
      </Suspense>
    </main>
  );
}
