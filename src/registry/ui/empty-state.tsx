import type { ComponentProps, ReactNode } from "react";

/*
 * What a list or a page says while it has nothing in it yet. Above the words, a small fan of ghost
 * cards hints at what will be here: the one in front carries the icon, the two behind are blank,
 * and pointing at it fans them a little further apart, as if the first one is about to arrive.
 * Then a title, a line on what will be here and how to get it, and the action that starts it. On
 * paper it sits on a field of fine dots that fades out from the middle; plain, it's just the
 * content, for a card that already has a face.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = {
  sm: { box: "px-5 py-8", art: "h-[68px] w-[150px] scale-[0.82]", title: "mt-3 text-sm", line: "text-[13px]" },
  md: { box: "px-6 py-12", art: "h-[84px] w-[190px]", title: "mt-5 text-[15.5px]", line: "text-[13.5px]" },
} as const;

/* One ghost card: a face, a few quiet lines, and a dot where a picture or an avatar would go. */
const GHOST = "absolute left-1/2 top-1 h-[70px] w-[112px] rounded-[14px] bg-[var(--bd-ui-field)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),0_1px_2px_rgb(var(--bd-shade)/0.06),0_10px_24px_-14px_rgb(var(--bd-shade)/0.4)]";
/* How the cards move: a short spring-like ease with the smallest overshoot, and none with reduced motion. */
const MOVE = "transition-transform duration-500 ease-[cubic-bezier(0.34,1.36,0.64,1)] motion-reduce:transition-none";

function Lines({ wide }: { wide?: boolean }) {
  return (
    <span className="absolute inset-x-3 top-3 grid gap-1.5">
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 shrink-0 rounded-full bg-[var(--bd-ui-track)]" />
        <span className={cx("h-1.5 rounded-full bg-[var(--bd-ui-track)]", wide ? "w-12" : "w-9")} />
      </span>
      <span className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--bd-ui-track)_70%,var(--bd-ui-field))]" />
      <span className="h-1.5 w-2/3 rounded-full bg-[color-mix(in_oklab,var(--bd-ui-track)_70%,var(--bd-ui-field))]" />
    </span>
  );
}

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  /** An icon for what will be here: a draft, a file, a person. It rides the front card of the fan. */
  icon?: ReactNode;
  title: ReactNode;
  /** What will be here, and how it gets here. */
  description?: ReactNode;
  /** The button or link that starts it. */
  action?: ReactNode;
  /** On paper, on a field of fine dots; plain, for inside a card. */
  variant?: "paper" | "plain";
  size?: keyof typeof SIZES;
  /** The title's element, to fit the page's headings. */
  titleAs?: "h2" | "h3" | "h4" | "p";
};

export function EmptyState({ icon, title, description, action, variant = "paper", size = "md", titleAs: Title = "h3", className, ...props }: EmptyStateProps) {
  const s = SIZES[size];
  return (
    <div className={cx("group/empty relative isolate flex flex-col items-center text-center", s.box, variant === "paper" && "overflow-hidden rounded-[22px] bg-[var(--bd-paper)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]", className)} {...props}>
      {variant === "paper" && <span aria-hidden className="absolute inset-0 -z-10 [background:var(--bd-ui-dots)] [mask-image:radial-gradient(closest-side,#000,transparent)]" />}
      {icon && (
        <span aria-hidden className={cx("relative block origin-top", s.art)}>
          {/* The two behind, leaning out to either side; further when it's pointed at. */}
          <span className={cx(GHOST, MOVE, "-translate-x-[86%] translate-y-2 -rotate-[9deg] opacity-80 group-hover/empty:-translate-x-[96%] group-hover/empty:translate-y-2.5 group-hover/empty:-rotate-[13deg]")}>
            <Lines />
          </span>
          <span className={cx(GHOST, MOVE, "-translate-x-[14%] translate-y-2 rotate-[9deg] opacity-80 group-hover/empty:-translate-x-[4%] group-hover/empty:translate-y-2.5 group-hover/empty:rotate-[13deg]")}>
            <Lines wide />
          </span>
          {/* The one in front, holding the icon, rising a little. */}
          <span className={cx(GHOST, MOVE, "-translate-x-1/2 group-hover/empty:-translate-y-1")}>
            <span className="absolute inset-x-3 bottom-3 grid gap-1.5">
              <span className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--bd-ui-track)_70%,var(--bd-ui-field))]" />
              <span className="h-1.5 w-1/2 rounded-full bg-[color-mix(in_oklab,var(--bd-ui-track)_70%,var(--bd-ui-field))]" />
            </span>
            <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-[10px] text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.25),0_6px_14px_-6px_rgb(var(--bd-shade)/0.5)] [background:var(--bd-ui-ink)] [&_svg]:size-[17px]">{icon}</span>
          </span>
        </span>
      )}
      <Title className={cx("font-semibold tracking-[-0.012em] text-[var(--bd-fg)]", s.title)}>{title}</Title>
      {description && <p className={cx("mt-1.5 max-w-[38ch] text-pretty leading-[1.55] text-[var(--bd-muted)]", s.line)}>{description}</p>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
