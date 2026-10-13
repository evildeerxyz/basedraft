import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  kind = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  kind?: "primary" | "secondary" | "text";
  className?: string;
}) {
  if (kind === "text") {
    return (
      <Link href={href} className={cn("group inline-flex items-center gap-1.5 text-[17px] text-white/75 transition-colors hover:text-white", className)}>
        {children}
        <ArrowUpRightIcon size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-14 items-center gap-2.5 rounded-[14px] px-6 text-[17px] font-medium transition-colors",
        kind === "primary" ? "bg-lime text-on-lime" : "border border-white/15 text-white hover:bg-white/[0.06]",
        className,
      )}
    >
      {children}
      <ArrowRightIcon size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
