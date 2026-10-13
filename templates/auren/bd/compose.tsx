"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Section } from "./sections";

/*
 * Studio's canvas: the sections a page is made of, in order. It starts from ?s=hero:a,pricing:b
 * and swaps to whatever list Studio posts next, so a change lands without reloading the frame.
 * Each entry is a section id and an instance key, so one section can appear twice. Studio's
 * colors arrive the same way.
 */
export function Compose() {
  const search = useSearchParams();
  const [keys, setKeys] = useState<string[]>(() => (search.get("s") ?? "").split(",").filter(Boolean));
  // Colors from Studio. Shaders and canvases read the colors when they're made, so a new palette
  // draws every section again, after its CSS is in place.
  const [colors, setColors] = useState(0);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      if (e.data?.type === "bd:sections") setKeys(e.data.keys);
      if (e.data?.type === "bd:theme") {
        let el = document.getElementById("bd-theme");
        if (!el) {
          el = document.createElement("style");
          el.id = "bd-theme";
        }
        document.head.appendChild(el);
        el.textContent = String(e.data.css ?? "");
        releaseGl();
        setColors((n) => n + 1);
      }
    };
    window.addEventListener("message", on);
    window.parent.postMessage({ type: "bd:ready" }, location.origin);
    return () => window.removeEventListener("message", on);
  }, []);

  // Tells Studio the page has re-rendered, so it can measure the sections again.
  useEffect(() => {
    window.parent.postMessage({ type: "bd:rendered", keys }, location.origin);
  }, [keys, colors]);

  return (
    <>
      {keys.map((key) => (
        <Section key={`${key}|${colors}`} id={key.split(":")[0]} instance={key} />
      ))}
    </>
  );
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
