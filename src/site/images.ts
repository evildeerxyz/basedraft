/*
 * Images you put in place of a template's own. Each one stands in for one of the template's files
 * (its path, as the template's code asks for it: /people/priya-raman.jpg), wherever the template
 * uses it, and is drawn the way the template draws that file: a portrait printed in its dither
 * stays a dithered portrait. The image itself is kept in basedraft's storage; in the code you
 * download, it's that file, in the template's public folder.
 */

export interface ImageSwap {
  /** Where the image is kept (basedraft's storage). */
  url: string;
  /** The file it came from, for showing. */
  name?: string;
}
export type Images = Record<string, ImageSwap>;

/** A template file that can be swapped: a picture, by a plain path. */
export const IMAGE_PATH = /^\/[\w.-]+(?:\/[\w.-]+)*\.(?:jpe?g|png|webp|avif|gif)$/i;

/** Only basedraft's own storage: the server reads these back to write them into downloads. */
const STORED = /^https:\/\/[a-z0-9-]+\.convex\.cloud\/api\/storage\/[0-9a-f-]{20,}$/i;

/** Images checked for the server: real template paths, kept in basedraft's storage. */
export function checkedImages(x: unknown): Images | undefined {
  if (!x || typeof x !== "object") return undefined;
  const out: Images = {};
  for (const [path, v] of Object.entries(x as Record<string, unknown>).slice(0, 200)) {
    const s = v as ImageSwap;
    if (!IMAGE_PATH.test(path) || !s || typeof s.url !== "string" || !STORED.test(s.url)) continue;
    out[path] = { url: s.url, ...(typeof s.name === "string" ? { name: s.name.slice(0, 120) } : {}) };
  }
  return Object.keys(out).length ? out : undefined;
}

/** What the page needs: each path, and the address of the image in its place. */
export const swapsOf = (images?: Images): Record<string, string> => Object.fromEntries(Object.entries(images ?? {}).map(([k, v]) => [k, v.url]));

/** The kind of file a path is, so an image put in its place is saved as the same kind. */
export function typeOf(path: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
}
