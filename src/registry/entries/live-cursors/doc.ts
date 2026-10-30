import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { LiveCursors, Viewers } from "@/components/basedraft/live-cursors";

export function Board({ others, me }) {
  const [following, setFollowing] = useState<string | null>(null);
  return (
    <>
      <Viewers people={others} following={following} onFollow={setFollowing} />
      <LiveCursors people={others} you={me} following={following} onStopFollowing={() => setFollowing(null)} onMessage={send}>
        <Canvas />
      </LiveCursors>
    </>
  );
}`,
  use: [
    "Over anything people work on together: a board, a doc, a design, a dashboard everyone's looking at.",
    "Feed people from your realtime layer (Liveblocks, PartyKit, Supabase Realtime): positions as parts of the surface, 0 to 1, so they hold at any size.",
    "Viewers on its own in a header, to show who's here and let someone follow another's view.",
  ],
  avoid: [
    "With one person: it's for company.",
    "For dozens of people at once: show the stack, and the cursors only of those nearby.",
  ],
  parts: [
    {
      name: "LiveCursors",
      note: "Wraps the shared surface and draws everyone else over it.",
      props: [
        { name: "people", type: "Presence[]", note: "Everyone else: who they are, and their x and y from 0 to 1, with a message, typing, a selection or idle.", required: true },
        { name: "children", type: "ReactNode", note: "The shared surface.", required: true },
        { name: "you", type: "Person", note: "Your name and color. With it, / opens a bubble at your pointer." },
        { name: "onMessage", type: "(text: string) => void", note: "Runs with what you said; send it to the others." },
        { name: "following", type: "string | null", note: "Whose view you follow: the surface is framed in their color." },
        { name: "onStopFollowing", type: "() => void", note: "Runs when Esc or the frame's pill stops following." },
        { name: "className", type: "string", note: "Added to the wrapper; give it the surface's corner radius." },
      ],
    },
    {
      name: "Viewers",
      note: "Everyone here as overlapping faces, ringed in their color.",
      props: [
        { name: "people", type: "Person[]", note: "Who's here: id, name, color and an optional avatar.", required: true },
        { name: "max", type: "number", default: "4", note: "Faces before the rest fold into +N." },
        { name: "following", type: "string | null", note: "Whose face is ringed as followed." },
        { name: "onFollow", type: "(id: string | null) => void", note: "Runs when a face is chosen, or with null to stop." },
      ],
    },
  ],
  examples: [
    {
      id: "faces",
      title: "Just the faces",
      note: "Viewers over a doc's title; the followed face is ringed thicker, and the rest fold into +2.",
      code: `<Viewers people={here} max={4} following={following} onFollow={setFollowing} />`,
    },
  ],
  keyboard: [
    { keys: "/", does: "With your pointer over the surface, or the surface focused, opens your bubble." },
    { keys: "Enter", does: "Says it." },
    { keys: "Esc", does: "Closes your bubble, or stops following." },
    { keys: "Tab", does: "Moves through the faces; Enter follows or stops following." },
  ],
  a11y: [
    "The cursors are drawn only; what people say is announced politely, with their names.",
    "Each face is a button that says whether it follows or stops following that person.",
    "With reduced motion, cursors jump to where people are instead of gliding.",
  ],
};
