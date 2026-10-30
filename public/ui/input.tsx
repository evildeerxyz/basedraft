import type { ComponentProps, ReactNode } from "react";

/*
 * A text field as a pill pressed into the page: a soft well while it waits, lifting to a white
 * face with an ink edge when you type in it. Something can lead it (an icon, or words like
 * relay.app/ set right against what's typed) or trail it (a suffix, a hint), and they stay quiet
 * beside the text. Small, it sits in a dense row beside a small Select or Button.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = { sm: "h-9 gap-2 px-3.5 text-[13px]", md: "h-11 gap-2.5 px-4 text-sm" } as const;

export type InputProps = Omit<ComponentProps<"input">, "size"> & { leading?: ReactNode; trailing?: ReactNode; size?: keyof typeof SIZES };

export function Input({ leading, trailing, size = "md", className, type = "text", ...props }: InputProps) {
  return (
    <span
      className={cx(
        "flex w-full items-center rounded-full bg-[var(--bd-ui-field)] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
        "hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
        "has-[[aria-invalid=true]]:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)] has-[:disabled]:opacity-50",
        SIZES[size],
        className,
      )}
    >
      {/* Words that lead it read as part of the address, so they sit right against the text. */}
      {leading && <span className={cx("flex shrink-0 text-[var(--bd-subtle)] [&_svg]:size-4", typeof leading === "string" && (size === "sm" ? "-me-[7px]" : "-me-[9px]"))}>{leading}</span>}
      <input type={type} className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)] disabled:cursor-not-allowed" {...props} />
      {trailing && <span className="flex shrink-0 items-center text-[13px] text-[var(--bd-subtle)] [&_svg]:size-4">{trailing}</span>}
    </span>
  );
}
