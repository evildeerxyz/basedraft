/*
 * basedraft's emails. Each template gives a subject, the HTML and a plain text copy. Email clients
 * are old browsers, so the HTML is tables and inline styles, system fonts, and two small images
 * (the mark and the dithered band) served from the site's public/email. With images off, the card
 * still reads: the band is decoration and the mark has the name beside it.
 *
 * Pure functions, so the development preview draws them too (/dev/email).
 */

import { ASSETS } from "./assets";

export interface Email {
  subject: string;
  html: string;
  text: string;
}

/** Where the images live and where links go. */
export interface Brand {
  /** The address that serves /email/<name>.png: the live site, which mail apps can always reach. */
  assets: string;
  /** The site, for links: http://localhost:3400 in dev. */
  site: string;
}

const INK = "#141414";
const MUTED = "#5e5e5e";
const SUBTLE = "#8c8c8c";
const LINE = "#e5e5e5";
const WELL = "#f5f5f5";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** An image's address, which changes whenever the image does. */
const img = (brand: Brand, name: string) => `${brand.assets}${ASSETS[name].path}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The card every email sits in: the band, the mark and name, the body, then the footer. */
function layout(brand: Brand, { preview, body }: { preview: string; body: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>basedraft</title>
<style>
  body { margin: 0; padding: 0; }
  a { color: ${INK}; }
  @media (prefers-color-scheme: dark) {
    .bd-page { background: #0b0b0b !important; }
    .bd-card { background: #161616 !important; border-color: #262626 !important; }
    .bd-ink { color: #ededed !important; }
    .bd-muted { color: #a3a3a3 !important; }
    .bd-well { background: #0f0f0f !important; border-color: #262626 !important; }
    .bd-button { background: #ededed !important; color: #0f0f0f !important; }
    .bd-rule { border-color: #262626 !important; }
    .bd-light-only { display: none !important; }
    .bd-dark-only { display: block !important; max-height: none !important; }
  }
  @media (max-width: 520px) {
    .bd-pad { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body class="bd-page" style="margin:0;padding:0;background:${WELL};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preview)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" class="bd-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WELL};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" class="bd-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;">
        <tr>
          <td style="line-height:0;font-size:0;border-radius:12px 12px 0 0;overflow:hidden;">
            <img src="${img(brand, "sky")}" width="480" height="28" alt="" style="display:block;width:100%;max-width:480px;height:28px;border:0;">
          </td>
        </tr>
        <tr>
          <td class="bd-pad" style="padding:4px 40px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img class="bd-light-only" src="${img(brand, "mark")}" width="32" height="32" alt="" style="display:block;border:0;">
                  <!--[if !mso]><!--><img class="bd-dark-only" src="${img(brand, "mark-light")}" width="32" height="32" alt="" style="display:none;border:0;max-height:0;overflow:hidden;"><!--<![endif]-->
                </td>
                <td class="bd-ink" style="vertical-align:middle;padding-left:10px;font-family:${FONT};font-size:18px;font-weight:600;letter-spacing:-0.02em;color:${INK};">basedraft</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="bd-pad" style="padding:28px 40px 36px;font-family:${FONT};">
${body}
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td class="bd-muted" style="padding:20px 8px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${SUBTLE};text-align:center;">
            basedraft. Finished websites you make your own.<br>
            <a href="${brand.site}" class="bd-muted" style="color:${SUBTLE};text-decoration:underline;">${esc(brand.site.replace(/^https?:\/\//, ""))}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const h1 = (t: string) => `<h1 class="bd-ink" style="margin:0;font-size:24px;line-height:30px;font-weight:600;letter-spacing:-0.02em;color:${INK};">${t}</h1>`;
const p = (t: string, extra = "") => `<p class="bd-muted" style="margin:12px 0 0;font-size:15px;line-height:24px;color:${MUTED};${extra}">${t}</p>`;
const note = (t: string) => `<p class="bd-muted bd-rule" style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${LINE};font-size:13px;line-height:20px;color:${SUBTLE};">${t}</p>`;

/** The 6-digit code that signs you in, or makes your account the first time. */
export function signInCode(brand: Brand, { code, minutes = 10 }: { code: string; minutes?: number }): Email {
  const digits = code.split("").map(esc).join("");
  return {
    subject: `${code} is your basedraft code`,
    html: layout(brand, {
      preview: `Your code is ${code}. It works for ${minutes} minutes.`,
      body: `${h1("Your sign-in code")}
${p(`Enter it in basedraft to sign in. It works for ${minutes} minutes, and only once.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
  <tr>
    <td class="bd-well bd-ink" align="center" style="padding:20px 12px;background:${WELL};border:1px solid ${LINE};border-radius:8px;font-family:'SF Mono', ui-monospace, Menlo, Consolas, monospace;font-size:34px;line-height:40px;font-weight:600;letter-spacing:10px;color:${INK};">${digits}</td>
  </tr>
</table>
${note("Didn't ask for this? You can ignore it: someone may have typed your address by mistake, and nothing happens without the code.")}`,
    }),
    text: `Your basedraft sign-in code: ${code}

Enter it in basedraft to sign in. It works for ${minutes} minutes, and only once.

Didn't ask for this? You can ignore it: nothing happens without the code.

basedraft. ${brand.site}`,
  };
}

/** Sent once, when an account is made. */
export function welcome(brand: Brand, { name }: { name?: string | null }): Email {
  const first = name?.trim().split(/\s+/)[0];
  const studio = `${brand.site}/studio`;
  const steps: Array<[string, string]> = [
    ["Start from a template", "Three finished sites, every page included."],
    ["Make it yours", "Rewrite its words and rearrange its sections, right on the page."],
    ["Take it anywhere", "Paste it into Figma, download the code, or send it to GitHub."],
  ];
  return {
    subject: "Welcome to basedraft",
    html: layout(brand, {
      preview: "Your account is ready. Your drafts now save to it, on every device.",
      body: `${h1(first ? `Welcome, ${esc(first)}` : "Welcome to basedraft")}
${p("Your account is ready. Your drafts, versions and Library save to it now, on every device you sign in on.")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
${steps
  .map(
    ([t, b], i) => `  <tr>
    <td width="32" valign="top" style="padding:${i ? "14px" : "0"} 0 0;">
      <div class="bd-button" style="width:22px;height:22px;border-radius:11px;background:${INK};color:#ffffff;font-size:12px;line-height:22px;font-weight:600;text-align:center;">${i + 1}</div>
    </td>
    <td valign="top" style="padding:${i ? "14px" : "0"} 0 0;">
      <div class="bd-ink" style="font-size:15px;line-height:22px;font-weight:600;color:${INK};">${t}</div>
      <div class="bd-muted" style="font-size:14px;line-height:21px;color:${MUTED};">${b}</div>
    </td>
  </tr>`,
  )
  .join("\n")}
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
  <tr>
    <td class="bd-button" style="border-radius:7px;background:${INK};">
      <a href="${studio}" class="bd-button" style="display:inline-block;padding:11px 18px;font-size:14px;line-height:18px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:7px;">Open Studio</a>
    </td>
  </tr>
</table>
${note("You're getting this because you just made a basedraft account. Questions? Reply to this email.")}`,
    }),
    text: `${first ? `Welcome, ${first}` : "Welcome to basedraft"}

Your account is ready. Your drafts, versions and Library save to it now, on every device you sign in on.

${steps.map(([t, b], i) => `${i + 1}. ${t}: ${b}`).join("\n")}

Open Studio: ${studio}

basedraft. ${brand.site}`,
  };
}
