import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GLYPH_PATH } from "./dither";
import { ditherPaths, type ArtVariant } from "./dither-art";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const INK = "#0a0a09";
const PAPER = "#efebe2";
const FOG = "#a7a297";
const MUTE = "#6c6862";
const ACCENT = "#f2a23a";

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
// loaded once per build worker and shared by every image
const fonts = Promise.all([
  font("MonaSans-SemiExpanded-SemiBold.woff"),
  font("MonaSans-Regular.woff"),
  font("GeistMono-Medium.woff"),
]);

export type OgCard = {
  /** Small mono line above the title, e.g. "Docs / Agents". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  art?: { variant: ArtVariant; seed: number };
};

/** The shared 1200×630 social card: copy on the left, dithered art bleeding in from the right. */
export async function ogImage({ eyebrow, title, subtitle, art = { variant: "sun", seed: 3 } }: OgCard) {
  const [display, text, mono] = await fonts;
  const cols = 110;
  const rows = 105;
  const { mid, hi } = ditherPaths(art.variant, art.seed, cols, rows, 0.5);
  const titleSize = title.length > 44 ? 54 : title.length > 30 ? 64 : 76;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: INK, position: "relative" }}>
        <svg
          width={660}
          height={630}
          viewBox={`0 0 ${cols} ${rows}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", right: 0, top: 0 }}
        >
          <path d={mid} fill={ACCENT} />
          <path d={hi} fill={PAPER} />
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width={38} height={38} viewBox="0 -0.5 11 11">
              <path d={GLYPH_PATH} fill={ACCENT} />
            </svg>
            <span style={{ fontFamily: "Mona Display", fontSize: 34, color: PAPER, letterSpacing: "-0.02em" }}>Auren</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: "Geist Mono",
                fontSize: 20,
                color: FOG,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ width: 10, height: 10, background: ACCENT }} />
              {eyebrow}
            </div>
            <div
              style={{
                marginTop: 26,
                fontFamily: "Mona Display",
                fontSize: titleSize,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                color: PAPER,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ marginTop: 26, fontFamily: "Mona", fontSize: 25, lineHeight: 1.4, color: FOG, maxWidth: 540 }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 18, color: MUTE, letterSpacing: "0.04em" }}>
            Auren 2.0 · the native AI code editor
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Mona Display", data: display, weight: 600, style: "normal" },
        { name: "Mona", data: text, weight: 400, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
