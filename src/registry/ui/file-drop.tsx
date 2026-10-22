"use client";

import { ArrowClockwiseIcon, CheckIcon, CloudArrowUpIcon, FileIcon, FileImageIcon, FilePdfIcon, FileTextIcon, FileVideoIcon, FileZipIcon, WarningCircleIcon, XIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";

/*
 * A place to drop files, pressed into the page with a dashed edge. It wakes as soon as a file is
 * dragged anywhere over the page, and lifts to meet it when one is over it. Drop, or press it to
 * choose. Each file gets a row with its kind's icon, its size, and a bar filling in ink as it goes
 * up; one that fails says why and offers to try again, one that can't go in (too large, the wrong
 * kind, one too many) says so plainly. Every row can be taken away, which stops its upload.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

export type DropFile = {
  id: string;
  file: File;
  /** Uploading, uploaded, failed while uploading, or refused before it started. */
  status: "uploading" | "done" | "error" | "refused";
  /** 0 to 1. */
  progress: number;
  /** Why it failed or was refused. */
  error?: string;
};

export type FileDropProps = {
  /** What it takes, as a file input's accept: "image/*,.svg". */
  accept?: string;
  /** The largest file it takes, in bytes. */
  maxSize?: number;
  /** The most files it holds. */
  maxFiles?: number;
  /** One file, or several. */
  multiple?: boolean;
  /** Sends one file, calling report with 0 to 1 as it goes, and throwing to fail it. The signal aborts when the file is taken away. Without it, files are only listed. */
  upload?: (file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<void>;
  /** Called with every file and its state, each time anything changes. */
  onFilesChange?: (files: DropFile[]) => void;
  /** Files it starts with, checked and sent like dropped ones. */
  defaultFiles?: File[];
  /** The zone's line, and the quieter one under it. */
  title?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  /** Names it for screen readers. */
  label?: string;
  /** With a name, the hidden file input carries what was chosen in a form (drops can't be added to it). */
  name?: string;
  id?: string;
  className?: string;
};

const sizeOf = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const takes = (file: File, accept?: string) =>
  !accept ||
  accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? file.type.toLowerCase().startsWith(a.slice(0, -1)) : file.type.toLowerCase() === a));

const iconOf = (file: File): Icon =>
  file.type.startsWith("image/") ? FileImageIcon : file.type === "application/pdf" ? FilePdfIcon : file.type.startsWith("video/") ? FileVideoIcon : /zip|compressed|tar/.test(file.type) ? FileZipIcon : file.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(file.name) ? FileTextIcon : FileIcon;

/* Whether a drag is carrying files, rather than text or a link. */
const carriesFiles = (e: { dataTransfer: DataTransfer | null }) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");

let made = 0;
const nextId = () => `file-${++made}`;

export function FileDrop({ accept, maxSize, maxFiles, multiple = true, upload, onFilesChange, defaultFiles, title = "Drop files here", hint, disabled, label, name, id, className }: FileDropProps) {
  const reduced = useReducedMotion();
  const auto = useId();
  const [files, setFiles] = useState<DropFile[]>([]);
  const [page, setPage] = useState(false);
  const [over, setOver] = useState(0);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const flying = useRef(new Map<string, { file: DropFile; stop: AbortController }>());
  const latest = useRef<DropFile[]>([]);
  const started = useRef(false);
  const depth = useRef({ page: 0, zone: 0 });

  const patch = (fid: string, change: Partial<DropFile>) => setFiles((fs) => fs.map((f) => (f.id === fid ? { ...f, ...change } : f)));

  const send = (f: DropFile) => {
    if (!upload) return;
    const stop = new AbortController();
    flying.current.set(f.id, { file: f, stop });
    upload(f.file, (p) => !stop.signal.aborted && patch(f.id, { progress: Math.max(0, Math.min(1, p)) }), stop.signal)
      .then(() => {
        if (stop.signal.aborted) return;
        flying.current.delete(f.id);
        patch(f.id, { status: "done", progress: 1 });
        setSaid(`${f.file.name} is uploaded.`);
      })
      .catch((err: unknown) => {
        if (stop.signal.aborted) return;
        flying.current.delete(f.id);
        const why = err instanceof Error && err.message ? err.message : "It didn't go through.";
        patch(f.id, { status: "error", error: why });
        setSaid(`${f.file.name} failed: ${why}`);
      });
  };

  // Checks each new file against the limits, lists it, and starts sending the ones that pass.
  const add = (list: File[]) => {
    if (disabled || !list.length) return;
    const room = maxFiles === undefined ? Infinity : maxFiles - latest.current.filter((f) => f.status !== "refused").length;
    const picked = multiple ? list : list.slice(0, 1);
    let kept = 0;
    const next = picked.map((file): DropFile => {
      const why = !takes(file, accept) ? `Not a kind of file this takes.` : maxSize !== undefined && file.size > maxSize ? `Too large: ${sizeOf(file.size)}, and the limit is ${sizeOf(maxSize)}.` : kept >= room ? `One too many: it holds ${maxFiles}.` : "";
      if (!why) kept++;
      return { id: nextId(), file, status: why ? "refused" : upload ? "uploading" : "done", progress: why ? 0 : upload ? 0 : 1, error: why || undefined };
    });
    setFiles((fs) => (multiple ? [...fs, ...next] : next));
    next.filter((f) => f.status === "uploading").forEach(send);
    const refused = next.filter((f) => f.status === "refused").length;
    setSaid(`${kept} ${kept === 1 ? "file" : "files"} added${refused ? `, ${refused} refused` : ""}.`);
  };

  const remove = (fid: string) => {
    flying.current.get(fid)?.stop.abort();
    flying.current.delete(fid);
    const f = latest.current.find((x) => x.id === fid);
    setFiles((fs) => fs.filter((x) => x.id !== fid));
    if (f) setSaid(`${f.file.name} removed.`);
  };

  const retry = (f: DropFile) => {
    patch(f.id, { status: "uploading", progress: 0, error: undefined });
    send({ ...f, status: "uploading", progress: 0 });
  };

  useEffect(() => {
    latest.current = files;
    onFilesChange?.(files);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  // The files it starts with go in once, as if they'd been dropped, as soon as there are some.
  useEffect(() => {
    if (started.current || !defaultFiles?.length) return;
    started.current = true;
    add(defaultFiles);
  }, [defaultFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every upload stops when the zone goes away. Strict Mode takes it away and puts it back once in
  // development, so whatever that cut off is sent again.
  useEffect(() => {
    const all = flying.current;
    all.forEach(({ file, stop }) => {
      if (!stop.signal.aborted) return;
      patch(file.id, { progress: 0 });
      send(file);
    });
    return () => all.forEach(({ stop }) => stop.abort());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A file dragged anywhere over the page wakes the zone; a drop that misses it doesn't open the file in the tab.
  useEffect(() => {
    if (disabled) return;
    const enter = (e: globalThis.DragEvent) => {
      if (!carriesFiles(e)) return;
      depth.current.page++;
      setPage(true);
    };
    const leave = (e: globalThis.DragEvent) => {
      if (!carriesFiles(e)) return;
      depth.current.page = Math.max(0, depth.current.page - 1);
      if (!depth.current.page) setPage(false);
    };
    const end = (e: globalThis.DragEvent) => {
      if (carriesFiles(e)) e.preventDefault();
      depth.current = { page: 0, zone: 0 };
      setPage(false);
      setOver(0);
    };
    const hold = (e: globalThis.DragEvent) => carriesFiles(e) && e.preventDefault();
    addEventListener("dragenter", enter);
    addEventListener("dragleave", leave);
    addEventListener("dragover", hold);
    addEventListener("drop", end);
    return () => {
      removeEventListener("dragenter", enter);
      removeEventListener("dragleave", leave);
      removeEventListener("dragover", hold);
      removeEventListener("drop", end);
    };
  }, [disabled]);

  const zone = {
    onDragEnter: (e: DragEvent) => {
      if (!carriesFiles(e) || disabled) return;
      e.preventDefault();
      depth.current.zone++;
      setOver(e.dataTransfer.items.length || 1);
    },
    onDragOver: (e: DragEvent) => {
      if (!carriesFiles(e) || disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: () => {
      depth.current.zone = Math.max(0, depth.current.zone - 1);
      if (!depth.current.zone) setOver(0);
    },
    onDrop: (e: DragEvent) => {
      if (!carriesFiles(e) || disabled) return;
      e.preventDefault();
      depth.current = { page: 0, zone: 0 };
      setOver(0);
      setPage(false);
      add(Array.from(e.dataTransfer.files));
    },
  };

  const state = over ? "over" : page ? "page" : "rest";
  const spring = reduced ? { duration: 0 } : SNAPPY;

  return (
    <div className={cx("grid w-full gap-2.5", className)}>
      <motion.button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={label}
        aria-describedby={`${auto}-hint`}
        onClick={() => input.current?.click()}
        {...zone}
        animate={{ scale: reduced ? 1 : state === "over" ? 1.015 : 1 }}
        whileTap={reduced || disabled ? undefined : { scale: 0.985 }}
        transition={spring}
        className={cx(
          "relative grid w-full place-items-center gap-3 overflow-hidden rounded-[22px] px-6 py-7 text-center outline-none transition-[background-color,box-shadow] duration-200",
          "focus-visible:shadow-[0_0_0_2px_var(--bd-surface),0_0_0_4px_var(--bd-ui-focus)]",
          state === "over" ? "bg-[var(--bd-surface)] shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.6),0_14px_34px_-14px_rgb(var(--bd-shade)/0.3)]" : "bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)]",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        {/* The dashed edge, drawn so its dashes are even all the way round. */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <rect x="0.75" y="0.75" rx="21.25" ry="21.25" fill="none" strokeWidth="1.5" strokeDasharray="6 6" style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" }} className={cx("transition-[stroke,opacity] duration-200", state === "rest" ? "stroke-[var(--bd-line-strong)] opacity-90" : state === "page" ? "stroke-[var(--bd-fg)] opacity-55" : "opacity-0")} />
        </svg>
        <motion.span
          aria-hidden
          animate={{ y: reduced ? 0 : state === "over" ? -4 : state === "page" ? -2 : 0 }}
          transition={spring}
          className="grid size-12 place-items-center rounded-[15px] text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]"
        >
          <CloudArrowUpIcon size={24} weight="duotone" />
        </motion.span>
        <span className="grid gap-1">
          <span className="text-sm font-medium text-[var(--bd-fg)]">{state === "over" ? `Let go to add ${over === 1 ? "it" : `${over} files`}` : state === "page" ? "Drop it here" : title}</span>
          <span id={`${auto}-hint`} className="text-[12.5px] text-[var(--bd-muted)]">
            {hint ?? (
              <>
                or <span className="font-medium text-[var(--bd-fg)] underline decoration-[var(--bd-line-strong)] underline-offset-4">choose {multiple ? "files" : "a file"}</span>
              </>
            )}
          </span>
        </span>
      </motion.button>
      <input
        ref={input}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          if (!name) e.target.value = "";
        }}
      />
      <ul aria-label="Files" className="grid">
        <AnimatePresence initial={false}>
          {files.map((f) => {
            const I = iconOf(f.file);
            const bad = f.status === "error" || f.status === "refused";
            return (
              <motion.li
                key={f.id}
                layout="position"
                initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, transition: { duration: 0.18 } }}
                transition={reduced ? { duration: 0 } : SOFT}
                className="overflow-hidden"
              >
                <div className="mb-1.5 flex items-center gap-3 rounded-[16px] bg-[var(--bd-surface)] p-2 pr-2.5 shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
                  <span className={cx("grid size-9 shrink-0 place-items-center rounded-[11px]", bad ? "bg-[color-mix(in_oklab,var(--bd-ui-stop)_12%,var(--bd-surface))] text-[var(--bd-ui-stop)]" : "bg-[var(--bd-ui-track)] text-[var(--bd-fg)]")}>
                    {bad ? <WarningCircleIcon size={18} weight="duotone" /> : <I size={18} weight="duotone" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] font-medium text-[var(--bd-fg)]">{f.file.name}</span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--bd-subtle)]">{sizeOf(f.file.size)}</span>
                    </span>
                    {f.status === "uploading" ? (
                      <span role="progressbar" aria-label={`Uploading ${f.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(f.progress * 100)} className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
                        <motion.span className="block h-full w-full origin-left rounded-full [background:var(--bd-ui-ink)]" initial={{ scaleX: 0 }} animate={{ scaleX: f.progress }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 26 }} />
                      </span>
                    ) : (
                      <span className={cx("mt-0.5 block truncate text-[12px]", bad ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-muted)]")}>{bad ? f.error : upload ? "Uploaded" : "Ready"}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {f.status === "done" && upload && (
                        <motion.span key="done" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={spring} aria-hidden className="mr-1 grid size-5 place-items-center rounded-full text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
                          <CheckIcon size={11} weight="bold" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {f.status === "error" && (
                      <button type="button" aria-label={`Try ${f.file.name} again`} onClick={() => retry(f)} className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[var(--bd-ui-track)] hover:text-[var(--bd-fg)] active:scale-90">
                        <ArrowClockwiseIcon size={15} weight="regular" />
                      </button>
                    )}
                    <button type="button" aria-label={`Remove ${f.file.name}`} onClick={() => remove(f.id)} className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[var(--bd-ui-track)] hover:text-[var(--bd-fg)] active:scale-90">
                      <XIcon size={13} weight="regular" />
                    </button>
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
