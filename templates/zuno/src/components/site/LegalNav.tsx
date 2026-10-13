"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL } from "@/lib/site";
import { cn } from "@/lib/utils";

export function LegalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Legal documents" className="lg:sticky lg:top-28 lg:self-start">
      <div className="mb-3 px-3 text-[16px] font-medium text-white/60">Legal</div>
      <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
        {LEGAL.map((l) => {
          const on = path === l.href;
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={cn("block rounded-[12px] px-3 py-2.5 text-[17px] transition-colors", on ? "bg-white/[0.07] text-white" : "text-white/70 hover:text-white")}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
