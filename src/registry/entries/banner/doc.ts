import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import Link from "next/link";
import { Banner } from "@basedraft/ui";

export function SiteBanner() {
  return (
    <Banner badge="New" href="/changelog" cta="See what's new" link={Link} dismissible storageKey="banner-autopilot">
      Autopilot now harvests tax losses daily
    </Banner>
  );
}`,
  use: [
    "Across the top of a site or an app, for one thing worth knowing now: a launch, a sale, maintenance.",
    "Give it several messages when there's more than one, and they roll up in turn.",
    "Give it a storageKey with dismissible, so people who close it don't see it again on every page.",
  ],
  avoid: [
    "For a note about what's on this page: use Alert.",
    "For something that just happened, after an action: use Toast.",
    "For anything people must act on before going on: use Dialog.",
  ],
  parts: [
    {
      name: "Banner",
      note: "A region across the top, named Announcement.",
      props: [
        { name: "children", type: "ReactNode", note: "The message, when there's one." },
        { name: "messages", type: "ReactNode[]", note: "Several messages, rolled through in turn." },
        { name: "interval", type: "number", default: "4500", note: "How long each message stays, in ms." },
        { name: "variant", type: '"ink" | "paper"', default: '"ink"', note: "In ink, or on paper with a hairline under it." },
        { name: "badge", type: "ReactNode", note: "A small label before the message: New, Sale, Live." },
        { name: "href", type: "string", note: "Where the link goes." },
        { name: "cta", type: "string", default: '"Read more"', note: "What the link says." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, like Next.js's Link." },
        { name: "dismissible", type: "boolean", default: "false", note: "Shows a close button; closing folds the bar away." },
        { name: "storageKey", type: "string", note: "Remembers it was closed, in this browser, under this key." },
        { name: "onDismiss", type: "() => void", note: "Runs once it has folded away." },
      ],
    },
  ],
  examples: [
    { id: "paper", title: "On paper", note: "Quieter, for a site that's light at the top.", code: `<Banner variant="paper" badge="Sale" href="/pricing" cta="Get Pro">Every template, 30% off until Sunday</Banner>` },
    { id: "remember", title: "Stays closed", note: "With storageKey, it stays closed in this browser, page after page.", code: `<Banner dismissible storageKey="banner-maintenance">Scheduled maintenance Sunday, 2 to 3 AM UTC</Banner>` },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves to the link, then the close button." },
    { keys: "Enter", does: "Follows the link, or closes the banner." },
  ],
  a11y: [
    "A region named Announcement, so it can be found among the landmarks and skipped.",
    "Rolling messages pause while the banner is pointed at or focused, and stay still with reduced motion.",
    "The close button is named Close the announcement.",
  ],
};
