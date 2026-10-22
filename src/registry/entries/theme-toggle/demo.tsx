"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { ThemeSwitcher, ThemeToggle, useSystemTheme, type Theme, type ThemeChoice } from "../../ui/theme-toggle";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * A small page with a theme of its own, so the demos switch it and not the whole site. In your
 * app, onChange sets the class on <html> instead.
 */
function Page({ theme, corner, children }: { theme: Theme; corner?: ReactNode; children?: ReactNode }) {
  return (
    <div data-theme={theme === "dark" ? "dark" : undefined} className={cx(theme === "light" && "bd-light", "w-full max-w-[340px] overflow-hidden rounded-[18px] bg-[var(--bd-bg)] text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]")}>
      <div className="flex h-12 items-center justify-between border-b border-[var(--bd-line-subtle)] pl-4 pr-1.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="size-3.5 rounded-[4px] [background:var(--bd-ui-ink)]" />
          Zuno
        </span>
        {corner}
      </div>
      <div className="grid gap-2.5 px-4 pb-5 pt-4">
        <p className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">Money that manages itself.</p>
        <span className="h-2 w-[86%] rounded-full bg-[var(--bd-ui-track)]" />
        <span className="h-2 w-[62%] rounded-full bg-[var(--bd-ui-track)]" />
        {children}
      </div>
    </div>
  );
}

export function Demo() {
  const [choice, setChoice] = useState<ThemeChoice>("light");
  const system = useSystemTheme();
  const theme = choice === "system" ? system : choice;
  return (
    <div className="grid w-full justify-items-center gap-4">
      <Page theme={theme} corner={<ThemeToggle value={theme} onChange={setChoice} className="size-9" />} />
      <ThemeSwitcher value={choice} onChange={setChoice} labels />
    </div>
  );
}

function Toggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  return <Page theme={theme} corner={<ThemeToggle value={theme} onChange={setTheme} className="size-9" />} />;
}

function Switcher() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const system = useSystemTheme();
  return (
    <Page theme={choice === "system" ? system : choice}>
      <div className="pt-2">
        <ThemeSwitcher value={choice} onChange={setChoice} labels />
      </div>
    </Page>
  );
}

function Icons() {
  const [choice, setChoice] = useState<ThemeChoice>("light");
  const system = useSystemTheme();
  return <Page theme={choice === "system" ? system : choice} corner={<ThemeSwitcher value={choice} onChange={setChoice} />} />;
}

function Fade() {
  const [theme, setTheme] = useState<Theme>("light");
  return <Page theme={theme} corner={<ThemeToggle value={theme} onChange={setTheme} reveal={false} className="size-9" />} />;
}

export const examples: Record<string, ComponentType> = { toggle: Toggle, switcher: Switcher, icons: Icons, fade: Fade };
