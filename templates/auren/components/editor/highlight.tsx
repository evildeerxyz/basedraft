import { Fragment } from "react";

/** A deliberately small TypeScript tokenizer, enough for the demo code. */
const RULES: Array<[RegExp, string]> = [
  [/^\/\/.*/, "text-[#6b665d] italic"],
  [/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`(?:[^`\\]|\\.)*`/, "text-[#b9c79b]"],
  [
    /^(?:import|from|export|const|let|async|await|return|if|new|function|type|true|false|null|undefined)\b/,
    "text-[#968f83]",
  ],
  [/^\d+(?:\.\d+)?/, "text-[#e0a970]"],
  [/^[A-Za-z_$][\w$]*(?=\()/, "text-[#f4efe5]"],
  [/^[A-Z][\w$]*/, "text-[#e6c993]"],
  [/^[A-Za-z_$][\w$]*/, "text-[#cfc8bb]"],
  [/^\s+/, ""],
  [/^[^\sA-Za-z_$\d"'`]+/, "text-[#7e786e]"],
];

export function tokenize(line: string) {
  const out: Array<{ text: string; cls: string }> = [];
  let rest = line;
  while (rest) {
    let matched = false;
    for (const [re, cls] of RULES) {
      const m = re.exec(rest);
      if (m) {
        out.push({ text: m[0], cls });
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push({ text: rest[0], cls: "" });
      rest = rest.slice(1);
    }
  }
  return out;
}

export function Code({ line }: { line: string }) {
  return (
    <>
      {tokenize(line).map((tok, i) =>
        tok.cls ? (
          <span key={i} className={tok.cls}>
            {tok.text}
          </span>
        ) : (
          <Fragment key={i}>{tok.text}</Fragment>
        ),
      )}
    </>
  );
}
