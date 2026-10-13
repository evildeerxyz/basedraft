import type { Metadata } from "next";
import { LegalDoc } from "@/components/site/Legal";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Our commitment to making Zuno usable by everyone, the standards we test against and how to report a barrier.",
};

export default function AccessibilityPage() {
  return (
    <LegalDoc
      title="Accessibility"
      updated="October 1, 2026"
      intro={<p>Managing your money shouldn&apos;t depend on how you see, hear, move or read. We build Zuno to work for everyone, and we test it with the people who use it.</p>}
      sections={[
        {
          id: "standard",
          title: "Our standard",
          body: (
            <p>
              We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA across our website, iOS and Android apps. New features are reviewed
              against this standard before they ship.
            </p>
          ),
        },
        {
          id: "what-we-do",
          title: "What we do",
          body: (
            <ul>
              <li>Every screen supports VoiceOver, TalkBack and full keyboard navigation.</li>
              <li>Text scales with your system setting up to 310% without hiding content.</li>
              <li>Body text meets a contrast ratio of at least 4.5:1, and we never use color alone to show gains or losses.</li>
              <li>Charts have text summaries, and every chart value can be read by a screen reader.</li>
              <li>Animations respect the Reduce Motion setting on your device.</li>
              <li>Face ID and passkeys work alongside a PIN, so you&apos;re never locked into one method.</li>
            </ul>
          ),
        },
        {
          id: "testing",
          title: "How we test",
          body: (
            <p>
              Each release goes through automated checks and manual testing with screen readers. Twice a year, an independent firm audits the apps and website, and we
              run paid research sessions with members who use assistive technology. We publish a summary of each audit on this page.
            </p>
          ),
        },
        {
          id: "known-issues",
          title: "Known issues",
          body: (
            <>
              <p>We know about these gaps and are working on them:</p>
              <ul>
                <li>Some older PDF tax documents are not fully tagged. Tagged versions are available on request, and all 2026 documents are tagged.</li>
                <li>The interactive retirement planner&apos;s drag gesture has a keyboard alternative, but not yet a voice control shortcut.</li>
              </ul>
            </>
          ),
        },
        {
          id: "alternatives",
          title: "Alternative formats",
          body: (
            <p>
              We can provide statements and documents in large print, Braille or audio at no cost. Support is available by chat, email, video relay and TTY. Ask in the
              app or email <a href="mailto:access@zuno.com">access@zuno.com</a>.
            </p>
          ),
        },
        {
          id: "feedback",
          title: "Report a barrier",
          body: (
            <p>
              If something in Zuno is hard to use, tell us at <a href="mailto:access@zuno.com">access@zuno.com</a>. A member of our accessibility team will reply within
              two business days, and we&apos;ll help you complete whatever you were trying to do in the meantime.
            </p>
          ),
        },
      ]}
    />
  );
}
