"use client";

import { useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpIcon, CaretDownIcon, FileTsIcon, FolderSimpleIcon, GitBranchIcon, PlusIcon, StopIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";
import { MenuItem, Popover } from "./bits";
import { TASKS } from "./session";
import { COMMANDS, MODELS, MODES } from "./workspace";

type Menu = "attach" | "model" | "mode" | null;

export function Composer({
  inputRef,
  draft,
  onDraft,
  preview,
  working,
  onSubmit,
  onStop,
  branch,
  attachments,
  onAttach,
  onDetach,
  files,
  model,
  onModel,
  mode,
  onMode,
  activeTask,
  onRun,
  onCommand,
  onFocus,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  draft: string;
  onDraft: (value: string) => void;
  /** Text being typed by the demo itself, shown instead of the draft. */
  preview: string | null;
  working: boolean;
  onSubmit: (text: string) => void;
  onStop: () => void;
  branch: string;
  attachments: string[];
  onAttach: (path: string) => void;
  onDetach: (path: string) => void;
  files: string[];
  model: string;
  onModel: (id: string) => void;
  mode: string;
  onMode: (id: string) => void;
  activeTask: number | null;
  onRun: (i: number) => void;
  onCommand: (id: string) => void;
  onFocus: () => void;
}) {
  const [menu, setMenu] = useState<Menu>(null);
  const [hi, setHi] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const slash = draft.startsWith("/") ? draft.slice(1).toLowerCase() : null;
  const mention = /@([\w./-]*)$/.exec(draft)?.[1]?.toLowerCase() ?? null;
  const suggestions =
    dismissed === draft
      ? []
      : slash !== null
        ? COMMANDS.filter((c) => c.label.slice(1).startsWith(slash)).map((c) => ({ id: c.id, label: c.label, note: c.note, kind: "command" as const }))
        : mention !== null
          ? files
              .filter((f) => f.toLowerCase().includes(mention) && !attachments.includes(f))
              .slice(0, 6)
              .map((f) => ({ id: f, label: f, note: "", kind: "file" as const }))
          : [];
  const index = Math.min(hi, Math.max(0, suggestions.length - 1));

  const choose = (s: (typeof suggestions)[number]) => {
    if (s.kind === "command") {
      onDraft("");
      onCommand(s.id);
    } else {
      onDraft(draft.replace(/@[\w./-]*$/, ""));
      onAttach(s.id);
    }
    setHi(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => (i + (e.key === "ArrowDown" ? 1 : suggestions.length - 1)) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(suggestions[index]);
    } else if (e.key === "Escape") {
      setDismissed(draft);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (suggestions.length) return choose(suggestions[index]);
    if (draft.trim() && !working) onSubmit(draft.trim());
  };

  const modelLabel = MODELS.find((m) => m.id === model)?.label ?? model;
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;

  return (
    <form onSubmit={submit} className="border-t border-paper/8 bg-ink-2 p-3">
      <div className="relative rounded-[10px] border border-paper/12 bg-ink transition-colors focus-within:border-paper/30">
        <Popover open={suggestions.length > 0} onClose={() => setDismissed(draft)} className="left-2 right-2">
          <div className="px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-wider text-paper/35">
            {slash !== null ? "Commands" : "Attach a file"}
          </div>
          {suggestions.map((s, i) => (
            <MenuItem key={s.id} active={i === index} onClick={() => choose(s)} note={s.note || undefined}>
              {s.kind === "file" ? <FileTsIcon size={13} className="text-paper/40" /> : null}
              <span className="font-mono text-[12px]">{s.label}</span>
            </MenuItem>
          ))}
        </Popover>

        <div className="flex items-center gap-4 px-3.5 pt-2.5 font-mono text-[11px] text-paper/40">
          <span className="flex min-w-0 items-center gap-1.5">
            <GitBranchIcon size={11} className="shrink-0" />
            <span className="truncate">{branch}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FolderSimpleIcon size={11} />
            ledger
          </span>
          <span className="ml-auto hidden text-paper/25 sm:inline">@ for files · / for commands</span>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pt-2">
            <AnimatePresence initial={false}>
            {attachments.map((a) => (
              <motion.span
                key={a}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 rounded-[4px] border border-paper/12 bg-paper/[0.04] py-0.5 pl-1.5 pr-1 font-mono text-[11px] text-paper/75"
              >
                @{a}
                <button type="button" onClick={() => onDetach(a)} aria-label={`Remove ${a}`} className="grid size-4 place-items-center rounded-[3px] text-paper/40 hover:bg-paper/10 hover:text-paper">
                  <XIcon size={9} />
                </button>
              </motion.span>
            ))}
            </AnimatePresence>
          </div>
        )}

        <input
          ref={inputRef}
          value={preview ?? draft}
          onChange={(e) => {
            onDraft(e.target.value);
            setHi(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder={working ? "The agent is working. Add a note for its next step" : "Ask Auren to change something"}
          aria-label="Ask the agent to change something"
          className="h-10 w-full bg-transparent px-3.5 text-[14.5px] text-paper outline-none placeholder:text-paper/30"
        />

        <div className="flex items-center gap-1.5 px-2 pb-2">
          <div className="relative">
            <button
              type="button"
              aria-label="Attach context"
              aria-expanded={menu === "attach"}
              onClick={() => setMenu(menu === "attach" ? null : "attach")}
              className="grid size-7 place-items-center rounded-[6px] border border-paper/10 text-paper/45 transition-colors hover:border-paper/30 hover:text-paper"
            >
              <PlusIcon size={12} />
            </button>
            <Popover open={menu === "attach"} onClose={() => setMenu(null)} className="left-0 w-[250px]">
              <div className="px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-wider text-paper/35">Attach context</div>
              {files.map((f) => (
                <MenuItem
                  key={f}
                  selected={attachments.includes(f)}
                  onClick={() => (attachments.includes(f) ? onDetach(f) : onAttach(f))}
                >
                  <FileTsIcon size={13} className="text-paper/40" />
                  <span className="font-mono text-[12px]">{f}</span>
                </MenuItem>
              ))}
            </Popover>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={menu === "model"}
              onClick={() => setMenu(menu === "model" ? null : "model")}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] border border-paper/10 px-2 text-[12px] text-paper/70 transition-colors hover:border-paper/30 hover:text-paper"
            >
              <LogoGlyph size={10} className="text-accent" /> {modelLabel} <CaretDownIcon size={9} className="text-paper/35" />
            </button>
            <Popover open={menu === "model"} onClose={() => setMenu(null)} className="left-0 w-[250px]">
              {MODELS.map((m) => (
                <MenuItem
                  key={m.id}
                  selected={m.id === model}
                  note={m.note}
                  onClick={() => {
                    onModel(m.id);
                    setMenu(null);
                  }}
                >
                  {m.label}
                </MenuItem>
              ))}
            </Popover>
          </div>

          <div className="relative hidden sm:block">
            <button
              type="button"
              aria-expanded={menu === "mode"}
              onClick={() => setMenu(menu === "mode" ? null : "mode")}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] border border-paper/10 px-2 text-[12px] text-paper/70 transition-colors hover:border-paper/30 hover:text-paper"
            >
              {modeLabel} <CaretDownIcon size={9} className="text-paper/35" />
            </button>
            <Popover open={menu === "mode"} onClose={() => setMenu(null)} className="left-0 w-[250px]">
              {MODES.map((m) => (
                <MenuItem
                  key={m.id}
                  selected={m.id === mode}
                  note={m.note}
                  onClick={() => {
                    onMode(m.id);
                    setMenu(null);
                  }}
                >
                  {m.label}
                </MenuItem>
              ))}
            </Popover>
          </div>

          <span className="mx-1 hidden h-4 w-px bg-paper/10 md:block" />
          <div className="no-scrollbar hidden min-w-0 gap-1 overflow-x-auto md:flex">
            {TASKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onRun(i)}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] px-2 font-mono text-[11px] transition-colors duration-200",
                  activeTask === i ? "bg-paper/[0.08] text-paper" : "text-paper/45 hover:bg-paper/5 hover:text-paper",
                )}
              >
                <span className="text-accent">{i + 1}</span>
                {t.short}
              </button>
            ))}
          </div>
          <button
            type={working ? "button" : "submit"}
            onClick={working ? onStop : undefined}
            aria-label={working ? "Stop the agent" : "Send"}
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-[7px] bg-paper text-ink transition-colors hover:bg-accent"
          >
            {working ? <StopIcon size={12} weight="fill" /> : <ArrowUpIcon size={14} weight="bold" />}
          </button>
        </div>
      </div>
      <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto md:hidden">
        {TASKS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onRun(i)}
            className="flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] border border-paper/10 px-2 font-mono text-[11px] text-paper/55"
          >
            <span className="text-accent">{i + 1}</span>
            {t.short}
          </button>
        ))}
      </div>
    </form>
  );
}
