"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
/*
 * A stack of cards to decide on one at a time. The top one follows your hand, tilting the way
 * it's going: Keep to the right, Skip to the left, Star up. Let go past the line, or flick it,
 * and it flies off while the rest of the stack steps up.
 * The round buttons and the arrow keys do the same, and Undo throws the last card back.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type SwipeDirection = "left" | "right" | "up";

const OUT = 110;
const FLICK = 650;

export type SwipeDeckProps<T> = {
  items: T[];
  /** A key for each card. */
  getKey: (item: T) => string;
  /** What a card shows. */
  children: (item: T) => ReactNode;
  /** Runs when a card goes, with which way. */
  onSwipe?: (item: T, direction: SwipeDirection) => void;
  /** Runs when Undo brings a card back. */
  onUndo?: (item: T, direction: SwipeDirection) => void;
  /** What each way means: the stamps and the buttons say it. */
  labels?: Partial<Record<SwipeDirection, string>>;
  /** Allows swiping up, to star. */
  star?: boolean;
  /** How many cards show in the stack. */
  stack?: number;
  /** A card's shape, width over height. */
  ratio?: number;
  /** What shows when every card is gone; Start over is under it. */
  empty?: ReactNode;
  /** What the deck is, for screen readers. */
  label?: string;
  className?: string;
};

type Fly = { fly: (dir: SwipeDirection, vx?: number, vy?: number) => Promise<void> };
const SPRING_BACK = { type: "spring" as const, stiffness: 500, damping: 30 };

/** One card: its place in the stack outside, and the hand that moves it inside. */
function Card({ isTop, index, stack, from, register, onRelease, children }: { isTop: boolean; index: number; stack: number; from: SwipeDirection | null; register: (hand: Fly, on: boolean) => void; onRelease: (info: PanInfo) => boolean; children: ReactNode }) {
  const still = useReducedMotion();
  const start = from === "up" ? { x: 0, y: -560 } : from ? { x: from === "right" ? 560 : -560, y: 0 } : { x: 0, y: 0 };
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const rotate = useTransform(x, [-240, 240], [-16, 16]);

  // Brought back by Undo: it flies in from where it went.
  useEffect(() => {
    if (!from) return;
    animate(x, 0, { type: "spring", stiffness: 260, damping: 26 });
    animate(y, 0, { type: "spring", stiffness: 260, damping: 26 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The top card lends its hand to the buttons and keys.
  useEffect(() => {
    if (!isTop) return;
    const own: Fly = {
      fly: async (dir, vx = 0, vy = 0) => {
        if (still) return;
        const w = Math.max(560, window.innerWidth * 0.7);
        if (dir === "up") await Promise.all([animate(y, -Math.max(640, window.innerHeight), { type: "spring", stiffness: 170, damping: 24, velocity: vy }), animate(x, x.get() * 1.3, { duration: 0.3 })]);
        else await Promise.all([animate(x, (dir === "right" ? 1 : -1) * w, { type: "spring", stiffness: 150, damping: 22, velocity: vx }), animate(y, y.get() + vy * 0.06, { duration: 0.3 })]);
      },
    };
    register(own, true);
    // Going away clears the hand only if it's still this card's: the next card has taken it by then.
    return () => register(own, false);
  }, [isTop, register, still, x, y]);

  return (
    <motion.div
      initial={from ? false : { scale: 1 - (index + 1) * 0.05, y: (index + 1) * 14, opacity: 0 }}
      animate={{ scale: 1 - index * 0.05, y: index * 14, opacity: index >= stack - 1 ? 0.55 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="absolute inset-0 origin-bottom"
      style={{ zIndex: stack - index }}
      aria-hidden={!isTop}
    >
      <motion.div
        drag={isTop}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          // Not far enough to go: back to the stack.
          if (!onRelease(info)) {
            animate(x, 0, SPRING_BACK);
            animate(y, 0, SPRING_BACK);
          }
        }}
        style={{ x, y, rotate }}
        className={cx("relative size-full overflow-hidden rounded-[24px] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08),0_18px_40px_-20px_rgb(var(--bd-shade)/0.45)]", isTop ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none")}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function SwipeDeck<T>({ items, getKey, children, onSwipe, onUndo, labels, star = true, stack = 3, ratio = 4 / 5, empty, label = "Cards", className }: SwipeDeckProps<T>) {
  const [at, setAt] = useState(0);
  const [gone, setGone] = useState<Array<{ key: string; dir: SwipeDirection }>>([]);
  const [back, setBack] = useState<SwipeDirection | null>(null);
  const [said, setSaid] = useState("");
  const busy = useRef(false);
  const hand = useRef<Fly | null>(null);
  const register = useCallback((h: Fly, on: boolean) => {
    if (on) hand.current = h;
    else if (hand.current === h) hand.current = null;
  }, []);
  const words = { left: labels?.left ?? "Skip", right: labels?.right ?? "Keep", up: labels?.up ?? "Star" };

  const top = items[at];
  const left = items.length - at;

  /** Sends the top card off one way: flies it, then moves on. */
  const go = async (dir: SwipeDirection, vx = 0, vy = 0) => {
    if (!top || busy.current) return;
    busy.current = true;
    await hand.current?.fly(dir, vx, vy);
    setGone((g) => [...g, { key: getKey(top), dir }]);
    setBack(null);
    setAt((n) => n + 1);
    setSaid(`${words[dir]}: card ${at + 1} of ${items.length}. ${left - 1} left.`);
    onSwipe?.(top, dir);
    busy.current = false;
  };

  const undo = () => {
    const last = gone.at(-1);
    if (!last || busy.current) return;
    setGone((g) => g.slice(0, -1));
    setBack(last.dir);
    setAt((n) => n - 1);
    setSaid(`Brought back card ${at} of ${items.length}.`);
    onUndo?.(items[at - 1], last.dir);
  };

  /** Where a let-go card goes, if anywhere: true when it's on its way. */
  const release = (info: PanInfo) => {
    const dir: SwipeDirection | null =
      star && (info.offset.y < -OUT || info.velocity.y < -FLICK) && Math.abs(info.offset.x) < OUT ? "up" : info.offset.x > OUT || info.velocity.x > FLICK ? "right" : info.offset.x < -OUT || info.velocity.x < -FLICK ? "left" : null;
    if (!dir) return false;
    go(dir, info.velocity.x, info.velocity.y);
    return true;
  };

  const keys = (e: KeyboardEvent) => {
    const dir = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: star ? "up" : null } as Record<string, SwipeDirection | null>)[e.key];
    if (dir) {
      e.preventDefault();
      go(dir);
    } else if (e.key === "Backspace" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      undo();
    }
  };

  return (
    <div className={cx("grid w-full max-w-[360px] justify-items-center gap-8", className)}>
      {/* The cards behind sit lower than the top one; the deck keeps room for them under it. */}
      <div role="group" aria-roledescription="card deck" aria-label={`${label}, ${left} left`} tabIndex={0} onKeyDown={keys} style={{ aspectRatio: ratio, marginBottom: (stack - 1) * 14 }} className="relative w-full outline-none focus-visible:rounded-[26px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bd-ui-focus)]">
        <AnimatePresence initial={false}>
          {items.slice(at, at + stack).map((item, i) => (
            <Card key={getKey(item)} isTop={i === 0} index={i} stack={stack} from={i === 0 ? back : null} register={register} onRelease={release}>
              {children(item)}
            </Card>
          ))}
        </AnimatePresence>
        {!top && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 grid place-content-center justify-items-center gap-4 rounded-[24px] p-6 text-center bg-[var(--bd-surface-2)] shadow-[inset_0_0_0_1px_var(--bd-line)]">
            {empty ?? <p className="text-[15px] font-medium text-[var(--bd-fg)]">That&apos;s all of them</p>}
            <button
              type="button"
              onClick={() => {
                setAt(0);
                setGone([]);
                setBack(null);
              }}
              className="h-9 rounded-full px-4 text-[13px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
            >
              Start over
            </button>
          </motion.div>
        )}
      </div>

      {/* The choices sit where the swipes go: one way left, the other right, a star up the middle. */}
      <div className="-mt-2 grid w-full grid-cols-[1fr_auto_1fr] items-start px-3">
        <Choice word={words.left} onClick={() => go("left")} disabled={!top} className="justify-self-start">
          <XIcon weight="bold" className="size-6 text-[var(--bd-ui-stop)]" />
        </Choice>
        {star ? (
          <Choice word={words.up} onClick={() => go("up")} disabled={!top} small>
            <StarIcon weight="fill" className="size-[18px] text-[var(--bd-fg)]" />
          </Choice>
        ) : (
          <Undo onClick={undo} disabled={!gone.length} middle />
        )}
        <Choice word={words.right} onClick={() => go("right")} disabled={!top} className="justify-self-end">
          <CheckIcon weight="bold" className="size-6 text-[var(--bd-ui-ok)]" />
        </Choice>
      </div>
      {star && <Undo onClick={undo} disabled={!gone.length} />}
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}

/** A round raised button with what it means written under it. */
function Choice({ word, onClick, disabled, small, className, children }: { word: string; onClick: () => void; disabled: boolean; small?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cx("group/choice grid justify-items-center gap-2 outline-none disabled:pointer-events-none disabled:opacity-40", className)}>
      <span
        className={cx(
          "grid place-items-center rounded-full transition-[transform,filter] duration-150 [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.07)] group-hover/choice:brightness-[1.03] group-active/choice:scale-95 group-focus-visible/choice:shadow-[var(--bd-ui-lift),0_0_0_3px_var(--bd-ui-focus)]",
          small ? "my-1.5 size-11" : "size-14",
        )}
      >
        {children}
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--bd-subtle)]">{word}</span>
    </button>
  );
}

/** Undo, quiet: brings the last card back. */
function Undo({ onClick, disabled, middle }: { onClick: () => void; disabled: boolean; middle?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cx("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-40", middle ? "mt-3" : "-mt-3")}>
      <ArrowCounterClockwiseIcon weight="bold" className="size-3.5" />
      Undo
    </button>
  );
}
