import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Share } from "@/components/basedraft/share";

export function ShareRoadmap() {
  return (
    <Share
      title="Fourth quarter"
      url="https://relay.app/acme/roadmap"
      workspace="Acme"
      defaultPeople={[
        { id: "emily", name: "Emily Carter", email: "emily@acme.com", role: "owner", you: true },
        { id: "jake", name: "Jake Morrison", email: "jake@acme.com", role: "edit" },
      ]}
      onInvite={(emails, role) => invite(emails, role)}
    />
  );
}`,
  use: ["In a page's header, for a document, a board, a dashboard or a file that people work on together.", "Pass people you keep elsewhere with people and onPeopleChange, and save invites from onInvite.", "Name the workspace so the access choice reads Everyone at Acme."],
  avoid: ["For sending a public page to a social network: use the system share sheet.", "For a team's members as a whole: that's a page of its own, not a panel."],
  parts: [
    {
      name: "Share",
      note: "The button, and the panel it opens over the page.",
      props: [
        { name: "title", type: "string", note: "What's being shared, at the panel's head.", required: true },
        { name: "url", type: "string", note: "Its address, for Copy link.", required: true },
        { name: "workspace", type: "string", note: "The workspace's name, for Everyone at Acme." },
        { name: "people", type: "SharePerson[]", note: "Who has access, when you control it: id, name, email, role (owner, edit or view), you and invited." },
        { name: "defaultPeople", type: "SharePerson[]", default: "[]", note: "Who has access at first, when it keeps its own." },
        { name: "onPeopleChange", type: "(people) => void", note: "Told when someone is invited, changed or removed." },
        { name: "access", type: '"invited" | "workspace" | "link"', note: "Who else can open it, when you control it." },
        { name: "defaultAccess", type: '"invited" | "workspace" | "link"', default: '"workspace"', note: "Who else can open it at first." },
        { name: "onAccessChange", type: "(access) => void", note: "Told when that changes." },
        { name: "linkRole", type: '"view" | "edit"', note: "What the link lets people do, when more than the invited can open it." },
        { name: "defaultLinkRole", type: '"view" | "edit"', default: '"view"', note: "What the link lets people do at first." },
        { name: "onLinkRoleChange", type: "(role) => void", note: "Told when that changes." },
        { name: "onInvite", type: "(emails: string[], role) => void", note: "Told with the addresses invited and the role they get." },
        { name: "onCopy", type: "() => void", note: "Told after the link is copied." },
        { name: "label", type: "string", default: '"Share"', note: "The button's words." },
      ],
    },
  ],
  examples: [{ id: "private", title: "Only people invited", note: "Start it closed, for a draft.", code: `<Share title="Q1 plan, draft" url={url} defaultAccess="invited" defaultPeople={[me]} />` }],
  keyboard: [
    { keys: "Left Right", does: "On who can open it: moves and chooses." },
    { keys: "Enter", does: "In the invite field: makes what's typed a chip; on an empty field, sends the invites." },
    { keys: "Backspace", does: "On an empty field: takes back the last address." },
    { keys: "Escape", does: "Closes the panel and returns to the button." },
  ],
  a11y: ["The panel is a dialog named for what's shared; the focus starts on who can open it, a radio group.", "Roles open as listboxes driven by the arrow keys, Enter and Escape.", "An address that isn't an email shows in red, with the reason as its title."],
};
