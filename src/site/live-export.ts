import { toFigmaSvg, toFigmaTree, toPaperHtml, VIEWPORTS } from "./design-export";
import { readTiles } from "./figma-paint";
import { pageHeight, pinViewportHeights } from "./frame-fit";
import { applyEdits, type TextEdit } from "./text-edits";
import { applyTheme } from "./theme";

/*
 * Copying real template sections and pages to Figma and Paper. The templates lay out with media
 * queries, so a section can't just be cloned at another width: each width gets its own hidden
 * frame of the template's page, at that exact viewport, and the layers are read from there.
 */

export interface LiveCopy {
  /** A same-origin page that draws exactly what to copy: a section, a composed page or a real page. */
  url: string;
  /** Section id to layer name, so each section lands in Figma as its own named component. */
  names: Record<string, string>;
  /** Text changed in Studio, laid over the page before it's read. */
  edits?: TextEdit[];
  /** Where an edit's scope is drawn on this page, when it isn't the same key (a section on its own page). */
  remap?: Record<string, string>;
  /** The project's colors, as CSS laid over the template's (see site/theme). */
  theme?: string;
}

export type LiveView = { name: string; tree: ReturnType<typeof toFigmaTree> };
type Result = { svg: string; paper: string; views: LiveView[] };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * WebGL clears its pixels once they're on screen, so a 3D scene or shader reads back blank.
 * Asking every context in the frame to keep them lets the copy take the scene as drawn.
 */
function keepWebglPixels(win: Window | null) {
  const proto = (win as (Window & typeof globalThis) | null)?.HTMLCanvasElement?.prototype as (HTMLCanvasElement & { bdKeep?: boolean }) | undefined;
  if (!proto || proto.bdKeep) return;
  const get = proto.getContext;
  proto.getContext = function (this: HTMLCanvasElement, type: string, options?: Record<string, unknown>) {
    return get.call(this, type, /webgl/.test(type) ? { ...options, preserveDrawingBuffer: true } : options);
  } as typeof get;
  proto.bdKeep = true;
}

/**
 * Entrances, counters, charts drawing in: wait until the page stops changing, then hold every
 * animation still. Anything that has kept changing the whole time (a ticker, a marquee, a live
 * number) is how the page looks at rest, so it doesn't hold things up.
 */
export async function settle(doc: Document, max = 6000) {
  const win = doc.defaultView;
  if (!win || !doc.body) return;
  // A page draws its entrances once its scripts have run (hydration, WebGL set up). Until the
  // frame's main thread goes idle, a still page only means nothing has started yet.
  const ready = Date.now() + 5000;
  for (let calm = 0; calm < 2 && Date.now() < ready; ) {
    const left = await new Promise<number>((r) => (win.requestIdleCallback ? win.requestIdleCallback((d) => r(d.timeRemaining()), { timeout: 400 }) : win.setTimeout(() => r(50), 100)));
    calm = left >= 40 ? calm + 1 : 0;
  }
  const start = Date.now();
  const seen = new Map<Node, { first: number; last: number }>();
  const mo = new win.MutationObserver((list) => {
    const now = Date.now();
    for (const m of list) {
      const s = seen.get(m.target);
      if (s) s.last = now;
      else seen.set(m.target, { first: now, last: now });
    }
  });
  mo.observe(doc.body, { attributes: true, childList: true, characterData: true, subtree: true });
  try {
    while (Date.now() - start < max) {
      await wait(150);
      const now = Date.now();
      const changing = [...seen.values()].some((s) => now - s.last < 450 && now - s.first < 4000);
      const running = doc.getAnimations().some((a) => a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity));
      if (!changing && !running && now - start > 600) break;
    }
  } finally {
    mo.disconnect();
  }
  doc.getAnimations().forEach((a) => a.pause());
}

/**
 * A template page in a hidden frame at one width, full height, settled, with its sections marked.
 * `show` puts it on the page instead, at that left edge, for checking a copy against it.
 */
export async function openLive(url: string, width: number, names: Record<string, string>, show?: { left: number }, edits?: Pick<LiveCopy, "edits" | "remap" | "theme">) {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.tabIndex = -1;
  f.name = "bd-export";
  // On screen but invisible: animations that wait to scroll into view only run where the
  // browser can see them, so the frame sits in the window, scaled down to fit inside it.
  Object.assign(f.style, { position: "fixed", left: "0px", top: "0px", width: `${width}px`, height: "900px", border: "0", opacity: "0", pointerEvents: "none", zIndex: "-1", transformOrigin: "0 0" });
  if (show) Object.assign(f.style, { position: "absolute", left: `${show.left}px`, opacity: "1", zIndex: "0" });
  document.body.appendChild(f);
  // basedraft's wiring in the page says when it's listening (bd:ready); heard from the start, so
  // it can't be missed while the page loads.
  let hear: () => void = () => {};
  const listening = new Promise<void>((ok) => (hear = ok));
  const onReady = (e: MessageEvent) => e.source === f.contentWindow && e.data?.type === "bd:ready" && hear();
  window.addEventListener("message", onReady);
  try {
    keepWebglPixels(f.contentWindow);
    // The page's own window may replace the blank one; patch it the moment it appears.
    let loaded = false;
    void (async () => {
      while (!loaded) {
        keepWebglPixels(f.contentWindow);
        await wait(0);
      }
    })();
    await new Promise<void>((ok, fail) => {
      f.onload = () => ok();
      f.onerror = () => fail(new Error("The page didn't load"));
      f.src = url;
    }).finally(() => (loaded = true));
    const doc = f.contentDocument;
    if (!doc?.body) throw new Error("The page didn't load");
    if (edits?.theme) {
      // The colors first, before anything settles: as CSS, then the page drawn again with them, so
      // its shaders and canvases are in them too. The page says when it has (a template's own
      // page can't, and just gets the CSS). One settle afterwards covers both.
      applyTheme(doc, edits.theme);
      await Promise.race([listening, wait(1500)]);
      const win = f.contentWindow;
      const redrawn = new Promise<void>((ok) => {
        const on = (e: MessageEvent) => {
          if (e.source !== win || e.data?.type !== "bd:rendered") return;
          window.removeEventListener("message", on);
          ok();
        };
        window.addEventListener("message", on);
        setTimeout(() => {
          window.removeEventListener("message", on);
          ok();
        }, 2000);
      });
      win?.postMessage({ type: "bd:theme", css: edits.theme }, location.origin);
      await redrawn;
    }
    await doc.fonts?.ready;
    await wait(500);
    // A whole page in one frame, with anything sized to the window kept at a window's height.
    await pinViewportHeights(f, 900);
    const height = Math.min(30000, Math.max(900, pageHeight(doc)));
    f.style.height = `${height}px`;
    if (!show) f.style.transform = `scale(${Math.min(1, innerHeight / height, innerWidth / width)})`;
    await settle(doc);
    if (edits?.edits?.length) {
      applyEdits(doc, edits.edits, edits.remap ? (k) => edits.remap![k] ?? k : undefined);
      // Edited text can change a line's length, and with it the page's height.
      f.style.height = `${Math.min(30000, Math.max(900, pageHeight(doc)))}px`;
    }
    for (const wrap of doc.querySelectorAll<HTMLElement>("[data-bd-section]")) {
      const el = wrap.firstElementChild;
      const id = wrap.dataset.bdSection!;
      if (!el) continue;
      el.setAttribute("data-bd-block", id);
      el.setAttribute("data-bd-name", names[id] ?? id);
    }
    await readTiles(doc.body);
    return { doc, root: doc.body, done: () => f.remove() };
  } catch (e) {
    f.remove();
    throw e;
  } finally {
    window.removeEventListener("message", onReady);
  }
}

const cache = new Map<string, { at: number; result: Promise<Result> }>();

/**
 * Every width's layers for one page or section. A section's three widths load side by side;
 * a whole page's go one at a time, so its WebGL scenes never run the browser out of contexts.
 */
export async function readLive(copy: LiveCopy, name: string, which: number[] = VIEWPORTS.map((_, i) => i)): Promise<Result> {
  const read = async (i: number) => {
    const f = await openLive(copy.url, VIEWPORTS[i].width, copy.names, undefined, copy);
    try {
      const tree = toFigmaTree(f.root, name);
      return { tree, svg: i === which[0] ? toFigmaSvg(f.root, name) : "", paper: i === which[0] ? toPaperHtml(f.root, name) : "" };
    } finally {
      f.done();
    }
  };
  const out: Array<Awaited<ReturnType<typeof read>>> = [];
  if (copy.url.includes("/bd/section/")) out.push(...(await Promise.all(which.map((i) => read(i)))));
  else for (const i of which) out.push(await read(i));
  return { svg: out[0].svg, paper: out[0].paper, views: out.map((o, k) => ({ name: VIEWPORTS[which[k]].name, tree: o.tree })) };
}

/**
 * Everything a copy needs, for every width, made once and kept for a minute. Copy menus
 * call this as they open, so by the time you click, the layers are ready.
 */
export function prepareLive(copy: LiveCopy, name: string): Promise<Result> {
  const key = `${copy.url}|${name}|${JSON.stringify(copy.edits ?? [])}|${copy.theme ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.result;
  const result = readLive(copy, name);
  cache.set(key, { at: Date.now(), result });
  result.catch(() => cache.delete(key));
  return result;
}
