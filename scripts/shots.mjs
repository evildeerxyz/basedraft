/*
 * Regenerates basedraft's screenshots from the live templates:
 *   public/shots/<slug>.jpg                 each template's home page, first screen
 *   public/shots/sections/<slug>-<id>.jpg   every section on its own, in a 16:10 card
 *   public/shots/studio-stage.jpg           Studio on the home page, light and dark
 * Run against a running basedraft and its zones:
 *   npm run build && npm start      (in one terminal)
 *   npm run shots                   (in another; add "studio", "sections" or "templates" for just one set)
 * Uses your installed Chrome. Set CHROME_PATH if it lives elsewhere.
 */
import { mkdir, readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3400";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ONLY = ["studio", "sections", "templates"].find((s) => process.argv.includes(s));
const run = (set) => !ONLY || ONLY === set;

const MANIFESTS = { zuno: "templates/zuno/src/bd/manifest.json", noma: "templates/noma/src/bd/manifest.json", auren: "templates/auren/bd/manifest.json" };
const templates = await Promise.all(Object.entries(MANIFESTS).map(async ([slug, path]) => ({ slug, ...JSON.parse(await readFile(path, "utf8")) })));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * Waits the way Copy for Figma does (src/site/live-export.ts): until the page's scripts have run
 * and it has stopped changing, ignoring anything that changes all the time (a ticker, a live
 * number). Then any entrance that never played (faded out, held back, slid out of a clipped
 * line) is shown at rest, so a thumbnail never catches a section half drawn.
 */
const settle = (page) =>
  page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let calm = 0, end = Date.now() + 6000; calm < 2 && Date.now() < end; ) {
      const left = await new Promise((r) => requestIdleCallback((d) => r(d.timeRemaining()), { timeout: 400 }));
      calm = left >= 40 ? calm + 1 : 0;
    }
    const quiet = async () => {
      const seen = new Map();
      const mo = new MutationObserver((list) => {
        const now = Date.now();
        for (const m of list) seen.set(m.target, { first: seen.get(m.target)?.first ?? now, last: now });
      });
      mo.observe(document.body, { attributes: true, childList: true, characterData: true, subtree: true });
      const start = Date.now();
      while (Date.now() - start < 8000) {
        await sleep(150);
        const now = Date.now();
        const changing = [...seen.values()].some((s) => now - s.last < 450 && now - s.first < 4000);
        const running = document.getAnimations().some((a) => a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity));
        if (!changing && !running && now - start > 1200) break;
      }
      mo.disconnect();
    };
    // Some entrances start late, and a chart drawn in WebGL changes nothing a page can watch:
    // settle, give it a moment more, and settle again.
    await quiet();
    await sleep(2500);
    await quiet();
    for (const el of document.querySelectorAll("[style]")) {
      const st = el.style;
      let rest = st.opacity === "0" || st.visibility === "hidden";
      if (!rest && /translate/.test(st.transform)) {
        let c = el.parentElement;
        for (let i = 0; c && i < 3 && getComputedStyle(c).overflow === "visible"; i++) c = c.parentElement;
        if (c) {
          const a = el.getBoundingClientRect();
          const b = c.getBoundingClientRect();
          const shown = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          rest = shown < a.width * a.height * 0.5;
        }
      }
      if (!rest) continue;
      if (st.opacity === "0") st.opacity = "1";
      if (st.visibility === "hidden") st.visibility = "visible";
      st.transform = "none";
    }
    await sleep(300);
  });
await mkdir("public/shots/sections", { recursive: true });
// Software WebGL, so the templates' shaders and 3D scenes draw in a headless browser.
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"] });
const page = await browser.newPage();

/* ---------- each template's first screen ---------- */

if (run("templates")) {
  await page.setViewport({ width: 1440, height: 990, deviceScaleFactor: 1 });
  for (const t of templates) {
    await page.goto(`${BASE}/live/${t.slug}`, { waitUntil: "networkidle0", timeout: 90000 });
    // Long enough for intros and entrances to finish.
    await wait(1500);
    await settle(page);
    await page.screenshot({ path: `public/shots/${t.slug}.jpg`, type: "jpeg", quality: 84 });
    console.log(t.slug);
  }
}

/* ---------- every section, framed ---------- */

/*
 * Each section is drawn on its own page at 1440 wide. Up to one screen of it (900px) goes into a
 * 1600 × 1000 card, centered on the section's own background color, so short ones (a nav bar,
 * a ticker) and tall ones read at the same scale.
 */
const CARD = { w: 1600, h: 1000 };
if (run("sections")) {
  // Composed here rather than in a second tab: a tab in the background stops its animations,
  // and the next section would be caught half drawn.
  const rgb = (c) => (c.match(/[\d.]+/g) ?? ["255", "255", "255"]).slice(0, 3).map(Number);
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  // A cold first load can draw before fonts and layout settle; warm the browser up once.
  await page.goto(`${BASE}/live/${templates[0].slug}/bd/section/${templates[0].sections[0].id}`, { waitUntil: "networkidle0", timeout: 90000 });
  await wait(1500);
  for (const t of templates) {
    for (const s of t.sections) {
      await page.goto(`${BASE}/live/${t.slug}/bd/section/${s.id}`, { waitUntil: "networkidle0", timeout: 90000 });
      // Long enough for entrances, counters and shaders to land.
      await settle(page);
      const measure = () => page.evaluate(() => {
        const wrap = document.querySelector("[data-bd-section]");
        const kids = wrap ? [...wrap.children] : [];
        const rs = kids.map((k) => k.getBoundingClientRect()).filter((r) => r.height);
        if (!rs.length) return null;
        const top = Math.max(0, Math.min(...rs.map((r) => r.top)));
        const bottom = Math.max(...rs.map((r) => r.bottom));
        // The color behind it: the first ancestor or child with a solid background.
        const solid = (el) => {
          for (let n = el; n; n = n.parentElement) {
            const c = getComputedStyle(n).backgroundColor;
            if (c && !/rgba\(.+, 0\)|transparent/.test(c)) return c;
          }
          return null;
        };
        const bg = solid(kids[0]) ?? getComputedStyle(document.body).backgroundColor ?? "#fff";
        return { top, height: Math.min(900, Math.ceil(bottom - top)), bg };
      });
      let box = await measure();
      // A first load can catch a section mid-entrance; give it a moment more.
      if (!box || box.height <= 0) {
        await wait(2500);
        box = await measure();
      }
      if (!box || box.height <= 0) {
        console.log(`${t.slug}/${s.id}: nothing drawn`);
        continue;
      }
      const shot = await page.screenshot({ clip: { x: 0, y: box.top, width: 1440, height: box.height } });
      const [r, g, b] = rgb(box.bg);
      await sharp({ create: { width: CARD.w, height: CARD.h, channels: 3, background: { r, g, b } } })
        .composite([{ input: shot, left: Math.round((CARD.w - 1440) / 2), top: Math.round((CARD.h - box.height) / 2) }])
        .jpeg({ quality: 84 })
        .toFile(`public/shots/sections/${t.slug}-${s.id}.jpg`);
      console.log(`${t.slug}/${s.id}`, box.height);
    }
  }
}

/* ---------- Studio, for the home page ---------- */

/*
 * Studio at 1440 × 900, shot at 2x, once in each color mode.
 * The home page shows it in a window on a dithered stage (src/site/studio-stage.tsx).
 */
if (run("studio")) {
  await page.evaluateOnNewDocument(() => {
    localStorage.removeItem("bd-studio-page");
    localStorage.removeItem("bd-studio-project");
    // Studio as someone who's been here before: no first-run tour, no hints.
    localStorage.setItem("bd-studio-guide", JSON.stringify({ toured: true, hints: false }));
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  // Studio as it opens: the hero selected, its layers on the left and its words in the inspector.
  const STEPS = {
    // The live balance in Zuno's hero rolls its digits every few seconds, on springs run in script:
    // shoot when no digit column has moved for a few frames.
    stage: async () => {
      const columns = () =>
        page.evaluate(() => {
          const d = document.querySelector('iframe[title="Your page, Desktop"]')?.contentDocument;
          return [...(d?.querySelectorAll("span.absolute.flex-col") ?? [])].map((el) => el.style.transform).join("|");
        });
      // Right after a roll ends is the longest stretch before the next one: wait for one to start, then to stop.
      let last = await columns();
      for (let i = 0; i < 200; i++) {
        await wait(40);
        const now = await columns();
        if (now !== last) break;
        last = now;
      }
      for (let still = 0, i = 0; still < 5 && i < 200; i++) {
        await wait(40);
        const now = await columns();
        still = now === last ? still + 1 : 0;
        last = now;
      }
    },
  };

  // Once per color mode, so the tour shows Studio as you're seeing the site.
  for (const mode of ["light", "dark"]) {
    const { identifier } = await page.evaluateOnNewDocument((m) => localStorage.setItem("bd-theme", m), mode);
    for (const [name, act] of Object.entries(STEPS)) {
      await page.goto(`${BASE}/studio?template=zuno`, { waitUntil: "networkidle0", timeout: 90000 });
      await wait(6000);
      await act();
      // A dev server's own badge isn't part of Studio.
      await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove()));
      const file = `public/shots/studio-${name}${mode === "dark" ? "-dark" : ""}.jpg`;
      await page.screenshot({ path: file, type: "jpeg", quality: 82 });
      console.log(file);
    }
    await page.removeScriptToEvaluateOnNewDocument(identifier);
  }
}

await browser.close();
