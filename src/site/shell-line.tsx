import { cn } from "@/lib/utils";

/*
 * A command, colored the way an editor colors a shell line: the prompt quiet, the program in its
 * call color, subcommands as keys, flags and URLs as strings, and && as a keyword. Uses the
 * --code-* colors in globals.css, so it follows light and dark with every other code block.
 */
const PROGRAMS = new Set(["npm", "npx", "pnpm", "pnpx", "bun", "bunx", "yarn", "cd", "git", "claude", "curl", "unzip"]);

/** Each word of a command with its color, and the spaces between as they are. */
function colorize(command: string) {
  let first = true;
  return command.split(/(\s+)/).map((p) => {
    if (/^\s+$/.test(p)) return { p, color: null };
    let color = "var(--code-text)";
    if (p === "&&" || p === "|" || p === ";") {
      color = "var(--code-keyword)";
      first = true;
    } else if (first && PROGRAMS.has(p)) {
      color = "var(--code-call)";
      first = false;
    } else if (/^-{1,2}[\w-]/.test(p) || /^https?:\/\//.test(p) || /^["'@]/.test(p)) color = "var(--code-string)";
    else {
      color = "var(--code-key)";
      first = false;
    }
    return { p, color };
  });
}

export function ShellLine({ command, prompt = true, className }: { command: string; prompt?: boolean; className?: string }) {
  return (
    <code className={cn("font-mono text-[13px] text-[var(--code-text)]", className)}>
      {prompt && <span className="select-none text-[var(--code-comment)]">$ </span>}
      {colorize(command).map(({ p, color }, i) =>
        color ? (
          <span key={i} style={{ color }}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </code>
  );
}
