"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckIcon,
  CircleNotchIcon,
  GitBranchIcon,
  LightbulbIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PulseIcon,
  StopIcon,
  TrayIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";
import { AgentLine, Chip, PANE_SCROLL, Track } from "./bits";
import type { Task } from "./session";
import { PAST_SESSIONS, type InboxItem } from "./workspace";

function PanelShell({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <div data-lenis-prevent className={cn("h-full bg-ink p-5 md:p-6", PANE_SCROLL)}>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="type-title text-[22px]">{title}</h3>
        {meta && <span className="font-mono text-[11px] text-paper/40">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

const ICONS = { session: TrayIcon, agents: PulseIcon, rule: LightbulbIcon };

export function InboxView({
  items,
  onOpen,
  onDismiss,
}: {
  items: InboxItem[];
  onOpen: (item: InboxItem) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <PanelShell title="Inbox" meta={`${items.length} open`}>
      {items.length === 0 ? (
        <p className="pt-10 text-center text-[13px] text-paper/40">Inbox zero. Your agents will check in here.</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Icon = ICONS[item.action];
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex gap-3 rounded-[8px] border border-paper/10 bg-ink-2 p-3.5"
                >
                  <Icon size={15} className="mt-0.5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[13.5px] text-paper/90">{item.title}</span>
                      <span className="ml-auto shrink-0 font-mono text-[10.5px] text-paper/30">{item.when}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-paper/50">{item.body}</p>
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpen(item)}
                        className="h-7 rounded-[5px] bg-paper px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-accent"
                      >
                        {item.action === "rule" ? "Add rule" : item.action === "agents" ? "Open agent" : "Review"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismiss(item.id)}
                        className="h-7 rounded-[5px] px-2.5 text-[12px] text-paper/50 transition-colors hover:bg-paper/5 hover:text-paper"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </PanelShell>
  );
}

export function AgentsView({
  task,
  status,
  progress,
  bgProgress,
  bgPaused,
  onToggleBg,
  onOpenSession,
  onStop,
  onNew,
}: {
  task: Task | null;
  status: string;
  progress: number;
  bgProgress: number;
  bgPaused: boolean;
  onToggleBg: () => void;
  onOpenSession: () => void;
  onStop: () => void;
  onNew: () => void;
}) {
  const running = (task && status.startsWith("Step") ? 1 : 0) + (bgPaused ? 0 : 1);
  return (
    <PanelShell title="Agents" meta={`${running} running · ${4 - running} of 4 slots free`}>
      <ul className="space-y-2">
        {task && (
          <li className="rounded-[8px] border border-paper/10 bg-ink-2 p-4">
            <div className="flex items-center gap-2.5">
              {status.startsWith("Step") ? (
                <CircleNotchIcon size={14} className="animate-spin text-accent" />
              ) : (
                <span className="size-2 bg-accent" />
              )}
              <span className="text-[13.5px] text-paper/90">{task.short}</span>
              <span className="ml-auto font-mono text-[11px] text-paper/40">{status}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 pl-[22px] font-mono text-[11px] text-paper/35">
              <GitBranchIcon size={11} /> {task.branch}
            </div>
            <Track progress={progress} className="ml-[22px] mt-3" />
            <div className="mt-3 flex gap-1.5 pl-[22px]">
              <button
                type="button"
                onClick={onOpenSession}
                className="h-7 rounded-[5px] bg-paper px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-accent"
              >
                Open session
              </button>
              {status.startsWith("Step") && (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12px] text-paper/55 transition-colors hover:bg-paper/5 hover:text-paper"
                >
                  <StopIcon size={11} weight="fill" /> Stop
                </button>
              )}
            </div>
          </li>
        )}
        <li className="rounded-[8px] border border-paper/10 bg-ink-2 p-4">
          <div className="flex items-center gap-2.5">
            {bgPaused ? <PauseIcon size={14} className="text-paper/40" /> : <CircleNotchIcon size={14} className="animate-spin text-paper/50" />}
            <span className="text-[13.5px] text-paper/90">Upgrade web to React 19</span>
            <span className="ml-auto font-mono text-[11px] text-paper/40">{bgPaused ? "Paused" : `${Math.round(bgProgress * 100)}%`}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 pl-[22px] font-mono text-[11px] text-paper/35">
            <GitBranchIcon size={11} /> agent/react-19 · fixing 9 type errors
          </div>
          <Track progress={bgProgress} className="ml-[22px] mt-3" />
          <div className="mt-3 pl-[22px]">
            <button
              type="button"
              onClick={onToggleBg}
              className="flex h-7 items-center gap-1.5 rounded-[5px] border border-paper/12 px-2.5 text-[12px] text-paper/70 transition-colors hover:border-paper/30 hover:text-paper"
            >
              {bgPaused ? <PlayIcon size={11} weight="fill" /> : <PauseIcon size={11} weight="fill" />}
              {bgPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </li>
        <li>
          <button
            type="button"
            onClick={onNew}
            className="flex h-11 w-full items-center gap-2.5 rounded-[8px] border border-dashed border-paper/15 px-4 text-[13px] text-paper/45 transition-colors hover:border-paper/35 hover:text-paper"
          >
            <PlusIcon size={13} /> New agent
            <span className="ml-auto font-mono text-[11px]">⌘N</span>
          </button>
        </li>
      </ul>
    </PanelShell>
  );
}

export function RulesView({
  rules,
  onToggle,
  onAdd,
  onRemove,
}: {
  rules: Array<{ text: string; on: boolean }>;
  onToggle: (i: number) => void;
  onAdd: (text: string) => void;
  onRemove: (i: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  };
  return (
    <PanelShell title="Rules" meta=".auren/rules/api.md · src/api/**">
      <p className="mb-4 max-w-[52ch] text-[12.5px] leading-relaxed text-paper/45">
        Every agent reads these before it touches src/api, and cites the rule when it shapes a change.
      </p>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {rules.map((r, i) => (
            <motion.li
              key={r.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="group flex items-center gap-3 rounded-[7px] border border-paper/10 bg-ink-2 px-3.5 py-2.5"
            >
              <button
                type="button"
                role="switch"
                aria-checked={r.on}
                aria-label={r.on ? "Disable rule" : "Enable rule"}
                onClick={() => onToggle(i)}
                className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors", r.on ? "bg-accent" : "bg-paper/15")}
              >
                <span
                  className={cn("absolute top-0.5 size-3 rounded-full bg-ink transition-[left]", r.on ? "left-[14px]" : "left-0.5")}
                />
              </button>
              <span className={cn("text-[13px] transition-colors", r.on ? "text-paper/85" : "text-paper/35 line-through")}>{r.text}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Remove rule"
                className="ml-auto grid size-6 shrink-0 place-items-center rounded-[4px] text-paper/30 opacity-0 transition-opacity hover:text-paper group-hover:opacity-100"
              >
                <XIcon size={12} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a rule in plain English"
          aria-label="New rule"
          className="h-9 min-w-0 flex-1 rounded-[7px] border border-paper/12 bg-ink-2 px-3 text-[13px] text-paper outline-none placeholder:text-paper/30 focus:border-paper/30"
        />
        <button
          type="submit"
          className="h-9 shrink-0 rounded-[7px] bg-paper px-3 text-[12.5px] font-medium text-ink transition-colors hover:bg-accent"
        >
          Add
        </button>
      </form>
    </PanelShell>
  );
}

export function PastSessionView({
  session,
  merged,
  onMerge,
  onCopyBranch,
  canOpen,
  onOpenFile,
}: {
  session: (typeof PAST_SESSIONS)[number];
  merged: boolean;
  onMerge: () => void;
  onCopyBranch: () => void;
  canOpen: (target: string) => string | null;
  onOpenFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div data-lenis-prevent className={cn("h-full space-y-5 bg-ink-2 p-5", PANE_SCROLL)}>
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[10px] bg-ink-3 px-3.5 py-2.5 text-[13.5px] text-paper/90">{session.prompt}</div>
      </div>
      <div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-[13px]">
          <LogoGlyph size={12} className="text-accent" />
          <span className="text-paper/85">auren-1</span>
          <span className="text-paper/40">
            {session.steps.length} steps · {open ? "hide" : "show"}
          </span>
        </button>
        {open && (
          <ol className="ml-[5px] mt-2.5 space-y-2 border-l border-paper/10 pl-4">
            {session.steps.map((s) => {
              const path = canOpen(s.target);
              return (
                <li key={s.target} className="flex min-w-0 items-center gap-2 text-[12.5px]">
                  <CheckIcon size={12} className="shrink-0 text-paper/35" />
                  <span className="text-paper/55">{s.verb}</span>
                  <Chip onClick={path ? () => onOpenFile(path) : undefined}>{s.target}</Chip>
                  <span className="ml-auto shrink-0 font-mono text-[10.5px] text-paper/35">{s.detail}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <AgentLine>{session.reply}</AgentLine>
      <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-paper/10 bg-ink p-3">
        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider", merged ? "bg-paper/10 text-paper/60" : "bg-accent text-ink")}>
          {merged ? "Merged" : "Ready for review"}
        </span>
        <button
          type="button"
          onClick={onCopyBranch}
          className="flex items-center gap-1.5 font-mono text-[11.5px] text-paper/50 transition-colors hover:text-paper"
          title="Copy branch name"
        >
          <GitBranchIcon size={11} /> {session.branch}
        </button>
        <span className="font-mono text-[11.5px] text-paper/35">{session.diff}</span>
        {!merged && (
          <button
            type="button"
            onClick={onMerge}
            className="ml-auto h-7 rounded-[5px] bg-paper px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-accent"
          >
            Approve and merge
          </button>
        )}
      </div>
    </div>
  );
}
