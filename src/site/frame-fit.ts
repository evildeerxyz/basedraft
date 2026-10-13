/*
 * Showing a whole page in one frame, top to bottom, the way Framer and Figma show it. A frame as
 * tall as the page would also stretch everything sized to the window (a 100vh hero would become
 * the page's height), so first find exactly those elements, by growing the window a little and
 * seeing what grows with it, and pin them at their normal height. Then the frame can take the
 * page's full height and the layout stays as it is in a browser window.
 *
 * Resizing a same-origin frame and reading its layout happens in one go, so this never flickers.
 */

const sizes = (els: HTMLElement[]) => els.map((el) => [el.offsetHeight, parseFloat(getComputedStyle(el).minHeight) || 0] as const);

/** Pins everything that follows the window's height, as measured with the window `viewport` px tall. */
export function pinViewportHeights(iframe: HTMLIFrameElement, viewport: number) {
  const doc = iframe.contentDocument;
  if (!doc?.body) return;
  const was = iframe.style.height;
  const resize = (h: number) => {
    iframe.style.height = `${h}px`;
    // Lays out the frame at its new size, and the page inside it with it.
    void iframe.offsetHeight;
  };
  resize(viewport);
  const els = [...doc.body.querySelectorAll<HTMLElement>("*")].filter((el) => !el.dataset.bdPinned);
  const before = sizes(els);
  resize(viewport + 40);
  const after = sizes(els);
  resize(viewport);
  els.forEach((el, i) => {
    const [h0, m0] = before[i];
    const [h1, m1] = after[i];
    if (m1 - m0 > 20) el.style.minHeight = `${m0}px`;
    // Grew with the window, not with its content: hold the height it has in a real window.
    else if (h1 - h0 > 20) el.style.height = `${h0}px`;
    else return;
    el.dataset.bdPinned = "1";
  });
  iframe.style.height = was;
}

/** The page's full height once pinned. */
export const pageHeight = (doc: Document) => Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
