import type { Metadata } from "next";
import { LegalDoc } from "@/components/site/Legal";
import { DataTable } from "@/components/site/DataTable";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Zuno collects, why, who we share it with, and how to control it.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy policy"
      updated="October 1, 2026"
      intro={
        <p>
          We collect what we need to run your account and meet our legal duties, and nothing we&apos;d be uncomfortable explaining. We don&apos;t sell your data, and
          we don&apos;t use it to train AI models that serve other customers.
        </p>
      }
      sections={[
        {
          id: "what-we-collect",
          title: "What we collect",
          body: (
            <DataTable
              caption="Data Zuno collects"
              align="left"
              columns={["Category", "Examples", "Why"]}
              rows={[
                ["Identity", "Name, date of birth, SSN, ID document", "Required by law to open an account"],
                ["Contact", "Email, phone, address", "Statements, security alerts, support"],
                ["Financial", "Income, net worth, goals, linked bank accounts", "Choosing and adjusting your portfolio"],
                ["Activity", "Trades, transfers, Copilot conversations", "Running your account and improving answers"],
                ["Device", "Device model, OS version, IP address", "Fraud prevention and security"],
              ]}
            />
          ),
        },
        {
          id: "how-we-use-it",
          title: "How we use it",
          body: (
            <ul>
              <li>To verify your identity and keep your account secure.</li>
              <li>To manage your portfolio, process transfers and produce tax documents.</li>
              <li>To answer your Copilot questions with your own numbers.</li>
              <li>To meet our obligations to regulators, including record keeping and suspicious activity reporting.</li>
              <li>To improve Zuno, using aggregated or de-identified data wherever we can.</li>
            </ul>
          ),
        },
        {
          id: "copilot",
          title: "Copilot and AI",
          body: (
            <>
              <p>
                Copilot reads your account data only while answering your question. Conversations are stored in your account so you can scroll back, and so licensed
                advisers can review a small sample for quality.
              </p>
              <p>
                We use model providers under contracts that forbid them from storing your data or using it for training. You can delete your Copilot history at any time
                in <strong>Settings, Privacy</strong>. We keep the minimum record that securities law requires.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who we share it with",
          body: (
            <>
              <p>We share data only with:</p>
              <ul>
                <li>our clearing firm and program banks, to hold your money and securities;</li>
                <li>identity verification, fraud prevention and bank linking providers;</li>
                <li>regulators and law enforcement, when the law requires it;</li>
                <li>anyone else, only with your explicit permission.</li>
              </ul>
              <p>We never sell personal data, and we don&apos;t share it with advertisers.</p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <p>
              Securities rules require us to keep account records for at least six years after an account closes. After that, we delete or anonymize them. Marketing
              preferences and device data are deleted within 90 days of closing your account.
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your choices and rights",
          body: (
            <>
              <p>
                You can download a copy of your data, correct it or ask us to delete what we&apos;re not required to keep. Residents of California and other states with
                privacy laws have additional rights, and we extend the same choices to everyone.
              </p>
              <p>
                Email <a href="mailto:privacy@zuno.com">privacy@zuno.com</a> or use <strong>Settings, Privacy</strong> in the app. We respond within 30 days.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              Our website uses strictly necessary cookies to keep you signed in and secure. We use privacy-friendly analytics without cross-site tracking. We don&apos;t
              use advertising cookies.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions about privacy go to our Data Protection Officer at <a href="mailto:privacy@zuno.com">privacy@zuno.com</a>, or by mail to Zuno Technologies Inc.,
              225 Varick Street, 6th floor, New York, NY 10014.
            </p>
          ),
        },
      ]}
    />
  );
}
