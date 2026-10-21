import type { Metadata } from "next";
import { wrap } from "@/site/sheet";
import { Team } from "@/site/team";

export const metadata: Metadata = {
  title: "Team",
  description: "Your basedraft team: invite people, see who's on it, and manage your seats.",
};

export default function TeamPage() {
  return (
    <main id="main" className={`${wrap} pt-[104px]`}>
      <header className="bd-reveal mx-auto mb-16 max-w-[716px] text-center">
        <h1 className="text-balance text-display">Team</h1>
        <p className="mx-auto mt-5 max-w-[520px] text-pretty text-lead text-muted">Ten seats on one license. Everyone you invite has Pro while they&apos;re on your team, client work included.</p>
      </header>
      <Team />
    </main>
  );
}
