"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import {
  CaretDownIcon,
  CircleNotchIcon,
  FileIcon,
  FileTsIcon,
  FilesIcon,
  FolderSimpleIcon,
  GitBranchIcon,
  ListIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PulseIcon,
  ScrollIcon,
  SidebarSimpleIcon,
  TrayIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { PALETTE_EVENT, cn, copyText, toast } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";
import { SmartLink } from "../ui/smart-link";
import { Track } from "./bits";
import { CodeEditor, type Cursor } from "./code-editor";
import { Composer } from "./composer";
import { AgentsView, InboxView, PastSessionView, RulesView } from "./panels";
import { BASE, GHOST, TASKS, TYPED, TYPING_LINE, firstWrite, hunkIds } from "./session";
import { SessionView, type Hunk } from "./session-view";
import {
  CHARGES,
  CREATED_BY,
  FILES,
  INBOX,
  INTENT_KEYWORDS,
  MODELS,
  MODES,
  PAST_SESSIONS,
  RULES,
  SUGGESTED_RULE,
  TREE,
  basename,
  type InboxItem,
} from "./workspace";

type Phase = "boot" | "typing" | "suggest" | "idle" | "prompting" | "running" | "answered" | "review" | "applied" | "discarded";
type Pane = "sessions" | "explorer" | "changes";

const TASK_HUNKS = TASKS.map((t) => hunkIds(t.diff));
const HUNK_COUNT = TASK_HUNKS.map((ids) => Math.max(-1, ...ids) + 1);
const INITIAL_BUFFERS: Record<string, string[]> = { [CHARGES]: BASE, ...FILES };
const ATTACHABLE = [CHARGES, "api/refunds.ts", "api/webhooks.ts", "lib/db.ts", "lib/logger.ts", "test/charges.test.ts"];
const VIEW_TABS: Record<string, { label: string; icon: React.ComponentType<IconProps> }> = {
  inbox: { label: "Inbox", icon: TrayIcon },
  agents: { label: "Agents", icon: PulseIcon },
  rules: { label: "Rules", icon: ScrollIcon },
};

export function EditorDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const history = useRef<Record<string, string[][]>>({});
  const attachmentsRef = useRef<string[]>([]);
  const modeRef = useRef("background");
  const inView = useInView(rootRef, { amount: 0.2 });

  // the scripted session
  const [phase, setPhase] = useState<Phase>("boot");
  const [typed, setTyped] = useState(2);
  const [taskIndex, setTaskIndex] = useState(0);
  const [promptLen, setPromptLen] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [kept, setKept] = useState<boolean[]>(() => Array(HUNK_COUNT[0]).fill(true));
  const [stepsOpen, setStepsOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [custom, setCustom] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string | null>(null);
  const [runAttachments, setRunAttachments] = useState<string[]>([]);
  const [runMode, setRunMode] = useState("background");

  // the workspace around it
  const [tabs, setTabs] = useState<string[]>([CHARGES]);
  const [active, setActive] = useState<string | null>(CHARGES);
  const [pane, setPane] = useState<Pane>("explorer");
  const [collapsedDirs, setCollapsedDirs] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [buffers, setBuffers] = useState(INITIAL_BUFFERS);
  const [chargesLive, setChargesLive] = useState(false);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [fresh, setFresh] = useState<{ path: string; rows: number[] } | null>(null);
  const [checkedOut, setCheckedOut] = useState("main");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [model, setModel] = useState("auren-1");
  const [mode, setMode] = useState("background");
  const [inbox, setInbox] = useState<InboxItem[]>(INBOX);
  const [inboxSeen, setInboxSeen] = useState(false);
  const [rules, setRules] = useState(() => RULES.map((text) => ({ text, on: true })));
  const [merged, setMerged] = useState<string[]>(() => PAST_SESSIONS.filter((s) => s.status === "merged").map((s) => s.id));
  const [tabEnabled, setTabEnabled] = useState(true);
  const [indexing, setIndexing] = useState<number | null>(null);
  const [bgTick, setBgTick] = useState(0);
  const [bgPaused, setBgPaused] = useState(false);

  useEffect(() => {
    attachmentsRef.current = attachments;
    modeRef.current = mode;
  }, [attachments, mode]);

  const task = TASKS[taskIndex];
  const ids = TASK_HUNKS[taskIndex];
  const editStep = task.steps.findIndex((s) => s.kind === "edit");

  const openTab = useCallback((id: string) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
    setDrawer(false);
  }, []);

  const closeTab = (id: string) => {
    const i = tabs.indexOf(id);
    const next = tabs.filter((x) => x !== id);
    setTabs(next);
    if (active === id) setActive(next[Math.min(i, next.length - 1)] ?? null);
  };

  const partialCharges = useCallback(() => {
    const lines = BASE.slice();
    lines[TYPING_LINE] = TYPED.slice(0, typed);
    return lines;
  }, [typed]);

  const acceptGhost = useCallback(() => {
    setBuffers((b) => ({ ...b, [CHARGES]: BASE }));
    setChargesLive(true);
    setCursors((c) => ({ ...c, [CHARGES]: { line: TYPING_LINE, col: BASE[TYPING_LINE].length } }));
    setFresh({ path: CHARGES, rows: [TYPING_LINE] });
    setPhase((p) => (p === "typing" || p === "suggest" ? "idle" : p));
  }, []);

  const stopTyping = useCallback(() => {
    const lines = partialCharges();
    setBuffers((b) => ({ ...b, [CHARGES]: lines }));
    setChargesLive(true);
    setCursors((c) => ({ ...c, [CHARGES]: { line: TYPING_LINE, col: lines[TYPING_LINE].length } }));
    setPhase((p) => (p === "boot" || p === "typing" || p === "suggest" ? "idle" : p));
  }, [partialCharges]);

  const startTask = useCallback(
    (i: number, text?: string) => {
      setTaskIndex(i);
      setPromptLen(0);
      setStepIndex(0);
      setRevealed(0);
      setCustom(null);
      setStopped(false);
      setDraft("");
      setKept(Array(HUNK_COUNT[i]).fill(true));
      setElapsed(0);
      setStepsOpen(true);
      setUserPrompt(text ?? null);
      setRunAttachments(attachmentsRef.current);
      setRunMode(modeRef.current);
      setAttachments([]);
      openTab("session");
      setPhase(text ? "running" : "prompting");
    },
    [openTab],
  );

  const runTask = (i: number) => {
    setAutoplay(false);
    startTask(i);
  };

  // The demo is a timeline of small, cancellable steps that pauses off-screen.
  useEffect(() => {
    if (!inView) return;
    let next: (() => void) | null = null;
    let delay = 0;
    switch (phase) {
      case "boot":
        delay = 700;
        next = () => setPhase("typing");
        break;
      case "typing":
        if (typed < TYPED.length) {
          delay = 45 + ((typed * 53) % 70);
          next = () => setTyped((n) => n + 1);
        } else {
          delay = 280;
          next = () => setPhase("suggest");
        }
        break;
      case "suggest":
        if (autoplay) {
          delay = 3800;
          next = tabEnabled ? acceptGhost : stopTyping;
        }
        break;
      case "idle":
        if (autoplay && custom === null) {
          delay = 1300;
          next = () => startTask(0);
        }
        break;
      case "prompting":
        if (promptLen < task.prompt.length) {
          delay = 28;
          next = () => setPromptLen((n) => n + 1);
        } else {
          delay = 420;
          next = () => setPhase("running");
        }
        break;
      case "running": {
        const step = task.steps[stepIndex];
        if (runMode === "ask" && stepIndex === firstWrite(task)) {
          // Ask mode reads and plans, then stops before touching a file
          delay = 400;
          next = () => setPhase("answered");
        } else if (!step) {
          delay = 300;
          next = () => setPhase("review");
        } else if (stepIndex === editStep && revealed < task.diff.length) {
          delay = revealed === 0 ? 420 : 55;
          next = () => setRevealed((n) => n + 1);
        } else {
          delay = step.ms ?? 640;
          next = () => setStepIndex((i) => i + 1);
        }
        break;
      }
    }
    if (!next) return;
    const id = window.setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [phase, typed, promptLen, stepIndex, revealed, inView, autoplay, custom, tabEnabled, runMode, task, editStep, acceptGhost, stopTyping, startTask]);

  const working = phase === "running" || phase === "prompting";
  const done = phase === "review" || phase === "applied";
  const inRun = working || done || phase === "discarded" || phase === "answered";
  const sweeping = phase === "running" && stepIndex === editStep;
  const edited = (phase === "running" && stepIndex >= editStep) || done;
  const chargesAnimated = !chargesLive && (phase === "boot" || phase === "typing" || phase === "suggest");

  useEffect(() => {
    if (!inView || phase !== "running") return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [inView, phase]);
  useEffect(() => {
    if (!inView || bgPaused) return;
    const id = window.setInterval(() => setBgTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, [inView, bgPaused]);
  // keep the active tab visible when the strip overflows, without moving the page
  useEffect(() => {
    const strip = tabStripRef.current;
    const tab = strip?.querySelector<HTMLElement>("[data-active-tab]");
    if (!strip || !tab) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollTo({ left, behavior: "smooth" });
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
  }, [active, tabs]);

  useEffect(() => {
    if (!fresh) return;
    const id = window.setTimeout(() => setFresh(null), 1800);
    return () => clearTimeout(id);
  }, [fresh]);
  useEffect(() => {
    if (indexing === null) return;
    const id = window.setTimeout(() => setIndexing((p) => (p === null || p >= 100 ? null : p + 7)), 70);
    return () => clearTimeout(id);
  }, [indexing]);

  const hunks = useMemo<Hunk[]>(() => {
    if (!edited) return [];
    const out: Hunk[] = [];
    for (let h = 0; h < HUNK_COUNT[taskIndex]; h++) {
      const idx = ids.flatMap((id, i) => (id === h ? [i] : []));
      if (sweeping && idx[0] >= revealed) break;
      const at = task.diff.slice(0, idx[0]).filter((l) => l.t !== "-").length + 1;
      const all = idx.map((i) => ({ ...task.diff[i], i }));
      out.push({
        h,
        at,
        lines: sweeping ? all.filter((l) => l.i < revealed) : all,
        add: all.filter((l) => l.t === "+").length,
        del: all.filter((l) => l.t === "-").length,
      });
    }
    return out;
  }, [edited, taskIndex, ids, sweeping, revealed, task]);

  const keptCount = kept.filter(Boolean).length;
  const liveAdd = task.diff.filter((l, i) => l.t === "+" && kept[ids[i]] !== false).length;
  const liveDel = task.diff.filter((l, i) => l.t === "-" && kept[ids[i]] !== false).length;
  const agentFiles = edited ? task.files.map((f) => (f.path === CHARGES ? { ...f, add: liveAdd, del: liveDel } : f)) : [];
  const userModified = Object.keys(buffers).filter(
    (p) => p !== CHARGES && buffers[p].join("\n") !== INITIAL_BUFFERS[p].join("\n"),
  );
  const bgProgress = (0.58 + bgTick * 0.004) % 1;
  const runBranch = inRun && phase !== "discarded" && runMode !== "pair" ? task.branch : checkedOut;
  const modelLabel = MODELS.find((m) => m.id === model)?.label ?? model;
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;
  const runningCount = (working ? 1 : 0) + (bgPaused ? 0 : 1);
  const unread = !inboxSeen && inbox.length > 0;

  const visibleFile = (path: string) => !(path in CREATED_BY) || (CREATED_BY[path] === task.id && edited);
  const canOpen = (target: string) =>
    Object.keys(buffers).find((p) => (p === target || p.endsWith(`/${target}`)) && visibleFile(p)) ?? null;

  const openFile = (path: string, line?: number) => {
    openTab(path);
    if (line) setCursors((c) => ({ ...c, [path]: { line: line - 1, col: 0 } }));
  };

  const editFile = (path: string) => (lines: string[], cursor: Cursor) => {
    const stack = (history.current[path] ??= []);
    stack.push(buffers[path]);
    if (stack.length > 100) stack.shift();
    setBuffers((b) => ({ ...b, [path]: lines }));
    setCursors((c) => ({ ...c, [path]: cursor }));
  };
  const undoFile = (path: string) => () => {
    const prev = history.current[path]?.pop();
    if (!prev) return toast("Nothing to undo");
    setBuffers((b) => ({ ...b, [path]: prev }));
    setCursors((c) => {
      const cur = c[path] ?? { line: 0, col: 0 };
      const line = Math.min(cur.line, prev.length - 1);
      return { ...c, [path]: { line, col: Math.min(cur.col, prev[line].length) } };
    });
  };

  const apply = () => {
    setAutoplay(false);
    const lines: string[] = [];
    const rows: number[] = [];
    task.diff.forEach((line, i) => {
      const isKept = ids[i] < 0 || kept[ids[i]] !== false;
      if ((line.t === "+" && !isKept) || (line.t === "-" && isKept)) return;
      if (line.t === "+") rows.push(lines.length);
      lines.push(line.s);
    });
    (history.current[CHARGES] ??= []).push(buffers[CHARGES]);
    setBuffers((b) => ({ ...b, [CHARGES]: lines }));
    setChargesLive(true);
    setFresh({ path: CHARGES, rows });
    setPhase("applied");
    if (runMode === "pair") toast(`Applied to your working tree on ${checkedOut}`);
    else {
      setCheckedOut(task.branch);
      toast(`Committed to ${task.branch}`);
    }
  };
  const discard = () => {
    setAutoplay(false);
    setPhase("discarded");
  };
  const stop = () => {
    setAutoplay(false);
    setStopped(true);
    setPhase("discarded");
  };

  const reset = () => {
    history.current = {};
    setPhase("boot");
    setTyped(2);
    setTaskIndex(0);
    setAutoplay(true);
    setCustom(null);
    setUserPrompt(null);
    setBuffers(INITIAL_BUFFERS);
    setChargesLive(false);
    setCursors({});
    setCheckedOut("main");
    setTabs([CHARGES]);
    setActive(CHARGES);
    setInbox(INBOX);
    setInboxSeen(false);
    setRules(RULES.map((text) => ({ text, on: true })));
    setAttachments([]);
    toast("Demo reset");
  };

  const submit = (text: string) => {
    setAutoplay(false);
    if (working) {
      setDraft("");
      return toast("Noted. The agent will use it in its next step.");
    }
    const lower = text.toLowerCase();
    const exact = TASKS.findIndex((t) => t.prompt.toLowerCase() === lower);
    if (exact >= 0) return startTask(exact, text);
    const fuzzy = INTENT_KEYWORDS.findIndex((words) => words.some((w) => lower.includes(w)));
    if (fuzzy >= 0) return startTask(fuzzy, text);
    setDraft("");
    setCustom(text);
    setUserPrompt(text);
    setRunAttachments(attachments);
    setAttachments([]);
    if (chargesAnimated) stopTyping();
    setPhase("idle");
    openTab("session");
  };

  const command = (id: string) => {
    setAutoplay(false);
    const i = TASKS.findIndex((t) => t.id === id);
    if (i >= 0) return startTask(i);
    if (id === "review") return inRun || custom !== null ? openTab("session") : toast("No session yet. Pick an intent first.");
    if (id === "reset") reset();
  };

  const onInboxOpen = (item: InboxItem) => {
    if (item.action === "session") openTab("past:rate-limit");
    else if (item.action === "agents") openTab("agents");
    else {
      setRules((r) => (r.some((x) => x.text === SUGGESTED_RULE) ? r : [...r, { text: SUGGESTED_RULE, on: true }]));
      setInbox((list) => list.filter((x) => x.id !== item.id));
      openTab("rules");
      toast("Rule added to .auren/rules/api.md");
    }
  };

  const onRootKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && phase === "review" && keptCount > 0) {
      e.preventDefault();
      apply();
    }
  };

  const runStatus =
    phase === "prompting"
      ? "Starting"
      : phase === "running"
        ? `Step ${Math.min(stepIndex + 1, task.steps.length)} of ${task.steps.length}`
        : phase === "answered"
          ? "Answered"
          : phase === "review"
          ? "Ready for review"
          : phase === "applied"
            ? "Committed"
            : stopped
              ? "Stopped"
              : "Discarded";
  const runProgress =
    phase === "running"
      ? (stepIndex + (stepIndex === editStep ? revealed / task.diff.length : 0)) / task.steps.length
      : done || phase === "answered"
        ? 1
        : 0;

  const tabMeta = (id: string): { label: string; icon: ReactNode } => {
    if (id === "session")
      return {
        label: custom !== null ? "New session" : task.short,
        icon: working ? <CircleNotchIcon size={12} className="animate-spin text-accent" /> : <LogoGlyph size={11} className="text-accent" />,
      };
    if (id.startsWith("past:")) {
      const s = PAST_SESSIONS.find((x) => `past:${x.id}` === id)!;
      return { label: s.title, icon: <LogoGlyph size={11} className="text-paper/40" /> };
    }
    if (VIEW_TABS[id]) {
      const { label, icon: Icon } = VIEW_TABS[id];
      return { label, icon: <Icon size={13} className="text-paper/40" /> };
    }
    return {
      label: basename(id),
      icon: id.endsWith(".ts") ? <FileTsIcon size={13} className="text-paper/40" /> : <FileIcon size={13} className="text-paper/40" />,
    };
  };

  const activeCursor =
    active === CHARGES && chargesAnimated ? { line: TYPING_LINE, col: typed } : active ? cursors[active] : undefined;

  // --- render -------------------------------------------------------------

  const sidebarBody = (
    <>
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-paper/8 px-4">
        <LogoGlyph size={14} className="text-accent" />
        <span className="text-[14px] font-medium tracking-[-0.01em]">Auren</span>
        <SmartLink
          href="/blog/background-agents"
          title="What’s new in 2.0"
          className="rounded-[4px] px-1 font-mono text-[10.5px] text-paper/30 transition-colors hover:bg-paper/5 hover:text-paper"
        >
          2.0
        </SmartLink>
        <button
          type="button"
          onClick={() => (drawer ? setDrawer(false) : setSidebarCollapsed(true))}
          aria-label={drawer ? "Close sidebar" : "Collapse sidebar"}
          className="ml-auto grid size-7 place-items-center rounded-[5px] text-paper/35 transition-colors hover:bg-paper/5 hover:text-paper"
        >
          {drawer ? <XIcon size={13} /> : <SidebarSimpleIcon size={14} />}
        </button>
      </div>
      <div className="space-y-0.5 p-2.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
          className="mb-2 flex h-8 w-full items-center gap-2.5 rounded-[7px] border border-paper/10 bg-ink-2 px-2.5 text-[12.5px] text-paper/40 transition-colors hover:border-paper/25 hover:text-paper/70"
        >
          <MagnifyingGlassIcon size={13} />
          Search
          <span className="ml-auto font-mono text-[10.5px]">⌘K</span>
        </button>
        <NavItem
          icon={TrayIcon}
          label="Inbox"
          active={active === "inbox"}
          onClick={() => {
            setInboxSeen(true);
            openTab("inbox");
          }}
          trailing={
            unread ? (
              <span className="size-1.5 rounded-full bg-accent" />
            ) : (
              <span className="font-mono text-[10.5px] text-paper/30">{inbox.length || ""}</span>
            )
          }
        />
        <NavItem
          icon={PulseIcon}
          label="Agents"
          active={active === "agents"}
          onClick={() => openTab("agents")}
          trailing={<span className="font-mono text-[10.5px] text-paper/35">{runningCount}</span>}
        />
        <NavItem
          icon={ScrollIcon}
          label="Rules"
          active={active === "rules"}
          onClick={() => openTab("rules")}
          trailing={<span className="font-mono text-[10.5px] text-paper/30">{rules.filter((r) => r.on).length}</span>}
        />
      </div>

      {/* Layout animations misbehave inside the hero's 3D tilt, so indicators slide with plain transforms. */}
      <div className="relative mx-2.5 grid grid-cols-3 rounded-[7px] bg-paper/[0.04] p-0.5" role="tablist" aria-label="Workspace">
        <span
          aria-hidden
          className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-[5px] bg-ink-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(${["sessions", "explorer", "changes"].indexOf(pane) * 100}%)` }}
        />
        {(["sessions", "explorer", "changes"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pane === p}
            onClick={() => setPane(p)}
            className={cn(
              "relative h-7 rounded-[5px] text-[11.5px] capitalize transition-colors",
              pane === p ? "text-paper" : "text-paper/40 hover:text-paper/70",
            )}
          >
            <span className="relative">{p}</span>
            {p === "changes" && (agentFiles.length > 0 || userModified.length > 0) && (
              <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={pane}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5 text-[12.5px]"
        data-lenis-prevent
      >
        {pane === "sessions" && (
          <ul className="space-y-0.5">
            {(inRun || custom !== null) && (
              <li>
                <button
                  type="button"
                  onClick={() => openTab("session")}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors",
                    active === "session" ? "bg-paper/[0.07]" : "hover:bg-paper/[0.04]",
                  )}
                >
                  {working ? (
                    <CircleNotchIcon size={12} className="shrink-0 animate-spin text-accent" />
                  ) : (
                    <span className={cn("size-[7px] shrink-0", phase === "discarded" ? "border border-paper/30" : "bg-accent")} />
                  )}
                  <span className="truncate text-paper/90">{custom ?? userPrompt ?? task.short}</span>
                </button>
              </li>
            )}
            {PAST_SESSIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openTab(`past:${s.id}`)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors",
                    active === `past:${s.id}` ? "bg-paper/[0.07] text-paper" : "text-paper/50 hover:bg-paper/[0.04] hover:text-paper/80",
                  )}
                >
                  <span className={cn("size-[7px] shrink-0", merged.includes(s.id) ? "border border-paper/25" : "bg-accent/70")} />
                  <span className="truncate">{s.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10.5px] text-paper/30">{s.when}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {pane === "explorer" && (
          <ul className="font-mono text-[11.5px]">
            <AnimatePresence initial={false}>
            {TREE.map((node) => {
              if (node.parents.some((p) => collapsedDirs.includes(p))) return null;
              if (node.path && !visibleFile(node.path)) return null;
              const isActive = !!node.path && node.path === active;
              const agentMark =
                node.path && agentFiles.some((f) => f.path === node.path) ? (node.path in CREATED_BY ? "A" : "M") : null;
              const userMark = node.path && userModified.includes(node.path) ? "M" : null;
              const collapsed = !!node.dir && collapsedDirs.includes(node.dir);
              return (
                <motion.li
                  key={node.dir ?? node.path}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 25, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      node.dir
                        ? setCollapsedDirs((d) => (collapsed ? d.filter((x) => x !== node.dir) : [...d, node.dir!]))
                        : openTab(node.path!)
                    }
                    aria-expanded={node.dir ? !collapsed : undefined}
                    className={cn(
                      "flex h-[25px] w-full items-center gap-1.5 rounded-[5px] pr-2 text-left transition-colors",
                      isActive ? "bg-paper/[0.07] text-paper" : "text-paper/55 hover:bg-paper/[0.04] hover:text-paper/85",
                    )}
                    style={{ paddingLeft: 6 + node.depth * 12 }}
                  >
                    {node.dir ? (
                      <>
                        <CaretDownIcon size={9} className={cn("shrink-0 text-paper/30 transition-transform", collapsed && "-rotate-90")} />
                        <FolderSimpleIcon size={13} className="shrink-0 text-paper/30" />
                      </>
                    ) : node.name.endsWith(".ts") ? (
                      <FileTsIcon size={13} className={cn("shrink-0", isActive ? "text-accent" : "text-paper/35")} />
                    ) : (
                      <FileIcon size={13} className="shrink-0 text-paper/35" />
                    )}
                    <span className="truncate">{node.name}</span>
                    {(agentMark || userMark) && (
                      <span className={cn("ml-auto text-[10.5px]", agentMark ? "text-accent" : "text-paper/45")}>{agentMark ?? userMark}</span>
                    )}
                  </button>
                </motion.li>
              );
            })}
            </AnimatePresence>
          </ul>
        )}
        {pane === "changes" &&
          (agentFiles.length || userModified.length ? (
            <ul className="space-y-0.5 font-mono text-[11.5px]">
              {agentFiles.map((f) => (
                <li key={f.path}>
                  <button
                    type="button"
                    onClick={() => (f.path === CHARGES && phase !== "applied" ? openTab("session") : openTab(f.path))}
                    className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-paper/70 transition-colors hover:bg-paper/[0.04] hover:text-paper"
                  >
                    <FileTsIcon size={13} className="shrink-0 text-paper/35" />
                    <span className="truncate">{f.path}</span>
                    <span className="ml-auto shrink-0">
                      <span className="text-accent">+{f.add}</span>
                      {f.del > 0 && <span className="ml-1 text-paper/40">-{f.del}</span>}
                    </span>
                  </button>
                </li>
              ))}
              {userModified.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => openTab(p)}
                    className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-paper/60 transition-colors hover:bg-paper/[0.04] hover:text-paper"
                  >
                    <FileTsIcon size={13} className="shrink-0 text-paper/35" />
                    <span className="truncate">{p}</span>
                    <span className="ml-auto shrink-0 text-paper/35">you</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 pt-1 leading-relaxed text-paper/35">No changes yet. Edit a file, or let an agent work on its own branch.</p>
          ))}
      </motion.div>

      <div className="shrink-0 border-t border-paper/8 p-3">
        <div className="flex items-center justify-between">
          <span className="type-label text-paper/30">Running in background</span>
          <button
            type="button"
            onClick={() => setBgPaused((p) => !p)}
            aria-label={bgPaused ? "Resume background agent" : "Pause background agent"}
            className="grid size-6 place-items-center rounded-[4px] text-paper/40 transition-colors hover:bg-paper/5 hover:text-paper"
          >
            {bgPaused ? <PlayIcon size={11} weight="fill" /> : <PauseIcon size={11} weight="fill" />}
          </button>
        </div>
        <button type="button" onClick={() => openTab("agents")} className="mt-1.5 block w-full text-left">
          <span className="flex items-center gap-2 text-[12px] text-paper/70">
            {bgPaused ? <PauseIcon size={11} className="text-paper/40" /> : <CircleNotchIcon size={11} className="animate-spin text-paper/40" />}
            <span className="truncate">Upgrade web to React 19</span>
            <span className="ml-auto font-mono text-[10.5px] text-paper/35">{bgPaused ? "Paused" : `${Math.round(bgProgress * 100)}%`}</span>
          </span>
          <Track progress={bgProgress} className="mt-2" />
        </button>
      </div>
    </>
  );

  const railItems: Array<[React.ComponentType<IconProps>, string, () => void]> = [
    [MagnifyingGlassIcon, "Search", () => window.dispatchEvent(new Event(PALETTE_EVENT))],
    [
      TrayIcon,
      "Inbox",
      () => {
        setInboxSeen(true);
        openTab("inbox");
      },
    ],
    [PulseIcon, "Agents", () => openTab("agents")],
    [ScrollIcon, "Rules", () => openTab("rules")],
    [
      FilesIcon,
      "Explorer",
      () => {
        setPane("explorer");
        setSidebarCollapsed(false);
      },
    ],
  ];

  let main: ReactNode;
  if (!active) {
    main = (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
        <LogoGlyph size={28} className="text-paper/15" />
        <p className="max-w-[34ch] text-[13px] leading-relaxed text-paper/40">
          Open a file from the explorer, or ask the agent for a change below.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openTab(CHARGES)}
            className="h-8 rounded-[6px] border border-paper/12 px-3 font-mono text-[11.5px] text-paper/70 hover:border-paper/30 hover:text-paper"
          >
            charges.ts
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="h-8 rounded-[6px] bg-paper px-3 text-[12.5px] font-medium text-ink hover:bg-accent"
          >
            Ask the agent
          </button>
        </div>
      </div>
    );
  } else if (active in buffers) {
    const path = active;
    const isCharges = path === CHARGES;
    const lines = isCharges && chargesAnimated ? partialCharges() : buffers[path];
    main = (
      <div className="flex h-full flex-col">
        {isCharges && working && (
          <div className="flex items-center gap-3 border-b border-paper/8 bg-accent/[0.06] px-4 py-2 text-[12.5px] text-paper/65">
            <span className="size-1.5 shrink-0 bg-accent" />
            <span className="truncate">
              The agent is editing on {task.branch}. You are on {checkedOut}, untouched.
            </span>
            <button
              type="button"
              onClick={() => openTab("session")}
              className="ml-auto shrink-0 font-mono text-[11px] text-paper underline decoration-paper/30 underline-offset-4"
            >
              Open session
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <CodeEditor
            key={path}
            label={`${path}. Click to place the cursor and type. Tab accepts a prediction.`}
            lines={lines}
            cursor={activeCursor ?? { line: 0, col: 0 }}
            onChange={editFile(path)}
            onCursor={(c) => setCursors((all) => ({ ...all, [path]: c }))}
            onUndo={undoFile(path)}
            onSave={() => toast(`Saved ${basename(path)}`)}
            onFirstInput={() => {
              setAutoplay(false);
              if (isCharges && chargesAnimated) stopTyping();
            }}
            ghost={isCharges && chargesAnimated && phase === "suggest" && tabEnabled ? GHOST : null}
            onAcceptGhost={acceptGhost}
            showCaret={isCharges && chargesAnimated}
            fresh={fresh?.path === path ? fresh.rows : undefined}
            tabEnabled={tabEnabled}
          />
        </div>
      </div>
    );
  } else if (active === "session") {
    main = (
      <SessionView
        phase={
          phase === "prompting" ||
          phase === "running" ||
          phase === "answered" ||
          phase === "review" ||
          phase === "applied" ||
          phase === "discarded"
            ? phase
            : "other"
        }
        task={task}
        prompt={custom ?? userPrompt ?? (phase === "prompting" ? task.prompt.slice(0, promptLen) : task.prompt)}
        attachments={runAttachments}
        custom={custom}
        stopped={stopped}
        stepIndex={stepIndex}
        elapsed={elapsed}
        stepsOpen={stepsOpen}
        onToggleSteps={() => setStepsOpen((o) => !o)}
        hunks={hunks}
        kept={kept}
        onKeep={(h, value) => setKept((k) => k.map((v, j) => (j === h ? value : v)))}
        onApply={apply}
        onDiscard={discard}
        sweeping={sweeping}
        revealed={revealed}
        model={modelLabel}
        mode={modeLabel}
        canOpen={canOpen}
        onOpenFile={openFile}
        onRunForReal={() => {
          setMode("background");
          modeRef.current = "background";
          startTask(taskIndex, userPrompt ?? undefined);
        }}
      />
    );
  } else if (active === "inbox") {
    main = <InboxView items={inbox} onOpen={onInboxOpen} onDismiss={(id) => setInbox((list) => list.filter((x) => x.id !== id))} />;
  } else if (active === "agents") {
    main = (
      <AgentsView
        task={inRun ? task : null}
        status={runStatus}
        progress={runProgress}
        bgProgress={bgProgress}
        bgPaused={bgPaused}
        onToggleBg={() => setBgPaused((p) => !p)}
        onOpenSession={() => openTab("session")}
        onStop={stop}
        onNew={() => inputRef.current?.focus()}
      />
    );
  } else if (active === "rules") {
    main = (
      <RulesView
        rules={rules}
        onToggle={(i) => setRules((r) => r.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
        onAdd={(text) => {
          setRules((r) => [...r, { text, on: true }]);
          toast("Rule added");
        }}
        onRemove={(i) => setRules((r) => r.filter((_, j) => j !== i))}
      />
    );
  } else {
    const session = PAST_SESSIONS.find((s) => `past:${s.id}` === active)!;
    main = (
      <PastSessionView
        key={session.id}
        session={session}
        merged={merged.includes(session.id)}
        onMerge={() => {
          setMerged((m) => [...m, session.id]);
          setInbox((list) => list.filter((x) => x.id !== session.id));
          toast(`Merged ${session.branch} into main`);
        }}
        onCopyBranch={async () => {
          if (await copyText(session.branch)) toast("Branch name copied");
        }}
        canOpen={canOpen}
        onOpenFile={openFile}
      />
    );
  }

  return (
    <div className="relative" onKeyDown={onRootKey}>
      {/* registration marks, like a print proof */}
      {["-left-5 -top-5", "-right-5 -top-5", "-bottom-5 -left-5", "-bottom-5 -right-5"].map((pos) => (
        <span key={pos} aria-hidden className={cn("absolute hidden font-mono text-[12px] leading-none text-paper/25 md:block", pos)}>
          +
        </span>
      ))}

      <div
        ref={rootRef}
        className="overflow-hidden rounded-[12px] border border-paper/12 bg-ink-2 text-paper shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)]"
      >
        <div
          className={cn(
            "relative grid grid-cols-1 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            sidebarCollapsed ? "lg:grid-cols-[52px_minmax(0,1fr)]" : "lg:grid-cols-[228px_minmax(0,1fr)]",
          )}
        >
          {/* sidebar: full, collapsed to a rail, or a drawer on small screens */}
          {sidebarCollapsed && !drawer ? (
            <aside className="hidden flex-col items-center gap-1 overflow-hidden border-r border-paper/8 bg-ink py-2.5 lg:flex">
              <LogoGlyph size={14} className="mb-2 mt-1 text-accent" />
              {railItems.map(([Icon, label, onClick]) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  aria-label={label}
                  title={label}
                  className="relative grid size-9 place-items-center rounded-[7px] text-paper/45 transition-colors hover:bg-paper/5 hover:text-paper"
                >
                  <Icon size={16} />
                  {label === "Inbox" && unread && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Expand sidebar"
                className="mt-auto grid size-9 place-items-center rounded-[7px] text-paper/35 transition-colors hover:bg-paper/5 hover:text-paper"
              >
                <SidebarSimpleIcon size={16} />
              </button>
            </aside>
          ) : (
            <aside
              className={cn(
                "min-h-0 flex-col overflow-hidden border-r border-paper/8 bg-ink",
                drawer ? "absolute inset-y-0 left-0 z-30 flex w-[260px] shadow-[20px_0_60px_-20px_rgba(0,0,0,0.9)]" : "hidden lg:flex",
              )}
            >
              {sidebarBody}
            </aside>
          )}
          {drawer && (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 z-20 bg-ink/50 lg:hidden"
            />
          )}

          {/* main */}
          <div className="flex min-w-0 flex-col">
            <div className="flex h-11 items-stretch border-b border-paper/8 bg-ink">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="Open sidebar"
                className="grid w-11 shrink-0 place-items-center border-r border-paper/8 text-paper/50 hover:text-paper lg:hidden"
              >
                <ListIcon size={15} />
              </button>
              <div ref={tabStripRef} className="no-scrollbar relative flex min-w-0 flex-1 overflow-x-auto" data-lenis-prevent>
                <AnimatePresence initial={false}>
                {tabs.map((id) => {
                  const meta = tabMeta(id);
                  const isActive = id === active;
                  return (
                    <motion.div
                      key={id}
                      data-active-tab={isActive || undefined}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "group relative flex min-w-[124px] max-w-[190px] flex-[0_1_190px] items-center border-r border-paper/8",
                        isActive ? "bg-ink-2 text-paper" : "text-paper/40 hover:text-paper/70",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 top-0 h-px origin-center bg-accent transition-transform duration-300",
                          isActive ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setActive(id)}
                        title={meta.label}
                        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3.5 pr-1 font-mono text-[12px]"
                      >
                        <span className="shrink-0">{meta.icon}</span>
                        <span className="min-w-0 truncate">{meta.label}</span>
                        {id === CHARGES && fresh?.path === CHARGES && <span className="size-1.5 bg-accent" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => closeTab(id)}
                        aria-label={`Close ${meta.label}`}
                        className={cn(
                          "mr-1.5 grid size-5 shrink-0 place-items-center rounded-[4px] text-paper/40 transition-opacity hover:bg-paper/10 hover:text-paper",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <XIcon size={10} />
                      </button>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                aria-label="New session"
                title="New session"
                className="grid w-10 shrink-0 place-items-center text-paper/35 transition-colors hover:text-paper"
              >
                <PlusIcon size={13} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (await copyText(checkedOut)) toast("Branch name copied");
                }}
                title="Copy branch name"
                className="hidden max-w-[220px] shrink-0 items-center gap-1.5 border-l border-paper/8 px-4 font-mono text-[11px] text-paper/35 transition-colors hover:text-paper sm:flex"
              >
                <GitBranchIcon size={12} className="shrink-0" />
                <span className="truncate">{checkedOut}</span>
              </button>
            </div>

            <div className="h-[440px] min-h-0 md:h-[500px] lg:h-[600px]">
              <motion.div
                key={active ?? "empty"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                {main}
              </motion.div>
            </div>

            <Composer
              inputRef={inputRef}
              draft={draft}
              onDraft={setDraft}
              preview={phase === "prompting" && !userPrompt ? task.prompt.slice(0, promptLen) : null}
              working={working}
              onSubmit={submit}
              onStop={stop}
              branch={runBranch}
              attachments={attachments}
              onAttach={(p) => setAttachments((a) => (a.includes(p) ? a : [...a, p]))}
              onDetach={(p) => setAttachments((a) => a.filter((x) => x !== p))}
              files={ATTACHABLE}
              model={model}
              onModel={(id) => {
                setModel(id);
                toast(
                  id === "local"
                    ? "Local model. Nothing will leave the machine."
                    : `Model set to ${MODELS.find((m) => m.id === id)?.label}`,
                );
              }}
              mode={mode}
              onMode={setMode}
              activeTask={inRun ? taskIndex : null}
              onRun={runTask}
              onCommand={command}
              onFocus={() => setAutoplay(false)}
            />
          </div>
        </div>

        {/* status bar */}
        <div className="flex h-8 items-center gap-1 border-t border-paper/8 bg-ink px-2 font-mono text-[11px] text-paper/40">
          <StatusButton
            onClick={() => {
              setTabEnabled((t) => !t);
              toast(tabEnabled ? "Tab predictions off" : "Tab predictions on");
            }}
            title="Toggle Tab predictions"
          >
            <span className={cn("size-1.5", tabEnabled ? "bg-accent" : "border border-paper/40")} />
            {tabEnabled ? "Tab on-device" : "Tab off"}
          </StatusButton>
          <StatusButton onClick={() => indexing === null && setIndexing(0)} title="Rebuild the index" className="hidden sm:flex">
            {indexing === null ? "18,402 files indexed" : `Indexing ${Math.min(indexing, 100)}%`}
          </StatusButton>
          {model === "local" && <span className="hidden px-2 text-accent md:inline">Offline</span>}
          <StatusButton onClick={() => openTab("agents")} title="Open agents" className="ml-auto">
            <span aria-hidden className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn("size-[4px]", working ? "bg-accent" : "bg-paper/25")}
                  style={working ? { animation: `blink 0.9s steps(1) ${i * 0.3}s infinite` } : undefined}
                />
              ))}
            </span>
            {runningCount === 1 ? "1 agent" : `${runningCount} agents`} running
          </StatusButton>
          <span className="hidden px-2 md:inline">
            {activeCursor ? `Ln ${activeCursor.line + 1}, Col ${activeCursor.col + 1}` : active ? tabMeta(active).label : "No file"}
          </span>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  trailing,
  active,
  onClick,
}: {
  icon: React.ComponentType<IconProps>;
  label: string;
  trailing?: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] transition-colors duration-200",
        active ? "bg-paper/[0.07] text-paper" : "text-paper/60 hover:bg-paper/[0.04] hover:text-paper",
      )}
    >
      <Icon size={14} className={cn("relative", active ? "text-accent" : "text-paper/40")} />
      <span className="relative">{label}</span>
      {trailing && <span className="relative ml-auto">{trailing}</span>}
    </button>
  );
}

function StatusButton({
  children,
  onClick,
  title,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn("flex h-6 items-center gap-1.5 rounded-[4px] px-2 transition-colors hover:bg-paper/5 hover:text-paper", className)}
    >
      {children}
    </button>
  );
}
