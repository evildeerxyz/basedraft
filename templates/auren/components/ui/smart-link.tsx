"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import type { ComponentProps, MouseEvent } from "react";

/**
 * next/link that smooth-scrolls when the target is a section on the current
 * page, and does a normal route change otherwise.
 */
export function SmartLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const lenis = useLenis();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || typeof href !== "string" || e.metaKey || e.ctrlKey) return;
    const [path, hash] = href.split("#");
    if (hash === undefined || (path !== "" && path !== pathname)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.2 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return <Link href={href} onClick={handle} {...props} />;
}
