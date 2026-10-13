"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { setImages } from "./images";

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
      setImages(e.data.images);
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
