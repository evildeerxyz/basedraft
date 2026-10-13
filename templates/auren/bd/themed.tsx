"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

/*
 * Studio's colors, for a section drawn on its own (what basedraft's copies to Figma and Paper
 * read). The colors go on as CSS, then the section is drawn again, so shaders and canvases,
 * which read colors when they're made, take them too. basedraft's wiring: not part of the
 * template's code.
 */
export function Themed({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState(0);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== "bd:theme") return;
      let el = document.getElementById("bd-theme");
      if (!el) {
        el = document.createElement("style");
        el.id = "bd-theme";
      }
      document.head.appendChild(el);
      el.textContent = String(e.data.css ?? "");
      setColors((n) => n + 1);
    };
    window.addEventListener("message", on);
    window.parent.postMessage({ type: "bd:ready" }, location.origin);
    return () => window.removeEventListener("message", on);
  }, []);
  useEffect(() => {
    if (colors) window.parent.postMessage({ type: "bd:rendered" }, location.origin);
  }, [colors]);
  return <Fragment key={colors}>{children}</Fragment>;
}
