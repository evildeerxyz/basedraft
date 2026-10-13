"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/site";
import { SmartLink } from "../ui/smart-link";

/** "On this page" list that follows the reader's position. */
export function Toc({ items, title = "On this page" }: { items: Array<{ id: string; text: string }>; title?: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label={title}>
      <div className="type-label text-ink/45">{title}</div>
      <ul className="mt-4 space-y-1 border-l border-ink/12">
        {items.map((item) => (
          <li key={item.id}>
            <SmartLink
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l py-1 pl-4 text-[13.5px] transition-colors",
                active === item.id ? "border-accent text-ink" : "border-transparent text-ink/50 hover:text-ink",
              )}
            >
              {item.text}
            </SmartLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
