import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { AccountMenu, type AccountStatus } from "@/components/basedraft/account-menu";

export function You({ status, setStatus }: { status: AccountStatus; setStatus: (s: AccountStatus) => void }) {
  return (
    <AccountMenu
      user={{ name: "Emily Carter", email: "emily@acme.com" }}
      status={status}
      onStatusChange={setStatus}
      onNoteChange={saveNote}
      workspaces={[
        { id: "acme", name: "Acme", role: "Owner" },
        { id: "personal", name: "Personal", role: "Hobby" },
      ]}
      workspace="acme"
      onWorkspaceChange={switchTo}
      onPreferences={openPreferences}
      onSignOut={signOut}
    />
  );
}`,
  use: ["Where people work together and need to know who's around: a team app's sidebar foot, or a header's right end as just your face.", "Save the status and the note from their callbacks, and show the same dot on faces elsewhere in the app.", "In an AppSidebar, pass it as account, with trigger=\"face\" when the sidebar is on its rail."],
  avoid: ["For actions on something else: use Menu.", "For an app with no one else in it: a plain sign-out button says enough."],
  parts: [
    {
      name: "AccountMenu",
      note: "Your face, and the panel it opens.",
      props: [
        { name: "user", type: "{ name; email?; avatar? }", note: "You. Without an avatar, your face is dithered from your name.", required: true },
        { name: "status", type: '"here" | "focus" | "away"', note: "Where you are, when you control it: here, focusing or away." },
        { name: "defaultStatus", type: '"here" | "focus" | "away"', default: '"here"', note: "Where you are at first." },
        { name: "onStatusChange", type: "(status) => void", note: "Told when you choose another." },
        { name: "note", type: "string", note: "What you're on, when you control it; shown under your name." },
        { name: "defaultNote", type: "string", note: "What you're on at first." },
        { name: "onNoteChange", type: "(note) => void", note: "Told as you type it." },
        { name: "workspaces", type: "AccountWorkspace[]", note: "Your workspaces: id, name, logo and your role in each. Two or more show a switcher." },
        { name: "workspace", type: "string", note: "The one you're in." },
        { name: "onWorkspaceChange", type: "(id) => void", note: "Told when you pick another." },
        { name: "onPreferences", type: "() => void", note: "Adds Preferences to the foot." },
        { name: "onSignOut", type: "() => void", note: "Adds Sign out to the foot." },
        { name: "trigger", type: '"row" | "face"', default: '"row"', note: "Row: face, name and what you're on. Face: just your face, with its dot." },
        { name: "side", type: '"top" | "bottom"', default: '"top"', note: "Which way it opens, if there's room." },
        { name: "align", type: '"start" | "end"', default: '"start"', note: "Which edge of the button it lines up with." },
      ],
    },
  ],
  examples: [{ id: "face", title: "Just your face", note: "For a header's right end: the dot says where you are without opening it.", code: `<AccountMenu user={me} trigger="face" side="bottom" align="end" onSignOut={signOut} />` }],
  keyboard: [
    { keys: "Enter or Space", does: "On your face: opens the panel, on the status you have." },
    { keys: "Left Right", does: "Among Here, Focus and Away: moves and chooses." },
    { keys: "Tab", does: "On to what you're on, the workspaces and the foot." },
    { keys: "Escape", does: "Closes it and gives the focus back to your face." },
  ],
  a11y: ["The statuses are a radio group; your face is read with where you are.", "The status is said in words beside its dot, never by color alone."],
};
