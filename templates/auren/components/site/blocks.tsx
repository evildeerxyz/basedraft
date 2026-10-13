import { Fragment } from "react";
import { InfoIcon, LightbulbIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import type { Block } from "@/lib/content/types";
import { cn } from "@/lib/site";
import { SmartLink } from "../ui/smart-link";
import { CodeBlock } from "./code-block";

/** Inline formatting: `code`, **bold** and [links](/path). */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} className="rounded-[4px] bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.86em] text-ink">
              {part.slice(1, -1)}
            </code>
          );
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link)
          return (
            <SmartLink
              key={i}
              href={link[2]}
              className="text-ink underline decoration-ink/25 underline-offset-[3px] transition-colors hover:decoration-ink"
            >
              {link[1]}
            </SmartLink>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const CALLOUT = {
  note: { icon: InfoIcon, label: "Note" },
  tip: { icon: LightbulbIcon, label: "Tip" },
  warn: { icon: WarningIcon, label: "Careful" },
};

export function Blocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("space-y-6 text-[16.5px] leading-[1.7] text-ink/75", className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={b.id} className="type-title scroll-mt-28 pt-6 text-[clamp(1.5rem,2.4vw,1.9rem)] text-ink">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="type-title pt-2 text-[1.25rem] text-ink">
                {b.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3.5">
                    <span className="mt-[0.68em] size-1.5 shrink-0 bg-accent" />
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3.5">
                    <span className="mt-[0.2em] w-5 shrink-0 font-mono text-[13px] text-ink/45">{j + 1}.</span>
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return <CodeBlock key={i} code={b.code} title={b.title} />;
          case "callout": {
            const { icon: Icon, label } = CALLOUT[b.tone ?? "note"];
            return (
              <div key={i} className="flex gap-3.5 rounded-[8px] border border-ink/12 bg-paper-2 p-4 text-[15px] leading-relaxed">
                <Icon size={18} className="mt-0.5 shrink-0 text-ink" />
                <p>
                  <span className="font-semibold text-ink">{label}. </span>
                  <Inline text={b.text} />
                </p>
              </div>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-accent py-1 pl-5">
                <p className="type-title text-[clamp(1.35rem,2.2vw,1.7rem)] leading-snug text-ink">“{b.text}”</p>
                {b.cite && <footer className="mt-2 font-mono text-[12px] text-ink/50">{b.cite}</footer>}
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-t border-ink/12 text-left text-[14.5px]">
                  <thead>
                    <tr className="border-b border-ink/12">
                      {b.head.map((h) => (
                        <th key={h} className="type-label py-3 pr-4 font-normal text-ink/50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className="border-b border-ink/12">
                        {row.map((cell, c) => (
                          <td key={c} className={cn("py-3 pr-4", c === 0 ? "text-ink" : "text-ink/65")}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
