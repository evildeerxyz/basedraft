/*
 * Class strings the libraries' pages and their client pieces share. Plain values in a plain module,
 * so a server page gets the string itself rather than a reference to a client module.
 */

/** The width a library page's content keeps to. Plain strings here, so server pages and the client pieces share them. */
export const LIB_WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";

/** Frosted glass for what floats over the light: chips, the dock, small round buttons. */
export const GLASS = "bg-surface/80 shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line)] backdrop-blur-xl";

/** The way back to a list, as a soft pill: an arrow that steps back when pointed at, and the list's name. Every detail page has it the same. */
export const BACK = "group inline-flex h-9 w-fit items-center gap-2 rounded-full bg-fg/[0.05] pl-3 pr-4 text-[13px] font-medium text-fg transition-colors hover:bg-fg/[0.09]";
export const BACK_ARROW = "transition-transform duration-300 group-hover:-translate-x-0.5";
