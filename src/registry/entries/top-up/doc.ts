import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { TopUp } from "@/components/basedraft/top-up";

export function AddCredits({ balance }: { balance: number }) {
  return (
    <TopUp
      title="Add credits"
      balance={balance}
      pace={{ perDay: 9.6, from: "2026-11-12" }}
      methods={[
        { id: "visa", brand: "Visa", last4: "4242", expires: "08/28" },
        { id: "amex", brand: "Amex", last4: "1005", expires: "02/27" },
      ]}
      autoReload={{ amount: 100, below: 20 }}
      receipt="billing@acme.com"
      onConfirm={async ({ amount, method }) => {
        const res = await fetch("/api/credits", { method: "POST", body: JSON.stringify({ amount, method }) });
        if (!res.ok) throw new Error("Your card was declined. Try another.");
      }}
    />
  );
}`,
  use: [
    "For putting money on a balance that's spent down: prepaid credits, a wallet, an ad budget.",
    "Give it pace, what's spent in a day, and the amount reads as time: \"Lasts until about Jan 11\".",
    "Mark the amounts people usually pick with presets: they're inked on the tape.",
    "Throw from onConfirm with a message people can act on; it shows over the button and what they chose stays.",
    "In a dialog or sheet, pass plain: it drops its card and padding and takes the dialog's own.",
  ],
  avoid: ["For choosing a plan: use Pricing table.", "For a checkout with items and shipping: build it from Field and Input."],
  props: [
    { name: "balance", type: "number", note: "What's there now. Once it's paid, the before and after are counted from the balance it was paid at.", required: true },
    { name: "pace", type: "{ perDay: number; from: string }", note: "What's spent in a day, from which day: says how long the balance lasts, now and with the amount." },
    { name: "presets", type: "number[]", default: "[25, 50, 100, 250]", note: "Suggested amounts, inked on the tape." },
    { name: "defaultAmount", type: "number", note: "The amount it opens with; the third preset by default." },
    { name: "step, min, max", type: "number", default: "5, 5, 1000", note: "The tape's step, and what's allowed at a time." },
    { name: "fee", type: "(amount: number) => number", default: "2.9% + $0.30", note: "What paying costs on top." },
    { name: "feeLabel", type: "string", default: "\"card fee\"", note: "What that cost is called, in the sentence." },
    { name: "rate", type: "{ per: number; unit: string }", note: "What a dollar buys, said under the amount when there's no pace." },
    { name: "methods", type: "TopUpMethod[]", note: "Cards or accounts to pay from: id, brand, last4, expires. The picked one is a picker in the sentence." },
    { name: "defaultMethod", type: "string", note: "The one picked to start; the first by default." },
    { name: "autoReload", type: "{ amount: number; below: number }", note: "Offer a top-up that runs by itself." },
    { name: "confirm", type: "\"hold\" | \"press\"", default: "\"hold\"", note: "Pay on a hold, so money never leaves on a slip, or on a press." },
    { name: "receipt", type: "string", note: "Where the receipt goes, said once it's paid." },
    { name: "onConfirm", type: "(result: TopUpResult) => Promise<void> | void", note: "Pays: amount, fee, total, method and autoReload. Throw to say it didn't." },
    { name: "onDone", type: "() => void", note: "The Done button; without it, Done starts over." },
    { name: "onAddMethod", type: "() => void", note: "Offers Add a card under the cards." },
    { name: "plain", type: "boolean", default: "false", note: "Without its card or padding, for a dialog or sheet." },
    { name: "title, currency", type: "string", default: "\"Add funds\", \"USD\"", note: "Its heading, and the money it's in." },
  ],
  examples: [
    { id: "declined", title: "When a card is declined", note: "The message shows over the button; the amount and card stay as they were.", code: `<TopUp\n  balance={18.4}\n  methods={methods}\n  confirm="press"\n  onConfirm={async () => {\n    throw new Error("Your card was declined. Try another card.");\n  }}\n/>` },
  ],
  keyboard: [
    { keys: "Arrow keys", does: "On the tape, a step up or down; with Shift, five." },
    { keys: "Home / End", does: "On the tape, the smallest or largest amount." },
    { keys: "Space / Enter (held)", does: "On the button, holds to pay; letting go early stops it." },
    { keys: "Tab", does: "Through the amount, the tape, the card, the switch and the button." },
  ],
  a11y: [
    "The amount is a labeled field, and its hint (how long it lasts, or why it can't be paid) is read with it and announced as it changes.",
    "The tape is a slider read as money; the cards are a listbox.",
    "The button says what holding does; while it pays it's marked busy, and a failure is announced as an alert.",
    "Holding can be hard for some people: pass confirm=\"press\" where that matters more than a slip.",
  ],
};
