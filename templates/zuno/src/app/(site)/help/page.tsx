import type { Metadata } from "next";
import { HelpCenter } from "@/components/pages/resources";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Help center",
  description: "Answers about deposits, withdrawals, Autopilot, taxes, security and your account.",
};

export default function HelpPage() {
  return (
    <main id="main">
      <PageHero lead="How can" tail="we help?">
        <div className="mt-12">
          <HelpCenter />
        </div>
      </PageHero>
      <section className="mx-auto max-w-[1280px] px-5 pb-28 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[20px] border border-white/[0.08] bg-ink-2 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em]">Still stuck?</h2>
            <p className="mt-1 text-[17px] text-white/70">Real people, 24/7. Median reply time is four minutes in the app.</p>
          </div>
          <ButtonLink href="/contact">Contact support</ButtonLink>
        </div>
      </section>
    </main>
  );
}
