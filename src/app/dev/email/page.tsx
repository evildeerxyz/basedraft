import { notFound } from "next/navigation";
import { projectShared, purchaseReady, signInCode, teamInvite, welcome } from "@/server/emails/templates";

/*
 * basedraft's emails, as they render, in light and dark: a page for working on them. They're sent
 * from the site's server (src/server/emails); this only draws them, with the images from public/. Development only.
 */
export default function EmailPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const brand = { assets: "", site: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3400" };
  const emails = [
    { name: "Sign-in code", email: signInCode(brand, { code: "482916" }) },
    { name: "Welcome", email: welcome(brand, { name: "Riley Parker" }) },
    { name: "Template bought", email: purchaseReady(brand, { product: "zuno", name: "Zuno", template: true, order: "pay_EXAMPLE", amount: 79, currency: "usd" }) },
    { name: "Pro bought", email: purchaseReady(brand, { product: "pro", name: "basedraft Pro", template: false, order: "pay_EXAMPLE", amount: 149, currency: "usd" }) },
    { name: "Team invite", email: teamInvite(brand, { team: "Parker Studio", inviter: "Riley Parker", inviterEmail: "riley@example.com", token: "example" }) },
    { name: "Draft shared", email: projectShared(brand, { project: "Spring launch", inviter: "Riley Parker", role: "edit", id: "example" }) },
  ];
  return (
    <main className="min-h-dvh bg-surface-2 p-8">
      <h1 className="text-title">Emails</h1>
      <p className="mt-2 text-body text-muted">Sent through Resend from the site&apos;s server. Light on the left, dark on the right, as mail apps that support it show them.</p>
      <div className="mt-8 space-y-12">
        {emails.map(({ name, email }) => (
          <section key={name}>
            <h2 className="text-heading">{name}</h2>
            <p className="mt-1 text-ui text-muted">Subject: {email.subject}</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {(["light", "dark"] as const).map((scheme) => (
                <iframe key={scheme} title={`${name}, ${scheme}`} srcDoc={email.html} className="h-[720px] w-full rounded-[8px] border-0 bg-white shadow-[0_0_0_1px_var(--bd-line)]" style={{ colorScheme: scheme }} />
              ))}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-ui text-muted">Plain text</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-[8px] bg-surface p-4 font-mono text-[12.5px] shadow-[0_0_0_1px_var(--bd-line)]">{email.text}</pre>
            </details>
          </section>
        ))}
      </div>
    </main>
  );
}
