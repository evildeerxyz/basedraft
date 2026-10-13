"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpenIcon,
  CaretDownIcon,
  CheckIcon,
  CircleNotchIcon,
  FilePlusIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TerminalIcon,
  TestTubeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { cn } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";
import { DitherReveal } from "../ui/reveal";
import { AgentLine, Chip, FIELD, LINE_H, PANE_SCROLL, TRACK, WASH, clock, mask } from "./bits";
import { Code } from "./highlight";
import { firstWrite, type DiffLine, type StepKind, type Task } from "./session";

export type Hunk = { h: number; at: number; lines: Array<DiffLine & { i: number }>; add: number; del: number };
export type RunPhase = "prompting" | "running" | "answered" | "review" | "applied" | "discarded" | "other";

const STEP_ICONS: Record<StepKind, React.ComponentType<IconProps>> = {
  search: MagnifyingGlassIcon,
  read: BookOpenIcon,
  create: FilePlusIcon,
  edit: PencilSimpleIcon,
  run: TerminalIcon,
  test: TestTubeIcon,
};

export function SessionView({
  phase,
  task,
  prompt,
  attachments,
  custom,
  stopped,
  stepIndex,
  elapsed,
  stepsOpen,
  onToggleSteps,
  hunks,
  kept,
  onKeep,
  onApply,
  onDiscard,
  sweeping,
  revealed,
  model,
  mode,
  canOpen,
  onOpenFile,
  onRunForReal,
}: {
  phase: RunPhase;
  task: Task;
  prompt: string;
  attachments: string[];
  custom: string | null;
  stopped: boolean;
  stepIndex: number;
  elapsed: number;
  stepsOpen: boolean;
  onToggleSteps: () => void;
  hunks: Hunk[];
  kept: boolean[];
  onKeep: (h: number, value: boolean) => void;
  onApply: () => void;
  onDiscard: () => void;
  sweeping: boolean;
  revealed: number;
  model: string;
  mode: string;
  canOpen: (target: string) => string | null;
  onOpenFile: (path: string, line?: number) => void;
  /** From an Ask-mode answer: run the same request for real. */
  onRunForReal: () => void;
}) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const done = phase === "review" || phase === "applied";
  const answered = phase === "answered";
  const keptCount = kept.filter(Boolean).length;
  const shownSteps = phase === "running" ? stepIndex + 1 : answered ? firstWrite(task) : undefined;

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stepIndex, phase, stepsOpen, prompt]);
  useEffect(() => {
    const el = reviewRef.current;
    if (el) el.scrollTo({ top: sweeping ? el.scrollHeight : 0, behavior: "smooth" });
  }, [revealed, sweeping, phase]);

  return (
    <div className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1">
      {/* transcript */}
      <div ref={transcriptRef} data-lenis-prevent className={cn("space-y-5 p-5", PANE_SCROLL)}>
        <div className="flex flex-col items-end gap-1.5">
          {attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {attachments.map((a) => (
                <Chip key={a} onClick={() => onOpenFile(a)}>
                  @{a}
                </Chip>
              ))}
            </div>
          )}
          <div className="max-w-[88%] rounded-[10px] bg-ink-3 px-3.5 py-2.5 text-[13.5px] leading-snug text-paper/90">
            {prompt}
            {phase === "prompting" && <span className="ml-px inline-block h-3.5 w-[2px] translate-y-[2px] bg-accent" />}
          </div>
        </div>

        {custom !== null ? (
          <AgentLine>
            {mode === "Ask"
              ? "In Ask mode I answer without editing. This preview replays recorded sessions, so try one of the three intents, or download Auren and ask about your own repo."
              : "This preview replays three recorded sessions, so I can’t run that one here. Try one of the intents below, type / for commands, or download Auren and point me at your own repo."}
          </AgentLine>
        ) : (
          phase !== "prompting" && (
            <div>
              <button type="button" onClick={onToggleSteps} aria-expanded={stepsOpen} className="flex items-center gap-2 text-[13px]">
                <CaretDownIcon size={11} className={cn("text-paper/40 transition-transform", !stepsOpen && "-rotate-90")} />
                <LogoGlyph size={12} className="text-accent" />
                <span className="text-paper/85">{model}</span>
                <span className="text-paper/40">
                  {phase === "running"
                    ? `working for ${clock(elapsed)}`
                    : answered
                      ? `answered in ${clock(Math.max(elapsed, 1))} · read only`
                      : `worked for ${clock(Math.max(elapsed, 1))} · ${task.steps.length} steps`}
                </span>
                <span className="hidden font-mono text-[10.5px] uppercase tracking-wider text-paper/25 sm:inline">{mode}</span>
              </button>
              <AnimatePresence initial={false}>
                {stepsOpen && (
                  <motion.ol
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="ml-[5px] mt-2.5 space-y-2 overflow-hidden border-l border-paper/10 pl-4"
                  >
                    {task.steps.slice(0, shownSteps).map((s, i) => {
                      const doing = phase === "running" && i === stepIndex;
                      const Icon = STEP_ICONS[s.kind];
                      const path = canOpen(s.target);
                      return (
                        <motion.li
                          key={`${task.id}-${i}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex min-w-0 items-center gap-2 text-[12.5px]"
                        >
                          {doing ? (
                            <CircleNotchIcon size={12} className="shrink-0 animate-spin text-accent" />
                          ) : (
                            <Icon size={12} className="shrink-0 text-paper/35" />
                          )}
                          <span className="shrink-0 text-paper/55">{s.verb}</span>
                          <Chip onClick={path ? () => onOpenFile(path) : undefined}>{s.target}</Chip>
                          <span className="ml-auto shrink-0 font-mono text-[10.5px] text-paper/35">{doing ? "…" : s.detail}</span>
                        </motion.li>
                      );
                    })}
                  </motion.ol>
                )}
              </AnimatePresence>
            </div>
          )
        )}

        {done && custom === null && <AgentLine>{task.reply}</AgentLine>}
        {answered && (
          <AgentLine>
            <p>Ask mode, so I haven’t changed anything. Here is what I would do:</p>
            <ol className="mt-2 space-y-1.5">
              {task.notes.map((note, i) => (
                <li key={note} className="flex gap-2.5">
                  <span className="font-mono text-[11px] leading-[1.9] text-paper/35">{String(i + 1).padStart(2, "0")}</span>
                  {note}
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={onRunForReal}
              className="mt-3 h-7 rounded-[5px] bg-paper px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-accent"
            >
              Make these changes
            </button>
          </AgentLine>
        )}
        {phase === "discarded" && custom === null && (
          <AgentLine muted>{stopped ? "Stopped. Nothing was committed." : "Discarded. Your working tree is unchanged."}</AgentLine>
        )}
        {phase === "applied" && (
          <AgentLine muted>
            Committed {keptCount} of {kept.length} changes to <span className="font-mono text-[11.5px]">{task.branch}</span> and checked
            it out.{" "}
            <button
              type="button"
              onClick={() => onOpenFile("api/charges.ts")}
              className="text-paper/80 underline decoration-paper/30 underline-offset-4 hover:text-paper"
            >
              Open charges.ts
            </button>
          </AgentLine>
        )}
      </div>

      {/* review */}
      <div className="flex min-h-0 flex-col border-t border-paper/8 bg-ink md:border-l md:border-t-0">
        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-paper/8 px-4">
          <span className="type-label text-paper/50">Review</span>
          <button
            type="button"
            onClick={() => onOpenFile("api/charges.ts")}
            className="truncate font-mono text-[11px] text-paper/35 transition-colors hover:text-paper"
          >
            api/charges.ts
          </button>
          {phase === "review" && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className="mr-1 hidden font-mono text-[11px] text-paper/40 xl:inline">
                {keptCount}/{kept.length}
              </span>
              <button
                type="button"
                onClick={onDiscard}
                className="h-7 rounded-[5px] px-2.5 text-[12.5px] text-paper/55 transition-colors hover:bg-paper/5 hover:text-paper"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={keptCount === 0}
                className="flex h-7 items-center gap-1.5 rounded-[5px] bg-paper px-2.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-accent disabled:opacity-40"
              >
                Accept <span className="font-mono text-[10.5px] opacity-50">⌘↵</span>
              </button>
            </div>
          )}
          {phase === "applied" && (
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[12px] text-paper/60">
              <CheckIcon size={12} weight="bold" className="text-accent" /> Committed
            </span>
          )}
        </div>
        <div ref={reviewRef} data-lenis-prevent className={cn("min-h-0 flex-1 space-y-2.5 p-3", PANE_SCROLL)}>
          {hunks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[12.5px] text-paper/35">
              <div className="h-[5px] w-24" style={{ backgroundImage: TRACK, backgroundSize: "8px 8px" }} />
              {phase === "discarded"
                ? "Nothing to review."
                : answered
                  ? "Ask mode answers without editing."
                  : custom !== null
                    ? "Changes appear here, one card per hunk."
                    : "Changes appear here as the agent writes them."}
              {answered && (
                <button
                  type="button"
                  onClick={onRunForReal}
                  className="h-7 rounded-[5px] border border-paper/15 px-2.5 text-[12px] text-paper/70 transition-colors hover:border-paper/35 hover:text-paper"
                >
                  Run it in the background
                </button>
              )}
            </div>
          ) : (
            hunks.map((hk) => {
              const isKept = kept[hk.h] !== false;
              return (
                <DitherReveal key={`${task.id}-${hk.h}`} trigger="mount" scale={3} duration={450}>
                  <div
                    className={cn(
                      "overflow-hidden rounded-[8px] border bg-ink-2 transition-opacity",
                      isKept ? "border-paper/12" : "border-paper/8 opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-2 px-3 pt-2.5 font-mono text-[10.5px] text-paper/40">
                      <span className={cn("size-[5px]", isKept ? "bg-accent" : "bg-paper/25")} />
                      {String(hk.h + 1).padStart(2, "0")} ·
                      <button
                        type="button"
                        onClick={() => onOpenFile("api/charges.ts", hk.at)}
                        title="Open at this line"
                        className="underline decoration-paper/20 underline-offset-2 transition-colors hover:text-paper"
                      >
                        L{hk.at}
                      </button>
                      <span className="text-accent">+{hk.add}</span>
                      {hk.del > 0 && <span>-{hk.del}</span>}
                      {phase === "review" && (
                        <div className="relative ml-auto grid grid-cols-2" role="group" aria-label={`Change ${hk.h + 1}`}>
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-0 left-0 w-1/2 rounded-[4px] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                              isKept ? "translate-x-0 bg-accent" : "translate-x-full bg-paper/80",
                            )}
                          />
                          {[true, false].map((value) => (
                            <button
                              key={String(value)}
                              type="button"
                              aria-pressed={isKept === value}
                              onClick={() => onKeep(hk.h, value)}
                              className={cn(
                                "relative h-6 rounded-[4px] px-2 uppercase tracking-wider transition-colors",
                                isKept === value ? "text-ink" : "hover:text-paper",
                              )}
                            >
                              <span className="relative">{value ? "Keep" : "Drop"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {phase === "applied" && <span className="ml-auto uppercase tracking-wider">{isKept ? "Committed" : "Left out"}</span>}
                    </div>
                    <p className="px-3 pb-2.5 pt-1.5 text-[12.5px] leading-snug text-paper/75">{task.notes[hk.h]}</p>
                    <div className="border-t border-paper/8 py-1 font-mono text-[12px]">
                      {hk.lines.map((l) => (
                        <div key={l.i} className="relative flex whitespace-pre pr-3" style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}>
                          {l.t === "+" ? (
                            <>
                              <span aria-hidden className="absolute inset-0 bg-accent opacity-25" style={mask(WASH)} />
                              <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-accent" />
                            </>
                          ) : (
                            <span aria-hidden className="absolute inset-0 bg-paper opacity-15" style={mask(FIELD)} />
                          )}
                          <span className="relative flex w-7 shrink-0 items-center justify-center">
                            <span className={cn("size-[5px]", l.t === "+" ? "bg-accent" : "border border-paper/40")} />
                          </span>
                          <span className={cn("relative", l.t === "-" && "text-paper/40 line-through decoration-paper/35")}>
                            {l.t === "-" ? l.s : <Code line={l.s} />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DitherReveal>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
