import type { ComponentProps, ReactNode } from "react";

/*
 * A text field as a pill pressed into the page: a soft well while it waits, lifting to a white
 * face with an ink edge when you type in it. Something can lead it (an icon) or trail it (a
 * suffix, a hint), and they stay quiet beside the text.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type InputProps = ComponentProps<"input"> & { leading?: ReactNode; trailing?: ReactNode };

export function Input({ leading, trailing, className, type = "text", ...props }: InputProps) {
  return (
    <span
      className={cx(
        "flex h-11 w-full items-center gap-2.5 rounded-full bg-[var(--bd-surface-2)] px-4 text-sm text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
        "hover:bg-[color-mix(in_oklab,var(--bd-surface-2)_60%,var(--bd-surface))] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
        "has-[[aria-invalid=true]]:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)] has-[:disabled]:opacity-50",
        className,
      )}
    >
      {leading && <span className="flex shrink-0 text-[var(--bd-subtle)] [&_svg]:size-4">{leading}</span>}
      <input type={type} className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)] disabled:cursor-not-allowed" {...props} />
      {trailing && <span className="flex shrink-0 items-center text-[13px] text-[var(--bd-subtle)] [&_svg]:size-4">{trailing}</span>}
    </span>
  );
}
