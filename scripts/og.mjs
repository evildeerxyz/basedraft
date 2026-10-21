/*
 * The share cards: each page's 1200 by 630 picture for links in chats and on social sites, drawn
 * at /dev/og (src/app/dev/og/page.tsx) while the app runs, and saved as public/og/<key>.jpg for
 * src/site/og.ts to point at. Shot at twice the size and scaled down, so the type is crisp.
 *   npm run dev, then: node scripts/og.mjs
 * Uses your installed Chrome. Set CHROME_PATH if it lives elsewhere.
 */
import { mkdir, readdir, rm } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3400";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "public/og";

await mkdir(OUT, { recursive: true });
// Cards for pages that are gone (or templates that aren't out) shouldn't linger.
for (const f of await readdir(OUT)) if (f.endsWith(".jpg")) await rm(`${OUT}/${f}`);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 2 });
await page.goto(`${BASE}/dev/og`, { waitUntil: "networkidle0", timeout: 180000 });
await page.evaluate(() => document.fonts.ready);
// The cards' motion settles, and every picture on them has loaded.
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => i.addEventListener("load", r, { once: true }))))));
await new Promise((r) => setTimeout(r, 1500));

const cards = await page.$$("[data-og]");
for (const card of cards) {
  const key = await card.evaluate((el) => el.getAttribute("data-og"));
  await card.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 250));
  const png = await card.screenshot({ type: "png" });
  await sharp(png).resize(1200, 630).jpeg({ quality: 88, mozjpeg: true }).toFile(`${OUT}/${key}.jpg`);
  console.log(`${OUT}/${key}.jpg`);
}
await browser.close();
console.log(`${cards.length} share cards`);
