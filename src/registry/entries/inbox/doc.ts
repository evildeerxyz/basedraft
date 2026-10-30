import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Inbox, type InboxItem } from "@/components/basedraft/inbox";

const items: InboxItem[] = [
  {
    id: "1",
    actor: "Riley Parker",
    text: "bought Zuno",
    note: "$79, paid with Whop",
    day: "Today",
    time: "2m",
  },
  {
    id: "2",
    actor: "Olivia Bennett",
    text: "invited you to Parker Studio",
    day: "Today",
    time: "1h",
    mention: true,
    actions: [
      {
        label: "Accept",
        primary: true,
        onClick: () => ({ actions: undefined, note: "You joined" }),
      },
      { label: "Decline" },
    ],
  },
];

export function Bell() {
  return (
    <Inbox
      defaultItems={items}
      footer={<a href="/settings/notifications">Notification settings</a>}
    />
  );
}`,
  use: [
    "For what happened while someone was away: purchases, invites, mentions, updates.",
    "Inbox puts the card behind a bell with a rolling unread count; InboxPanel is the card alone, for a page or a sheet.",
    "inboxWhen(date) gives each item its day heading and short time.",
  ],
  avoid: [
    "For a note that something just happened in front of you: use Toast.",
    "For a long history with filters and search: use DataTable.",
  ],
  parts: [
    {
      name: "Inbox",
      note: "A bell with an unread count that rolls, opening the card beside it. It flips when there's no room.",
      props: [
        { name: "items / defaultItems", type: "InboxItem[]", note: "The notifications, kept by you or by the inbox." },
        { name: "onItemsChange", type: "(items) => void", note: "Hears every change: a row marked, all marked, an action's changes." },
        { name: "onOpenItem", type: "(item) => void", note: "Called when a row is opened, by a click or Enter. It's marked read either way." },
        { name: "open / defaultOpen", type: "boolean", default: "false", note: "Whether the card is open." },
        { name: "onOpenChange", type: "(open) => void", note: "Hears it open and close." },
        { name: "side", type: '"top" | "bottom"', default: '"bottom"', note: "Which side of the bell the card opens on." },
        { name: "align", type: '"start" | "center" | "end"', default: '"end"', note: "How the card lines up with the bell." },
        { name: "label", type: "string", default: '"Notifications"', note: "The bell's name for screen readers, with the unread count added." },
        { name: "panelClassName", type: "string", note: "Classes for the card: its width and height." },
      ],
    },
    {
      name: "InboxPanel",
      note: "The card: a heading with Mark all read, tabs for All, Unread and Mentions on a sliding pill, and the items grouped by day.",
      props: [
        { name: "defaultTab", type: '"all" | "unread" | "mentions"', default: '"all"', note: "The tab it opens on." },
        { name: "title", type: "string", default: '"Notifications"', note: "The heading." },
        { name: "empty", type: "Partial<Record<tab, { title, note? }>>", note: "What each tab says when it has nothing to show." },
        { name: "footer", type: "ReactNode", note: "Something under the list: settings, or every notification." },
      ],
    },
    {
      name: "InboxItem",
      note: "One notification.",
      props: [
        { name: "id", type: "string", note: "Unique in the inbox.", required: true },
        { name: "text", type: "string", note: "What happened, after the actor's name: \"bought Zuno\".", required: true },
        { name: "day", type: "string", note: "The heading it's grouped under: \"Today\".", required: true },
        { name: "time", type: "string", note: "When, short: \"2m\", \"9:41 AM\".", required: true },
        { name: "actor", type: "string", note: "Who did it, as their face and in bold." },
        { name: "avatar", type: "string", note: "Their picture; initials on a tint without one." },
        { name: "icon", type: "ReactNode", note: "For what the product sends itself, or a small badge on the actor's face." },
        { name: "note", type: "string", note: "A line under it: what they wrote, an amount, a file." },
        { name: "read", type: "boolean", note: "Read items lose their dot and their weight." },
        { name: "mention", type: "boolean", note: "Shows it under Mentions." },
        { name: "actions", type: "InboxAction[]", note: "Buttons under the text. Pressing one marks it read and can change it." },
      ],
    },
  ],
  examples: [
    { id: "panel", title: "The card on a page", note: "InboxPanel alone, with a footer link.", code: `<InboxPanel
  defaultItems={items}
  footer={<a href="/notifications">See every notification</a>}
/>` },
    { id: "mentions", title: "Opening on Mentions", note: "With an empty state of its own for each tab.", code: `<InboxPanel
  defaultItems={items}
  defaultTab="mentions"
  empty={{
    mentions: {
      title: "No mentions",
      note: "When someone names you, it lands here.",
    },
  }}
/>` },
    { id: "empty", title: "All caught up", note: "Nothing yet: the empty state for All.", code: `<InboxPanel
  defaultItems={[]}
  empty={{
    all: {
      title: "All caught up",
      note: "New purchases and invites show up here.",
    },
  }}
/>` },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "Opens the card from the bell, or opens the focused item and marks it read." },
    { keys: "Up / Down", does: "Moves between items. Down from the tabs goes into the list." },
    { keys: "Home / End", does: "Goes to the first or last item, or the first or last tab." },
    { keys: "R", does: "Marks the focused item read, or unread again." },
    { keys: "Left / Right", does: "Moves between the tabs." },
    { keys: "Esc", does: "Closes the card and returns focus to the bell." },
  ],
  a11y: [
    "The bell's name carries the unread count: \"Notifications, 3 unread\".",
    "The tabs are a tablist; each item says whether it's read.",
    "Each unread item says so first, for screen readers; the dot is only for the eye.",
    "A swipe marks an item read or unread; R does the same from the keyboard. When an item leaves the Unread tab, focus moves to the one beside it.",
  ],
};
