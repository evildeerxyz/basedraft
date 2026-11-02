import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ScoreMeter } from "@/components/basedraft/score-meter";

export function FitScore({ account }: { account: Account }) {
  return <ScoreMeter label="Fit score" value={account.fit} show="word" />;
}`,
  use: [
    "For a score people compare down a column: account fit, lead quality, health, risk.",
    "Set bands to where fair and strong start for your score, and words to what you call them.",
    "Use sm in a dense table, md in a list, lg at the head of a page about one thing.",
  ],
  avoid: ["For how much of a limit is used: use Allowance.", "For progress toward done: use Meter or Stepper."],
  props: [
    { name: "value", type: "number", note: "The score, from 0 to max.", required: true },
    { name: "max", type: "number", default: "100", note: "What a full meter is." },
    { name: "segments", type: "number", default: "10", note: "How many capsules it's made of." },
    { name: "bands", type: "[number, number]", default: "[40, 70]", note: "Where fair starts and where strong starts." },
    { name: "words", type: "[string, string, string]", default: "[\"Low\", \"Fair\", \"Strong\"]", note: "What each band is called, low to strong." },
    { name: "show", type: "\"value\" | \"word\" | \"none\"", default: "\"value\"", note: "Beside the capsules: the number, the number with its band's word, or nothing." },
    { name: "label", type: "string", default: "\"Score\"", note: "What's scored, for screen readers." },
    { name: "size", type: "\"sm\" | \"md\" | \"lg\"", default: "\"md\"", note: "How tall the capsules are." },
  ],
  examples: [
    { id: "bands", title: "Low, fair and strong", note: "The whole meter takes its band's tone, so a column of them sorts itself by eye.", code: `<ScoreMeter value={24} show="word" />\n<ScoreMeter value={58} show="word" />\n<ScoreMeter value={86} show="word" />` },
    { id: "sizes", title: "Sizes", code: `<ScoreMeter size="sm" value={72} />\n<ScoreMeter size="md" value={72} />\n<ScoreMeter size="lg" value={72} show="word" />` },
  ],
  keyboard: [{ keys: "None", does: "It shows a figure; it isn't a control." }],
  a11y: ["A meter, read as the score out of max and its band's word: \"72 of 100, strong\".", "The band comes as a word as well as a tone, never color alone."],
};
