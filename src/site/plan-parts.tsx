import { ArrowsClockwiseIcon, BriefcaseIcon, CheckIcon, CodeIcon, CreditCardIcon, DiamondIcon, FigmaLogoIcon, FileHtmlIcon, InfinityIcon, LayoutIcon, LifebuoyIcon, PenNibIcon, ShieldCheckIcon, SquaresFourIcon, StackIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FeatureIcon, NoteKind, PlanFeature } from "./content";

/*
 * The pieces of a plan card, shared by the Pro modal and every pricing card on the site, so a
 * plan reads the same wherever it shows up: an icon tile, a big name, what's in it as a list of
 * rows on a soft gray panel, and the price with its action at the foot.
 */

export const FEATURE_ICON: Record<FeatureIcon, Icon> = {
  figma: FigmaLogoIcon,
  paper: FileHtmlIcon,
  code: CodeIcon,
  layouts: SquaresFourIcon,
  components: StackIcon,
  template: LayoutIcon,
  studio: PenNibIcon,
  personal: UserIcon,
  pro: DiamondIcon,
  team: UsersThreeIcon,
  client: BriefcaseIcon,
  support: LifebuoyIcon,
};

/*
 * Every part takes `dark` for the featured plan, which is an ink card: the same layout with the
 * grays turned into white at low opacity, so it reads as the same card in negative.
 */

export const NOTE_ICON: Record<NoteKind, Icon> = {
  forever: InfinityIcon,
  updates: ArrowsClockwiseIcon,
  seats: UsersThreeIcon,
  card: CreditCardIcon,
  refund: ShieldCheckIcon,
};

/** The icon that leads a line of small print, centered on its first line however the text wraps. */
export function NoteIcon({ icon: I }: { icon: Icon }) {
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

/** What a plan includes. A row can be lifted out to show it's the one you reached for. */
export function FeatureList({ items, hit, dark, className }: { items: PlanFeature[]; hit?: FeatureIcon | null; dark?: boolean; className?: string }) {
  return (
    <ul className={cn("space-y-0.5 rounded-[var(--bd-r-inset)] p-1.5", dark ? "bg-canvas/[0.06]" : "bg-fg/[0.03]", className)}>
      {items.map((f) => {
        const on = hit === f.icon;
        const I = FEATURE_ICON[f.icon];
        return (
          <li key={f.t} className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2.5", on && (dark ? "bg-canvas/[0.08]" : "bg-raised shadow-[0_1px_2px_rgb(var(--bd-shade)/0.08),0_0_0_1px_rgb(var(--bd-ink)/0.05)]"))}>
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px]", on ? (dark ? "bg-canvas text-fg" : "bg-fg text-canvas") : dark ? "bg-canvas/[0.08] text-canvas" : "bg-fg/[0.05] text-fg")}>
              <I size={16} weight="duotone" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-ui font-medium">{f.t}</span>
              <span className={cn("block text-meta", dark ? "text-canvas/60" : "text-muted")}>{f.b}</span>
            </span>
            <CheckIcon size={14} weight="duotone" className={cn("shrink-0", dark ? "text-canvas/50" : "text-fg/40")} />
          </li>
        );
      })}
    </ul>
  );
}

/** The price and what it includes, then what to do about it at full width, ruled off from the rest of the card. */
export function PriceFoot({ price, period, note, noteIcon, dark, children, className }: { price: string; period?: string; note: string; noteIcon: Icon; dark?: boolean; children: ReactNode; className?: string }) {
  const muted = dark ? "text-canvas/60" : "text-muted";
  return (
    <div className={cn("border-t px-6 pb-5 pt-4", dark ? "border-canvas/10" : "border-line", className)}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-title tabular-nums">{price}</span>
        {period && <span className={cn("text-ui", muted)}>{period}</span>}
      </div>
      <Note icon={noteIcon} className={cn("mt-0.5 text-meta", muted)}>
        {note}
      </Note>
      {/* Full width under the price, shared evenly when there's more than one. A wide card, when the plans stack, keeps it button sized. */}
      <div className="mt-4 flex gap-2 @xl:max-w-[300px] [&>*]:flex-1">{children}</div>
    </div>
  );
}

/** The quiet strip along the bottom of a card: an icon, then the small print. */
const NOTE = "flex w-full items-start justify-center gap-1.5 border-t px-4 py-3 text-center text-meta";
export const CARD_NOTE = `${NOTE} border-line text-muted`;
export const CARD_NOTE_DARK = `${NOTE} border-canvas/10 text-canvas/60`;

export function CardNote({ icon, dark, className, children }: { icon: Icon; dark?: boolean; className?: string; children: ReactNode }) {
  return (
    <p className={cn(dark ? CARD_NOTE_DARK : CARD_NOTE, className)}>
      <NoteIcon icon={icon} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
