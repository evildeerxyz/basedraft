import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Commit } from "@/components/basedraft/commit";

export function LastCommit() {
  return (
    <Commit
      message="Round cart totals once, at checkout"
      sha="a1f9c2e47b0d3e5f8a91c2d4e6f7a8b9c0d1e2f3"
      branch="main"
      author="Jake Morrison"
      time="2h ago"
      href="https://github.com/acme/storefront/commit/a1f9c2e"
    />
  );
}`,
  use: [
    "Wherever a commit is the reason something happened: a deploy, a build, a release note.",
    "On one line in a list; the message truncates first, so the branch and the hash stay readable.",
    "Stacked at the head of a page about one commit or one deploy.",
  ],
  avoid: ["For a whole change with its lines: use Code diff.", "For a person alone: use Avatar."],
  parts: [
    {
      name: "Commit",
      props: [
        { name: "message", type: "string", note: "Its first line.", required: true },
        { name: "sha", type: "string", note: "The whole hash: seven characters show, and the whole one is copied.", required: true },
        { name: "branch", type: "string", note: "The branch it's on." },
        { name: "author", type: "string", note: "Who made it; their face comes from their name." },
        { name: "avatar", type: "string", note: "Their picture, if there is one." },
        { name: "time", type: "string", note: "When, as you want it read: \"2h ago\"." },
        { name: "href", type: "string", note: "Where the commit lives; the message becomes a link." },
        { name: "layout", type: "\"line\" | \"stack\"", default: "\"line\"", note: "One line for a list, or stacked for a page about it." },
        { name: "size", type: "\"md\" | \"lg\"", default: "\"md\"", note: "Stacked, how large the message reads: lg at the head of a page." },
      ],
    },
  ],
  examples: [{ id: "stack", title: "Stacked", note: "The message as a title, who and when under it, the branch and the hash at its end.", code: `<Commit layout="stack" message="Gift card balance at checkout" sha="7c2e9a1…" branch="feat/gift-cards" author="Sarah Mitchell" time="just now" />` }],
  keyboard: [{ keys: "Enter or Space on the hash", does: "Copies the whole hash." }],
  a11y: ["The hash is a button named for what it does: Copy commit a1f9c2e, then Copied.", "The author's name is read with the line even where only their face shows."],
};
