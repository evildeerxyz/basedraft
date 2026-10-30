"use client";

import { ArticleIcon, BuildingsIcon, CalendarCheckIcon, ChatCircleTextIcon, EnvelopeSimpleIcon, FunctionIcon, GitBranchIcon, PlayIcon, UserPlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Flow, type FlowEdge, type FlowNode, type FlowStatus } from "../../pro-ui/flow";

/* A lead's way from signing up to the right next step. */
const NODES: FlowNode[] = [
  { id: "signup", x: 0, y: 140, kind: "Trigger", title: "New signup", icon: <UserPlusIcon weight="duotone" />, outputs: [{ id: "person", label: "Person" }], meta: "When someone signs up" },
  { id: "lookup", x: 248, y: 140, kind: "Action", title: "Look up company", icon: <BuildingsIcon weight="duotone" />, inputs: [{ id: "person", label: "Person" }], outputs: [{ id: "company", label: "Company" }], meta: "From their email's domain" },
  { id: "score", x: 496, y: 140, kind: "Function", title: "Score the lead", icon: <FunctionIcon weight="bold" />, inputs: [{ id: "company", label: "Company" }], outputs: [{ id: "score", label: "Score" }], meta: "0 to 100, from size and fit" },
  { id: "fit", x: 744, y: 140, kind: "Branch", title: "Is it a good fit?", icon: <GitBranchIcon weight="duotone" />, inputs: [{ id: "score", label: "Score" }], outputs: [{ id: "yes", label: "Over 70" }, { id: "no", label: "70 or under" }] },
  { id: "demo", x: 992, y: 0, kind: "Action", title: "Book a demo call", icon: <CalendarCheckIcon weight="duotone" />, inputs: [{ id: "lead", label: "Lead" }], meta: "Sends a booking link" },
  { id: "sales", x: 992, y: 150, kind: "Message", title: "Post in #sales", icon: <ChatCircleTextIcon weight="duotone" />, inputs: [{ id: "lead", label: "Lead" }], meta: "With the score and company" },
  { id: "nurture", x: 992, y: 300, kind: "Action", title: "Add to newsletter", icon: <EnvelopeSimpleIcon weight="duotone" />, inputs: [{ id: "lead", label: "Lead" }], meta: "Weekly, until they're ready" },
];
const join = (from: string, fromPort: string, to: string, toPort: string): FlowEdge => ({ id: `${from}.${fromPort}-${to}.${toPort}`, from, fromPort, to, toPort });
const EDGES: FlowEdge[] = [join("signup", "person", "lookup", "person"), join("lookup", "company", "score", "company"), join("score", "score", "fit", "score"), join("fit", "yes", "demo", "lead"), join("fit", "yes", "sales", "lead"), join("fit", "no", "nurture", "lead")];

/* A run, step by step: when each one starts and how it ends. */
const RUN: Array<[ms: number, changes: Record<string, FlowStatus>]> = [
  [0, { signup: "running" }],
  [700, { signup: "done", lookup: "running" }],
  [1600, { lookup: "done", score: "running" }],
  [2600, { score: "done", fit: "running" }],
  [3200, { fit: "done", demo: "running", sales: "running", nurture: "skipped" }],
  [4100, { demo: "done", sales: "done" }],
];

export function Demo() {
  const [status, setStatus] = useState<Record<string, FlowStatus>>({});
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout);
    setStatus({});
    setPhase("running");
    timers.current = RUN.map(([ms, changes], i) =>
      setTimeout(() => {
        setStatus((s) => ({ ...s, ...changes }));
        if (i === RUN.length - 1) setPhase("done");
      }, ms + 150),
    );
  };
  return (
    <div className="grid w-full max-w-[900px] gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[var(--bd-fg)]">New signup to sales</p>
          <p className="text-[12.5px] text-[var(--bd-subtle)]">{phase === "running" ? "Running…" : phase === "done" ? "Ran in 4.1s, 5 steps, 1 skipped" : "Drag the board, a step, or from an output to an input"}</p>
        </div>
        <button type="button" onClick={run} disabled={phase === "running"} className="flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-60">
          <PlayIcon weight="fill" className="size-3.5" />
          {phase === "done" ? "Run again" : "Run"}
        </button>
      </div>
      <Flow defaultNodes={NODES} defaultEdges={EDGES} status={status} height={420} label="New signup to sales" />
    </div>
  );
}

/* Three steps, not joined yet. */
const LOOSE: FlowNode[] = [
  { id: "form", x: 0, y: 40, kind: "Trigger", title: "Form sent", icon: <EnvelopeSimpleIcon weight="duotone" />, outputs: [{ id: "answers", label: "Answers" }] },
  { id: "ai", x: 300, y: 0, kind: "Model", title: "Summarize", icon: <ArticleIcon weight="duotone" />, inputs: [{ id: "text", label: "Text" }], outputs: [{ id: "summary", label: "Summary" }] },
  { id: "post", x: 600, y: 60, kind: "Message", title: "Post to a channel", icon: <ChatCircleTextIcon weight="duotone" />, inputs: [{ id: "message", label: "Message" }] },
];

function Connect() {
  return <Flow defaultNodes={LOOSE} height={300} minimap={false} label="A flow to connect" className="w-full max-w-[760px]" />;
}

export const examples: Record<string, ComponentType> = { connect: Connect };
