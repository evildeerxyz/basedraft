import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ThemeToggle, type Theme } from "@basedraft/ui";

export function ThemeButton() {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <ThemeToggle
      value={theme}
      onChange={(next) => {
        setTheme(next);
        // Change the page here, inside the transition, so the circle reveals it.
        document.documentElement.classList.toggle("dark", next === "dark");
      }}
    />
  );
}`,
  use: [
    "For the one control that switches a site or an app between light and dark.",
    "When the switch should feel like a moment: the new theme opens out in a circle from the button.",
    "With ThemeSwitcher, when people should also be able to follow their system's setting.",
  ],
  avoid: [
    "For choosing between other options: use Segmented control.",
    "For a setting in a settings page among others: use Switch or Radio group, and call switchTheme yourself if you want the reveal.",
  ],
  parts: [
    {
      name: "ThemeToggle",
      note: "A round button: its sun turns into a moon. It doesn't apply or remember the theme; your onChange does.",
      props: [
        { name: "value", type: '"light" | "dark"', note: "The theme showing now.", required: true },
        { name: "onChange", type: '(theme: "light" | "dark") => void', note: "Called inside the view transition with the other theme. Change the page here, synchronously.", required: true },
        { name: "reveal", type: "boolean", default: "true", note: "Open the new theme in a circle from the button. Off, it cross-fades." },
        { name: "label", type: "string", default: '"Dark mode"', note: "Its name; it's a toggle button pressed while dark." },
        { name: "className", type: "string", note: "Added to the button, to size it." },
      ],
    },
    {
      name: "ThemeSwitcher",
      note: "Light, dark or the system's, on a track with a sliding thumb.",
      props: [
        { name: "value", type: '"light" | "dark" | "system"', note: "The choice now.", required: true },
        { name: "onChange", type: '(choice: "light" | "dark" | "system") => void', note: "Called inside the view transition. Resolve system with useSystemTheme.", required: true },
        { name: "labels", type: "boolean", default: "false", note: "Show the words beside the icons; without them each is a named icon." },
        { name: "reveal", type: "boolean", default: "true", note: "Open the new theme in a circle from the choice." },
        { name: "className", type: "string", note: "Added to the track." },
      ],
    },
    {
      name: "switchTheme",
      note: "The transition on its own, for any control of yours.",
      props: [
        { name: "apply", type: "() => void", note: "Changes the page synchronously, like setting a class on <html>.", required: true },
        { name: "from", type: "{ x: number; y: number }", note: "Where the circle opens from, in window pixels. Leave it out for a cross-fade." },
      ],
    },
    {
      name: "useSystemTheme",
      note: 'A hook: "light" or "dark", as the system prefers right now, following it as it changes. Light on the server.',
      props: [],
    },
  ],
  examples: [
    {
      id: "toggle",
      title: "The toggle",
      note: "Press it and watch the circle open from the button; the sun folds its rays and a bite slides in to make the moon.",
      code: `const [theme, setTheme] = useState<Theme>("dark");

<ThemeToggle value={theme} onChange={setTheme} className="size-9" />`,
    },
    {
      id: "switcher",
      title: "Light, dark or system",
      note: "System follows the operating system as it changes; useSystemTheme reads it.",
      code: `const [choice, setChoice] = useState<ThemeChoice>("system");
const system = useSystemTheme();
const theme = choice === "system" ? system : choice;

<ThemeSwitcher value={choice} onChange={setChoice} labels />`,
    },
    {
      id: "icons",
      title: "Icons only",
      note: "Compact for a header: each choice is a named icon.",
      code: `<ThemeSwitcher value={choice} onChange={setChoice} />`,
    },
    {
      id: "fade",
      title: "A cross-fade instead",
      note: "reveal={false} keeps the view transition but drops the circle.",
      code: `<ThemeToggle value={theme} onChange={setTheme} reveal={false} />`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "On the toggle, switches to the other theme." },
    { keys: "← / →", does: "In the switcher, moves to the previous or next choice and picks it." },
    { keys: "Tab", does: "Moves to the switcher's current choice, and on out of it." },
  ],
  a11y: [
    'The toggle is a button named "Dark mode" with aria-pressed, so it reads as pressed while the page is dark.',
    'The switcher is a radiogroup named "Theme"; each choice is a radio named Light, Dark or System, with only the current one in the tab order.',
    "With reduced motion, or in a browser without view transitions, the theme changes at once with no animation.",
    "The icons are drawn as one SVG that's hidden from screen readers; the names carry the meaning.",
  ],
};
