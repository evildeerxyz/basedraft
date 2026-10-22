import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { AiChat, type ChatMessage } from "@/components/basedraft/ai-chat";

export function Assistant({
  messages,
  send,
  stop,
}: {
  messages: ChatMessage[];
  send: (text: string) => void;
  stop: () => void;
}) {
  return (
    <div className="h-[560px]">
      <AiChat
        messages={messages}
        onSend={send}
        onStop={stop}
        suggestions={["Rewrite the hero", "Add a pricing section"]}
      />
    </div>
  );
}`,
  use: [
    "For an assistant inside a product: it writes, runs tools, and you steer it in turns.",
    "Bring your own model and stream: set a reply's status to thinking, then streaming as words arrive, then done; its words and tool calls go in parts.",
    "ChatThread and ChatComposer are the two halves, for a layout of your own.",
  ],
  avoid: [
    "For a one-line search or a list of actions: use Command.",
    "For a note that something finished: use Toast.",
  ],
  parts: [
    {
      name: "AiChat",
      note: "The thread and the composer on one card, filling the height it's given. Before the first message it shows a title, a line and suggestions.",
      props: [
        { name: "messages", type: "ChatMessage[]", note: "The conversation, oldest first.", required: true },
        { name: "onSend", type: "(text, attachments) => void", note: "Called with what was written, trimmed, and the attached files' chips.", required: true },
        { name: "onStop", type: "() => void", note: "Stops the reply being written. Send turns into stop while it streams." },
        { name: "onRetry", type: "(messageId) => void", note: "Writes a reply again; adds Retry under replies." },
        { name: "streaming", type: "boolean", note: "Whether a reply is being written. Read from the last message by default." },
        { name: "suggestions", type: "string[]", note: "Things to ask before the first message. Choosing one sends it." },
        { name: "followUps", type: "string[]", note: "Short follow-ups over the composer once a reply is done." },
        { name: "onAttach", type: "(files: File[]) => void", note: "Lets files be attached by the clip or by dropping them." },
        { name: "accept", type: "string", note: "Which files the clip takes, as an input's accept." },
        { name: "placeholder", type: "string", default: '"Ask for a change"', note: "The composer's hint." },
        { name: "emptyTitle", type: "string", default: '"What should we change?"', note: "The title before the first message." },
        { name: "emptyNote", type: "string", note: "The line under it." },
        { name: "label", type: "string", default: '"Assistant"', note: "What the chat is, for screen readers." },
      ],
    },
    {
      name: "ChatMessage",
      note: "One turn.",
      props: [
        { name: "id", type: "string", note: "Unique in the thread.", required: true },
        { name: "role", type: '"user" | "assistant"', note: "Who wrote it. The assistant writes on the page; you write in a quiet pill.", required: true },
        { name: "content", type: "string", note: "The text, for a message that's only text." },
        { name: "parts", type: "ChatPart[]", note: "Text and tool calls in order, for a reply that runs tools along the way." },
        { name: "status", type: '"thinking" | "streaming" | "done" | "error"', note: "Thinking shows the dither dots; streaming reveals words with a soft cursor; error offers Try again." },
        { name: "attachments", type: "ChatAttachment[]", note: "Files that came with it, as chips." },
      ],
    },
    {
      name: "ChatToolCall",
      note: "A tool the assistant ran, as a card that opens to show what it was given and what came back.",
      props: [
        { name: "id", type: "string", note: "Unique in the message.", required: true },
        { name: "name", type: "string", note: "The tool's name: \"publish_to_github\".", required: true },
        { name: "title", type: "string", note: "What it's doing, in words. The name by default." },
        { name: "status", type: '"running" | "done" | "error"', note: "Running shimmers; done and error settle with a mark.", required: true },
        { name: "input", type: "string", note: "What it was given, in mono when opened." },
        { name: "output", type: "ReactNode", note: "What came back." },
      ],
    },
    {
      name: "ChatThread",
      note: "The messages alone, scrolling: it keeps the newest words in view while you're at the bottom, and shows Jump to latest when you've scrolled up.",
      props: [
        { name: "messages", type: "ChatMessage[]", note: "The conversation.", required: true },
        { name: "onRetry", type: "(messageId) => void", note: "Shows Retry under replies." },
        { name: "empty", type: "ReactNode", note: "What shows before the first message." },
        { name: "label", type: "string", default: '"Conversation"', note: "For screen readers." },
      ],
    },
    {
      name: "ChatComposer",
      note: "Where you write: a field that grows with what's typed, attached files above it, send or stop at its corner.",
      props: [
        { name: "onSend", type: "(text, attachments) => void", note: "Called on Enter or send.", required: true },
        { name: "streaming", type: "boolean", default: "false", note: "Turns send into stop." },
        { name: "onStop", type: "() => void", note: "What stop does." },
        { name: "onAttach", type: "(files: File[]) => void", note: "Shows the clip and takes dropped files." },
        { name: "disabled", type: "boolean", default: "false", note: "Turns it off." },
        { name: "autoFocus", type: "boolean", note: "Focuses it when it appears." },
      ],
    },
  ],
  examples: [
    { id: "thread", title: "A finished thread", note: "A reply that ran a tool, and one that failed with Try again.", code: `<ChatThread messages={thread} onRetry={retry} />` },
    { id: "empty", title: "Before the first message", note: "Suggestions to start with; choosing one sends it.", code: `<AiChat
  messages={[]}
  onSend={send}
  suggestions={["Rewrite the hero", "Add an FAQ", "Make it dark"]}
/>` },
    { id: "composer", title: "The composer on its own", note: "With files: attach by the clip or by dropping them.", code: `<ChatComposer onSend={send} onAttach={attach} accept="image/*,.tsx" />` },
  ],
  keyboard: [
    { keys: "Enter", does: "Sends what's written." },
    { keys: "Shift + Enter", does: "Starts a new line." },
    { keys: "Esc", does: "Stops a reply that's streaming, from the composer." },
    { keys: "Tab", does: "Moves through the thread's actions, then the composer." },
  ],
  a11y: [
    "The thread is a log: new replies are announced once they finish, not word by word.",
    "Thinking, tool status and errors are spoken as words, not only shown.",
    "Reduced motion reveals replies whole and drops the cursor and the shimmer.",
  ],
};
