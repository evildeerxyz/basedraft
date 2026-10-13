export const INSTALL_COMMAND = "brew install --cask auren";
export const VERSION = "2.0.3";

export const THEMES = [
  { id: "aurum", label: "Aurum", swatch: "#f2a23a" },
  { id: "aurora", label: "Aurora", swatch: "#7ddba4" },
  { id: "ember", label: "Ember", swatch: "#ff6b3d" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_EVENT = "auren:theme";
export const PALETTE_EVENT = "auren:palette";
export const TOAST_EVENT = "auren:toast";

export function setTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem("auren-theme", id);
  } catch {}
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
