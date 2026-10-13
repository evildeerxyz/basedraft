"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

/*
 * basedraft's wiring for the template's own pages, when they're drawn inside basedraft (Studio's
 * canvas and preview, and copies to Figma): Studio's colors go on as CSS, then the page is drawn
 * again with them, so its shaders, canvases and charts take them too. On its own, outside a
 * basedraft frame, it does nothing. basedraft takes it out of the code it hands over.
 */
export function BdFrame({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState(0);
  useEffect(() => {
    // Studio's own pages (a page made of sections, a section on its own) handle colors themselves.
    if (window.parent === window || location.pathname.includes("/bd/")) return;
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== "bd:theme") return;
      let el = document.getElementById("bd-theme");
      if (!el) {
        el = document.createElement("style");
        el.id = "bd-theme";
      }
      document.head.appendChild(el);
      el.textContent = String(e.data.css ?? "");
      releaseGl();
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

/**
 * The page is about to be drawn again, so its WebGL contexts are released first. Shaders open a
 * new one when they're made, and the browser only allows a handful at once: left for the garbage
 * collector, a few color changes would use them up and new shaders would draw blank.
 */
function releaseGl() {
  for (const c of document.querySelectorAll("canvas")) {
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
