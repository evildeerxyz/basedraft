"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { AiChat, ChatComposer, ChatThread, type ChatMessage, type ChatPart } from "../../pro-ui/ai-chat";

/* What the assistant says back, word by word, after rewriting a section. */
const REPLY =
  "I rewrote Zuno's hero. The promise is shorter now: Money that manages itself. The line under it says what Zuno does in plain words, and the one action is Get started. Want me to publish it to GitHub?";

/** A scripted assistant: it thinks, runs a tool, then writes its reply a word at a time. No network. */
function useScriptedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const patch = (id: string, parts: ChatPart[], status: ChatMessage["status"]) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, parts, status } : x)));

  const send = (text: string) => {
    const id = `a${Date.now()}`;
    setMessages((m) => [...m, { id: `u${id}`, role: "user", content: text }, { id, role: "assistant", status: "thinking", parts: [] }]);
    const tool = { id: "t", name: "edit_section", title: "Rewrite Zuno's hero", input: '{ "section": "hero", "tone": "plain" }' };
    later(700, () => patch(id, [{ type: "tool", tool: { ...tool, status: "running" } }], "streaming"));
    const words = REPLY.split(/(?<=\s)/);
    later(1600, () => {
      words.forEach((_, i) => later(i * 45, () => patch(id, [{ type: "tool", tool: { ...tool, status: "done", output: "Hero updated: 2 lines, 1 action" } }, { type: "text", text: words.slice(0, i + 1).join("") }], i === words.length - 1 ? "done" : "streaming")));
    });
  };
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages((m) => m.map((x) => (x.status === "thinking" || x.status === "streaming" ? { ...x, status: "done" } : x)));
  };
  return { messages, send, stop };
}

export function Demo() {
  const chat = useScriptedChat();
  return (
    <div className="h-[420px] w-full max-w-[620px]">
      <AiChat messages={chat.messages} onSend={chat.send} onStop={chat.stop} suggestions={["Rewrite Zuno's hero", "Add a pricing section", "Make it dark"]} followUps={["Publish to GitHub", "Undo that"]} />
    </div>
  );
}

const THREAD: ChatMessage[] = [
  { id: "1", role: "user", content: "Publish the new hero to GitHub." },
  {
    id: "2",
    role: "assistant",
    status: "done",
    parts: [
      { type: "tool", tool: { id: "p", name: "publish_to_github", title: "Publish to GitHub", status: "done", input: '{ "repo": "fieldwork/zuno-site" }', output: "Opened pull request #42" } },
      { type: "text", text: "Done. It's pull request #42 on fieldwork/zuno-site, ready for review." },
    ],
  },
  { id: "3", role: "user", content: "And deploy it." },
  { id: "4", role: "assistant", status: "error", content: "The deploy didn't start: the repository isn't connected to a host yet." },
];

function Thread() {
  return (
    <div className="h-[380px] w-full max-w-[600px] rounded-[20px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_var(--bd-line)]">
      <ChatThread messages={THREAD} onRetry={() => {}} />
    </div>
  );
}

function Empty() {
  const chat = useScriptedChat();
  return (
    <div className="h-[360px] w-full max-w-[560px]">
      <AiChat messages={chat.messages} onSend={chat.send} onStop={chat.stop} suggestions={["Rewrite the hero", "Add an FAQ", "Make it dark"]} />
    </div>
  );
}

function Composer() {
  return (
    <div className="w-full max-w-[560px]">
      <ChatComposer onSend={() => {}} onAttach={() => {}} accept="image/*,.tsx" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { thread: Thread, empty: Empty, composer: Composer };
