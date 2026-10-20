import type { Brand, Email } from "./templates";

/*
 * Sending through Resend, from the site's server. Needs RESEND_API_KEY; EMAIL_FROM is the sender
 * (a verified domain's address), EMAIL_REPLY_TO where replies go. The images always come from the
 * live site (EMAIL_ASSETS_URL to change it): a mail app can't load them from localhost.
 */

export const brand = (): Brand => ({ assets: process.env.EMAIL_ASSETS_URL ?? "https://basedraft.site", site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://basedraft.site" });

export async function sendEmail(to: string, email: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't set up yet: add RESEND_API_KEY to the site's settings.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "basedraft <hello@basedraft.site>",
      reply_to: process.env.EMAIL_REPLY_TO ?? "hello@basedraft.site",
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend didn't send it: ${body.message ?? res.status}`);
  }
  return ((await res.json()) as { id: string }).id;
}
