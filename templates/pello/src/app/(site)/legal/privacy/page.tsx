import type { Metadata } from "next";
import { PageHead, Prose } from "@/components/site/page";
import { Band } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What pello collects, why, where it's kept and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHead align="left" title="Privacy" lead="Last updated September 1, 2026. This is a template: have it checked by your own lawyer before you use it." />
      <Band inner="pb-28">
          <Prose>
            <h2>Who we are</h2>
            <p>pello Inc. makes HR software for companies. When a company uses pello, it decides what data goes in and what it&apos;s used for. We process that data for them, under the agreement we have with them.</p>
            <h2>What we collect</h2>
            <ul>
              <li><strong>From companies:</strong> the people they employ, their roles, pay, time off and the documents they upload, such as a handbook.</li>
              <li><strong>From people who use pello:</strong> their name, work email, the questions they ask and the requests they make.</li>
              <li><strong>From visitors to this site:</strong> the pages you visit and the forms you fill in. We don&apos;t use advertising cookies.</li>
            </ul>
            <h2>What we use it for</h2>
            <p>To run pello for the company that uses it: answering questions, handling requests, running payroll and writing reports. We don&apos;t sell data, and we never use one company&apos;s data to train models for another.</p>
            <h2>Where it&apos;s kept</h2>
            <p>In the EU (Frankfurt) or the US (Virginia), as the company chooses. It doesn&apos;t move between the two. The providers we use to run pello are listed on our security page.</p>
            <h2>How long we keep it</h2>
            <p>For as long as the company uses pello, and as long as the law requires for payroll records after that. When a company leaves, everything else is deleted within 30 days.</p>
            <h2>Your rights</h2>
            <p>You can ask to see, correct, export or delete what we hold about you. If your employer uses pello, ask them first, since they decide. Otherwise, write to privacy@pello.example and a person will reply within a week.</p>
          </Prose>
      </Band>
    </>
  );
}
