import type { Metadata } from "next";
import { StatusBoard } from "@/components/pages/resources";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "System status",
  description: "Live status and 90-day uptime for the Zuno apps, trading, transfers, Copilot and API.",
};

export default function StatusPage() {
  return (
    <main id="main">
      <PageHero lead="System" tail="status." intro="Live status for every part of Zuno. Subscribe in the app under Account, then Notifications.">
        <div className="mt-14">
          <StatusBoard />
        </div>
      </PageHero>
    </main>
  );
}
