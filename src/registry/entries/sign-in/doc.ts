import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { SignIn } from "@/components/basedraft/sign-in";

export function SignInPage() {
  return (
    <SignIn
      title="Sign in to Acme"
      providers={["google", "github"]}
      method="code"
      onProvider={(p) => signIn(p)}
      onEmail={(email) => sendCode(email)}
      onCode={async (email, code) => {
        const ok = await verify(email, code);
        if (!ok) throw new Error("That code isn't right.");
        router.push("/app");
      }}
      signUpHref="/sign-up"
    />
  );
}`,
  use: [
    "For the sign-in page of an app: providers first, then an email for everyone else.",
    "method=\"code\" for sign-in without a password; method=\"password\" for the classic way, with a link to reset it.",
    "Throw an Error from a handler to show its message under the step; it shakes, and the field is marked.",
    "layout=\"split\" on a wide page, with a quote from someone who uses it.",
  ],
  avoid: [
    "For a long sign-up with a profile to fill: use Wizard after the account is made.",
    "In a small popover: sign-in deserves its own page or a Dialog.",
  ],
  parts: [
    {
      name: "SignIn",
      note: "The card: title, providers, the email, then the password or the code, then signed in.",
      props: [
        { name: "title", type: "string", default: '"Sign in"', note: "Over everything: Sign in to Acme." },
        { name: "description", type: "ReactNode", note: "A line under the title." },
        { name: "logo", type: "ReactNode", note: "Your mark, over the title." },
        { name: "providers", type: '("google" | "github" | "apple")[]', default: '["google", "github"]', note: "The providers to offer, in order. An empty list leaves the email alone." },
        { name: "lastUsed", type: '"google" | "github" | "apple" | "email"', note: "How they signed in last time, tagged Last used. Keep it in a cookie." },
        { name: "method", type: '"password" | "code"', default: '"password"', note: "What comes after the email." },
        { name: "onProvider", type: "(provider) => void | Promise<void>", note: "Signs in with a provider: usually a redirect. Shows a spinner while it runs." },
        { name: "onEmail", type: "(email) => void | Promise<void>", note: "Runs on Continue: check the account, or send the code." },
        { name: "onPassword", type: "(email, password) => void | Promise<void>", note: "Checks the password." },
        { name: "onCode", type: "(email, code) => void | Promise<void>", note: "Checks the code. It runs as soon as six digits are in." },
        { name: "onResend", type: "(email) => void | Promise<void>", note: "Sends the code again; the link waits 30 seconds between." },
        { name: "forgotHref", type: "string", note: "Where Forgot password? goes." },
        { name: "signUpHref", type: "string", note: "Where Create an account goes." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, like Next.js's Link." },
        { name: "footer", type: "ReactNode", note: "Small print under it: the terms, the privacy policy." },
        { name: "layout", type: '"card" | "split"', default: '"card"', note: "A card alone, or beside a panel of art. The panel shows from 720px wide." },
        { name: "quote", type: "{ text: string; name: string; role?: string }", note: "A quote on the panel." },
        { name: "dither", type: "boolean", default: "true", note: "The panel's glow in rings of dots; false paints it smooth." },
        { name: "className", type: "string", note: "Added to the outer box." },
      ],
    },
  ],
  examples: [
    {
      id: "password",
      title: "With a password",
      note: "Three providers, the email tagged Last used, and a password with a show button and a link to reset it. A password under eight characters shows the error.",
      code: `<SignIn
  title="Welcome back"
  providers={["google", "apple", "github"]}
  lastUsed="email"
  method="password"
  onPassword={check}
  forgotHref="/forgot"
/>`,
    },
    {
      id: "split",
      title: "Beside art",
      note: "layout=\"split\" sets the card beside a glow with a quote over it. Switch the glow between dither and smooth with dither.",
      code: `<SignIn
  layout="split"
  dither
  method="code"
  quote={{ text: "We moved the whole team over in an afternoon.", name: "Priya Raman", role: "Head of engineering" }}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves through the providers, the email, Continue and the links." },
    { keys: "Enter", does: "Continues from the email, or signs in from the password." },
    { keys: "0–9", does: "Fill the code; it moves on by itself, and Backspace goes back." },
  ],
  a11y: [
    "Each field has a label, and an error is announced and tied to the field it's about.",
    "The code is one real input with one-time-code autocomplete, so a phone can fill it from a message.",
    "The new step's field takes focus as it slides in, and Use another email takes you back to yours.",
    "The art beside it is hidden from screen readers; the quote is read as a quote.",
  ],
};
