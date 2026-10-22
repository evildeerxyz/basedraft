"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/*
 * Short notes that rise in at the corner of the window and leave on their own: a deploy that
 * finished, an invite sent, a push that failed with a way to try again. Call toast() from
 * anywhere; mount <Toaster /> once. They stack like sheets of paper, spread out when you point
 * at them (and hold still while you read), and swipe away to the right.
 */

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

export type ToastTone = "default" | "ok" | "wait" | "stop";
export type ToastOptions = {
  description?: ReactNode;
  /** A status dot: ok, wait (with a pulse) or stop. A stop toast is announced at once. */
  tone?: ToastTone;
  /** One thing to do about it, as a button on the toast. */
  action?: { label: string; onClick: () => void };
  /** How long it stays, in milliseconds. Infinity keeps it until it's dismissed or updated. */
  duration?: number;
};
type Item = {
  id: number;
  title: ReactNode;
  tone: ToastTone;
  description?: ReactNode;
  action?: ToastOptions["action"];
  duration: number;
  stamp: number;
};

/* The toasts, held outside React so toast() works from anywhere: an event handler, a fetch, a promise. */
let items: Item[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Shows a toast. Returns its id, to update or dismiss it later. */
export function toast(title: ReactNode, options: ToastOptions = {}) {
  const id = next++;
  items = [
    ...items,
    {
      id,
      title,
      tone: options.tone ?? "default",
      description: options.description,
      action: options.action,
      duration: options.duration ?? 4500,
      stamp: Date.now(),
    },
  ];
  emit();
  return id;
}
/** Changes a toast in place: a "Publishing" one becomes "Published" when it's done. Its time starts over. */
toast.update = (id: number, title: ReactNode, options: ToastOptions = {}) => {
  items = items.map((t) =>
    t.id === id
      ? {
          ...t,
          title,
          ...options,
          tone: options.tone ?? t.tone,
          duration: options.duration ?? 4500,
          stamp: Date.now(),
        }
      : t,
  );
  emit();
};
/** Dismisses one toast, or every toast with no id. */
toast.dismiss = (id?: number) => {
  items = id === undefined ? [] : items.filter((t) => t.id !== id);
  emit();
};

/*
 * Only one Toaster draws the toasts, the first mounted, so a second one by mistake doesn't show
 * them twice. If it goes, the next in line takes over.
 */
let toasters: symbol[] = [];
const toasterListeners = new Set<() => void>();
const onToasters = (l: () => void) => {
  toasterListeners.add(l);
  return () => toasterListeners.delete(l);
};

const DOT: Record<ToastTone, string> = {
  default: "",
  ok: "bg-[var(--bd-ui-ok)]",
  wait: "bg-[var(--bd-ui-wait)]",
  stop: "bg-[var(--bd-ui-stop)]",
};
const GAP = 8;
const PEEK = 10;

function Toast({
  t,
  index,
  expanded,
  offset,
  front,
  onHeight,
}: {
  t: Item;
  index: number;
  expanded: boolean;
  offset: number;
  /** The front toast's height: one behind it is cut to it, so its top edge peeks out evenly. */ front: number;
  onHeight: (id: number, h: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  // Time left, kept across a pause; a fresh stamp (an update) starts it over.
  const left = useRef({ stamp: t.stamp, ms: t.duration });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeight(t.id, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [t.id, onHeight]);

  useEffect(() => {
    if (left.current.stamp !== t.stamp)
      left.current = { stamp: t.stamp, ms: t.duration };
    if (expanded || !Number.isFinite(left.current.ms)) return;
    const start = Date.now();
    const timer = setTimeout(() => toast.dismiss(t.id), left.current.ms);
    return () => {
      clearTimeout(timer);
      left.current.ms -= Date.now() - start;
    };
  }, [expanded, t.id, t.stamp, t.duration]);

  const behind = !expanded && index > 0;
  return (
    <motion.li
      layout={false}
      role={t.tone === "stop" ? "alert" : "status"}
      aria-atomic="true"
      initial={still ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{
        opacity: index > 2 ? 0 : behind ? 1 - index * 0.18 : 1,
        y: expanded ? -offset : -index * PEEK,
        scale: behind ? 1 - index * 0.045 : 1,
      }}
      exit={
        still
          ? { opacity: 0 }
          : { opacity: 0, x: 60, transition: { duration: 0.18 } }
      }
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      drag={still ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.08, right: 0.9 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90 || info.velocity.x > 500) toast.dismiss(t.id);
      }}
      onKeyDown={(e) => e.key === "Escape" && toast.dismiss(t.id)}
      // A toast behind the front one is cut to its height and shrinks from its top, so each peeks out by the same few pixels.
      style={{
        zIndex: 50 - index,
        pointerEvents: index > 2 ? "none" : undefined,
        transformOrigin: behind ? "top center" : "bottom center",
        bottom: behind ? undefined : 0,
        top: behind ? `calc(100% - ${front}px)` : undefined,
      }}
      className="absolute right-0 w-full touch-pan-y"
    >
      <div
        className="relative overflow-hidden rounded-[16px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_18px_40px_-16px_rgb(var(--bd-shade)/0.55),0_2px_6px_rgb(var(--bd-shade)/0.18)]"
        style={{ height: behind ? front : undefined }}
      >
        <div ref={ref} className="relative flex gap-3 p-3.5 pr-11">
          {t.tone !== "default" && (
            <span
              aria-hidden
              className="relative mt-[5px] grid size-2.5 shrink-0 place-items-center"
            >
              {t.tone === "wait" && (
                <span
                  className={cx(
                    "absolute inset-0 rounded-full animate-[bd-ui-pulse_1.6s_ease-out_infinite] motion-reduce:hidden",
                    DOT.wait,
                  )}
                />
              )}
              <span
                className={cx("relative size-2 rounded-full", DOT[t.tone])}
              />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-[13px] leading-snug opacity-65">
                {t.description}
              </p>
            )}
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  toast.dismiss(t.id);
                }}
                className="mt-2.5 inline-flex h-7 items-center rounded-full bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_14%,transparent)] px-3 text-xs font-medium transition-colors hover:bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_22%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss"
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full opacity-55 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <XIcon size={13} weight="regular" />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

const PLACES = {
  "bottom-right":
    "bottom-4 right-4 max-sm:left-3 max-sm:right-3 max-sm:bottom-3",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 max-sm:bottom-3",
  "bottom-left": "bottom-4 left-4 max-sm:left-3 max-sm:right-3 max-sm:bottom-3",
} as const;

/** Where the toasts appear. Mount it once, near the root; a second one stays empty. */
export function Toaster({
  position = "bottom-right",
  label = "Notifications",
}: {
  position?: keyof typeof PLACES;
  label?: string;
}) {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
  const [me] = useState(() => Symbol("toaster"));
  const mine = useSyncExternalStore(
    onToasters,
    () => toasters[0] === me,
    () => false,
  );
  useEffect(() => {
    toasters = [...toasters, me];
    toasterListeners.forEach((l) => l());
    return () => {
      toasters = toasters.filter((t) => t !== me);
      toasterListeners.forEach((l) => l());
    };
  }, [me]);
  const [hover, setHover] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const onHeight = useCallback(
    (id: number, h: number) =>
      setHeights((m) => (m[id] === h ? m : { ...m, [id]: h })),
    [],
  );

  if (!mine || typeof document === "undefined") return null;
  // Newest first: it sits in front, the older ones peek out behind it.
  const shown = [...list].reverse();
  const front = heights[shown[0]?.id] ?? 64;
  const offsets = shown.map((_, i) =>
    shown.slice(0, i).reduce((sum, t) => sum + (heights[t.id] ?? 64) + GAP, 0),
  );
  const tall = hover
    ? offsets[Math.min(2, shown.length - 1)] +
      (heights[shown[Math.min(2, shown.length - 1)]?.id] ?? 64)
    : front + Math.min(2, shown.length - 1) * PEEK;
  return createPortal(
    <section
      aria-label={label}
      className={cx("fixed z-[110] w-[360px] max-sm:w-auto", PLACES[position])}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) =>
        !e.currentTarget.contains(e.relatedTarget as Node) && setHover(false)
      }
    >
      <ol
        className="relative transition-[height] duration-300 ease-[var(--bd-ease)]"
        style={{ height: shown.length ? tall : 0 }}
      >
        <AnimatePresence initial={false}>
          {shown.map((t, i) => (
            <Toast
              key={t.id}
              t={t}
              index={i}
              expanded={hover}
              offset={offsets[i]}
              front={front}
              onHeight={onHeight}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>,
    document.body,
  );
}
