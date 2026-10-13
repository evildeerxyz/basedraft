import type { Metadata } from "next";
import { PageHead } from "@/site/heads";
import { Team } from "@/site/team";

export const metadata: Metadata = {
  title: "Team",
  description: "Your basedraft team: invite people, see who's on it, and work on drafts together.",
};

export default function TeamPage() {
  return (
    <main id="main">
      <PageHead title="Team" lead="Ten seats on one license. Everyone on your team has Pro, works on shared drafts together, and sees each other's cursors and comments in Studio." />
      <Team />
    </main>
  );
}
