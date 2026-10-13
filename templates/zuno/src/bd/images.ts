/*
 * basedraft's wiring for images, when the template is drawn inside basedraft: an image you put in
 * place of one of the template's files is loaded wherever the template's own code asks for that
 * file, so it's drawn exactly the way the template draws it (cropped, dithered, lit). Each canvas
 * that draws a file is marked with it, so Studio can list it as a layer. On its own, outside a
 * basedraft frame, it does nothing. basedraft takes it out of the code it hands over.
 */

/** A file of the template's (its path, as the code asks for it: /people/ava.jpg) and the image in its place. */
let swaps: Record<string, string> = {};
/** The file each image element was asked to load, before any swap. */
const asked = new WeakMap<object, string>();

const inFrame = typeof window !== "undefined" && window.parent !== window;
/** The page's own setAttribute, from before it's wrapped below. */
const setAttribute = inFrame ? Element.prototype.setAttribute : null;

/** A source as the template's path for it: same origin, without the address the template is served under. */
function pathOf(src: string) {
  try {
    const u = new URL(src, location.href);
    if (u.origin !== location.origin) return null;
    const base = location.pathname.match(/^\/live\/[^/]+/)?.[0] ?? "";
    return base && u.pathname.startsWith(`${base}/`) ? u.pathname.slice(base.length) : u.pathname;
  } catch {
    return null;
  }
}

function swap(img: HTMLImageElement, value: string) {
  const path = pathOf(value);
  if (!path) return value;
  asked.set(img, path);
  // Marked with its file, so Studio knows it as that file's image whatever it shows.
  setAttribute?.call(img, "data-bd-src", path);
  const to = swaps[path];
  // Drawn into a canvas and read back (a dither): an image from elsewhere has to ask to be read.
  if (to && !/^(data|blob):/.test(to)) img.crossOrigin = "anonymous";
  return to ?? value;
}

if (inFrame) {
  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src")!;
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true,
    enumerable: src.enumerable,
    get: src.get,
    set(this: HTMLImageElement, v: string) {
      src.set!.call(this, swap(this, String(v)));
    },
  });
  const set = setAttribute!;
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    return set.call(this, name, this instanceof HTMLImageElement && name.toLowerCase() === "src" ? swap(this, String(value)) : value);
  };
  // A canvas that draws a file says which.
  const mark = (canvas: unknown, source: unknown) => {
    const path = source instanceof HTMLImageElement ? (asked.get(source) ?? pathOf(source.src)) : null;
    if (path && canvas instanceof HTMLCanvasElement && canvas.getAttribute("data-bd-src") !== path) set.call(canvas, "data-bd-src", path);
  };
  const draw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (this: CanvasRenderingContext2D, ...args: Parameters<typeof draw>) {
    mark(this.canvas, args[0]);
    return draw.apply(this, args);
  } as typeof draw;
  for (const Gl of [WebGLRenderingContext, typeof WebGL2RenderingContext === "undefined" ? null : WebGL2RenderingContext]) {
    if (!Gl) continue;
    const tex = Gl.prototype.texImage2D as (...a: unknown[]) => void;
    Gl.prototype.texImage2D = function (this: WebGLRenderingContext, ...args: unknown[]) {
      mark(this.canvas, args.find((a) => a instanceof HTMLImageElement));
      return tex.apply(this, args);
    } as typeof Gl.prototype.texImage2D;
  }
}

/** Studio's images, with its colors: the page is drawn again after, so every image is asked for again. */
export function setImages(next: unknown) {
  if (!next || typeof next !== "object") return;
  swaps = Object.fromEntries(Object.entries(next as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string"));
}
