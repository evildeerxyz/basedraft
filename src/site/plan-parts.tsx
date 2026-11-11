import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The small pieces every card and dialog on the site shares: a line of small print with its icon,
 * the glow along a dialog's head, the tile an icon sits in, and the quiet strip at a card's foot.
 */

/** The icon that leads a line of small print, centered on its first line however the text wraps. */
function NoteIcon({ icon: I }: { icon: Icon }) {
  return <I size={14} weight="duotone" aria-hidden className="mt-[calc((1lh_-_14px)/2)] shrink-0" />;
}

/** A line of small print with its icon. Takes its size and color from the class it's given. */
export function Note({ icon, className, children }: { icon: Icon; className?: string; children: ReactNode }) {
  return (
    <p className={cn("flex items-start gap-1.5", className)}>
      <NoteIcon icon={icon} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/*
 * The aura as a soft band along a card's top edge: lavender, rose and butter fading down into the
 * card. The head of every dialog has one. Inside an `isolate` card, pass `-z-10` to set it behind
 * the content without wrapping it.
 */
export function Glow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bd-glow pointer-events-none absolute inset-x-0 top-0 h-36", className)} />;
}

/*
 * The tile an icon sits in: soft on white cards, ink at the head of a dialog, white on an ink card.
 * Soft is solid, not see-through, so the glow behind a card's header doesn't show in it.
 */
const TILE = {
  soft: "bg-[color-mix(in_srgb,var(--bd-fg)_5%,var(--bd-surface))] text-fg",
  ink: "bg-fg text-canvas",
  paper: "bg-canvas text-fg",
};

export function IconTile({ icon: I, tone = "soft", className }: { icon: Icon; tone?: keyof typeof TILE; className?: string }) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-[14px]", TILE[tone], className)}>
      <I size={22} weight="duotone" />
    </span>
  );
}

/** The quiet strip along the bottom of a card: an icon, then the small print. */
const NOTE = "flex w-full items-start justify-center gap-1.5 border-t px-4 py-3 text-center text-meta";
const CARD_NOTE = `${NOTE} border-line text-muted`;
const CARD_NOTE_DARK = `${NOTE} border-canvas/10 text-canvas/60`;

export function CardNote({ icon, dark, className, children }: { icon: Icon; dark?: boolean; className?: string; children: ReactNode }) {
  return (
    <p className={cn(dark ? CARD_NOTE_DARK : CARD_NOTE, className)}>
      <NoteIcon icon={icon} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
