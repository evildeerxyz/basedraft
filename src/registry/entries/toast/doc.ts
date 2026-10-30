import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `// Once, near the root of the app:
import { Toaster } from "@basedraft/ui";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

// Then from anywhere:
import { toast } from "@basedraft/ui";

toast("Published to GitHub", {
  tone: "ok",
  description: "larkspur/zuno-site is up to date.",
});`,
  use: [
    "To say that something happened, without stopping the work: a save, a send, a publish.",
    "To say something failed, with one way to try again.",
    "For a step that takes a moment: show it waiting, then update the same toast when it's done.",
    "To offer an undo right after a change that's easy to reverse.",
  ],
  avoid: [
    "For something the person must answer before going on: use Dialog.",
    "For an error in a form: say it beside the field, where it can be fixed.",
    "For anything they'll need to read twice: toasts leave on their own.",
  ],
  parts: [
    {
      name: "Toaster",
      note: "Where the toasts appear. Mount it once, near the root; if a second one is mounted, only the first draws, and the next takes over if it goes.",
      props: [
        { name: "position", type: '"bottom-right" | "bottom-center" | "bottom-left"', default: '"bottom-right"', note: "The corner. On phones they span the bottom of the screen." },
        { name: "label", type: "string", default: '"Notifications"', note: "The region's name for screen readers." },
      ],
    },
    {
      name: "toast(title, options)",
      note: "Shows a toast and returns its id. Works from anywhere: a click, a fetch, a promise.",
      props: [
        { name: "title", type: "ReactNode", required: true, note: "What happened, in a few words." },
        { name: "options.description", type: "ReactNode", note: "A line under it." },
        { name: "options.tone", type: '"default" | "ok" | "wait" | "stop"', default: '"default"', note: "A status dot: green, a pulsing amber, or red. A stop toast is announced at once." },
        { name: "options.action", type: "{ label: string; onClick: () => void }", note: "One button on the toast. Pressing it runs onClick and dismisses the toast." },
        { name: "options.duration", type: "number", default: "4500", note: "How long it stays, in milliseconds. Infinity keeps it until it's dismissed or updated." },
      ],
    },
    {
      name: "toast.update(id, title, options)",
      note: "Changes a toast in place, and starts its time over. Turns a waiting toast into a done one.",
      props: [
        { name: "id", type: "number", required: true, note: "What toast() returned." },
        { name: "title", type: "ReactNode", required: true, note: "The new title." },
        { name: "options", type: "ToastOptions", note: "The same options as toast(). The tone carries over if you leave it out." },
      ],
    },
    {
      name: "toast.dismiss(id?)",
      note: "Dismisses one toast, or every toast when there's no id.",
      props: [{ name: "id", type: "number", note: "What toast() returned." }],
    },
  ],
  examples: [
    {
      id: "tones",
      title: "Four tones",
      note: "Plain for small news, ok when it's done, wait while it runs, stop when it didn't work.",
      code: `toast("Draft saved");
toast("Template bought", {
  tone: "ok",
  description: "Zuno is on your Purchases page.",
});
toast("Building the zip", {
  tone: "wait",
  description: "Next.js 16, about 10 seconds.",
});
toast("That code has run out", {
  tone: "stop",
  description: "Ask for a new one; it takes a second.",
});`,
    },
    {
      id: "update",
      title: "Waiting, then done",
      note: "One toast through the whole step: it waits with no time limit, then toast.update says it's done and gives it the usual time.",
      code: `const id = toast("Publishing to GitHub", {
  tone: "wait",
  description: "larkspur/zuno-site, 61 files",
  duration: Infinity,
});

await publish();
toast.update(id, "Published to GitHub", {
  tone: "ok",
  description: "larkspur/zuno-site is up to date.",
  action: { label: "Open repository", onClick: openRepo },
});`,
    },
    {
      id: "action",
      title: "With an undo",
      note: "An action gives a way back. A longer duration leaves time to use it.",
      code: `toast("Section deleted", {
  description: "The pricing section is gone from Zuno's home page.",
  action: { label: "Undo", onClick: restore },
  duration: 8000,
});`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Reaches each toast's action and its dismiss button, in order with the page." },
    { keys: "Enter / Space", does: "On the action or the dismiss button, presses it." },
    { keys: "Esc", does: "With focus in a toast, dismisses it." },
  ],
  a11y: [
    'Toasts sit in a region named Notifications. Each has role="status", so screen readers announce it politely when it appears; a stop toast has role="alert" and is announced at once.',
    "Pointing at the stack or moving focus into it spreads the toasts out and stops their timers, so they can't leave mid-sentence.",
    "Each has a Dismiss button; swiping to the right does the same on touch.",
    "With reduced motion they fade in and out instead of rising and sliding.",
  ],
};
