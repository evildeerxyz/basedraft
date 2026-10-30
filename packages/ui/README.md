# @basedraft/ui

basedraft UI: React components with a material of their own. Ink, brushed metal, paper and glass, depth from light rather than borders, and motion that springs. 67 components, accessible, light and dark, with one stylesheet and nothing to configure.

Every component has a live page with its props and examples at [basedraft.site/components](https://basedraft.site/components).

## Install

```sh
npm install @basedraft/ui motion @phosphor-icons/react
```

React 19 is required. The package needs `@phosphor-icons/react`, `motion`, `react`, `react-dom` as peers; npm installs React for you if your project doesn't have it.

Import the stylesheet once, at the root of your app:

```tsx
import "@basedraft/ui/styles.css";
```

It holds everything the components need: the theme's tokens, their materials, and the styles they use. There's no Tailwind setup and no config file. It doesn't reset your page: it only reaches the components' own elements, and it sits in cascade layers, so any style of yours wins over it. The components take your page's font, so set the one you want on `body`.

## Use

```tsx
import { Button, Switch, Tooltip } from "@basedraft/ui";

export function Publish() {
  return (
    <div className="actions">
      <Switch defaultChecked aria-label="Save each change to GitHub" />
      <Tooltip content="Push to GitHub" keys={["⌘", "S"]}>
        <Button variant="metal">Publish</Button>
      </Tooltip>
    </div>
  );
}
```

Each component is also its own entry, if you'd rather import it that way: `import { Button } from "@basedraft/ui/button"`.

## Next.js

Works in the App Router as it is. Every component is a client component (each file starts with `"use client"`), so you can render them from server components and pages. Import the stylesheet in your root `app/layout.tsx`.

## Dark mode

The components follow a `dark` class or a `data-theme="dark"` attribute on any element above them, usually `<html>`. That covers next-themes and most theme switchers as they come. Put `light` (or `data-theme="light"`) on an element to keep what's inside it light.

## Theming

Colors, shadows and materials are CSS variables, all starting with `--bd-`. Set any of them after the stylesheet, on `:root` or on any element, and the components follow:

```css
:root {
  --bd-accent: oklch(52% 0.17 262);
  --bd-surface: #ffffff;
}
.dark {
  --bd-surface: #141414;
}
```

The full list, with their light and dark values, is at the top of `dist/theme.css`.

## With Tailwind v4

If your project runs Tailwind v4 and you'd rather it build the components' styles along with yours, import the theme alone and let Tailwind scan the package:

```css
@import "tailwindcss";
@import "@basedraft/ui/theme.css";
@source "../node_modules/@basedraft/ui/dist";
```

Point `@source` at the package from your CSS file's folder. Use either this or `styles.css`, not both.

## Components

### Actions

- [Button](https://basedraft.site/components/button): A pill in ink, metal, paper, glass, outline or ghost, with a field of dithered dots while it loads. `Button`
- [Hold button](https://basedraft.site/components/hold-button): Press and hold to confirm: a dial winds closed and the time left counts down as the button sinks under your finger, and letting go early unwinds it. `HoldButton`
- [Copy button](https://basedraft.site/components/copy-button): Copies a piece of text, its icon turning over into a check as a ring spreads from it. `CopyButton`
- [Command line](https://basedraft.site/components/command-line): A shell command on a small ink terminal, colored, with a copy button and a switch between package managers. `CommandLine`
- [Split button](https://basedraft.site/components/split-button): One action and its alternatives, the way a merge button works: pick another from the caret and it takes the pill's place, its name rolling in, ready for the next press. `SplitButton`
- [Toolbar](https://basedraft.site/components/toolbar): Tools on one white bar, with toggles, a group whose chip slides, a tooltip that glides from tool to tool, and a More menu when it runs out of room. `Toolbar`, `ToolbarButton`, `ToolbarToggle`, `ToolbarGroup`, `ToolbarSeparator`
- [Action bar](https://basedraft.site/components/action-bar): An ink bar that rises while things are selected, its count rolling, with what you can do to all of them and a way to let them go. `ActionBar`, `ActionBarButton`
- [Theme toggle](https://basedraft.site/components/theme-toggle): Light and dark, switched with a circle of the new theme opening from the button, a sun that turns into a moon, and a System choice. `ThemeToggle`, `ThemeSwitcher`

### Forms

- [Input](https://basedraft.site/components/input): A text field pressed into the page that lifts to a white face as you type, with room for an icon or a suffix. `Input`
- [Textarea](https://basedraft.site/components/textarea): A longer field that grows as you type, with a small ring that counts toward its limit. `Textarea`
- [Switch](https://basedraft.site/components/switch): A recessed track that fills with ink, and a bead for a knob that stretches while you press it. `Switch`
- [Segmented](https://basedraft.site/components/segmented): One choice of a few in a machined track, the chosen one on a raised thumb that slides. `Segmented`
- [Slider](https://basedraft.site/components/slider): A value along an ink track: a bead to drag, a bubble that says the value, and marked stops under it. `Slider`
- [Checkbox](https://basedraft.site/components/checkbox): A box pressed into the page that fills with ink as its tick draws in, with a half-on state and a row that carries a label and a line. `Checkbox`, `CheckboxRow`
- [Radio group](https://basedraft.site/components/radio-group): One choice from a short list, as rows with an ink dot and a bead, or as cards that take an ink edge. `RadioGroup`, `RadioGroupItem`
- [Select](https://basedraft.site/components/select): A pill that opens a card of choices in groups, ticked in ink, moved by the arrow keys and by typing a name. `Select`
- [Code input](https://basedraft.site/components/code-input): A one-time code a cell at a time: typing moves along, a paste or a phone's autofill fills them all, and a wrong code shakes. `CodeInput`
- [Field](https://basedraft.site/components/field): A label, a hint and an error around any control, wired for screen readers, with a count when there's a limit. `Field`
- [Password field](https://basedraft.site/components/password-field): A password that helps as you type: an eye to show it, a four-step meter with a word for how strong, rules that tick as they're met, and a word when Caps Lock is on. `PasswordField`
- [Chips](https://basedraft.site/components/chips): Filters as a row of chips that fill with ink as a check springs in, with counts, several or one at a time, a long tail folded into +N, and Clear once anything is on. `Chips`
- [Combobox](https://basedraft.site/components/combobox): A select you can type into: results filter and group as you go, the match drawn in bold, with chips for several and a row to create what's missing. `Combobox`
- [Edit in place](https://basedraft.site/components/inline-edit): Text that becomes a field where it stands, the same size and type, growing as you type, with saving, a check, and a shake when it is refused. `InlineEdit`
- [Tag input](https://basedraft.site/components/tag-input): A field that turns what you type into chips on Enter or a comma, splits a pasted list, and lets each chip be checked, edited in place or taken away. `TagInput`
- [Number field](https://basedraft.site/components/number-field): A pill with − and + that speed up as they're held, a label you drag sideways to scrub, and arrow keys with Shift for bigger steps. `NumberField`
- [Date picker](https://basedraft.site/components/date-picker): A field that opens a month whose pages slide the way you go, walked by the arrow keys, for one day or a range with a band that follows the pointer. `Calendar`, `DatePicker`
- [File drop](https://basedraft.site/components/file-drop): A zone that wakes when files are dragged over the page and lifts to meet them, listing each with its kind, its progress, and why it failed or was turned away. `FileDrop`
- [Time picker](https://basedraft.site/components/time-picker): A time typed the way you'd say it or picked from a list in steps, scrolled to the one you have, each time saying how long after the start it is. `TimePicker`

### Overlays

- [Dialog](https://basedraft.site/components/dialog): A white card lifted over a dimmed page, the hero's light at its head, that holds focus until its question is answered. `Dialog`, `DialogTrigger`, `DialogContent`, `DialogIcon`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- [Sheet](https://basedraft.site/components/sheet): A panel that floats in from an edge with the page still in view, and from the bottom, a phone's sheet with a grip to drag it away. `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter`, `SheetClose`
- [Popover](https://basedraft.site/components/popover): A small card that opens from its button for one setting or a link to share, follows it as the page scrolls, and flips when there's no room. `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose`
- [Menu](https://basedraft.site/components/menu): A dropdown of actions in quiet sections, each with its shortcut on small keys, options that tick, and the destructive one set apart in red. `Menu`, `MenuTrigger`, `MenuContent`, `MenuLabel`, `MenuSeparator`, `MenuGroup`, `MenuItem`, `MenuCheckboxItem`
- [Command](https://basedraft.site/components/command): A search that does things: type to narrow pages and actions, arrows and Enter to go, in place or as a ⌘K palette with the hero's light at its head. `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandFooter`, `CommandDialog`
- [Toast](https://basedraft.site/components/toast): Short ink notes that rise at the corner and leave on their own, stack like paper, spread when you point at them, and update in place. `Toaster`
- [Context menu](https://basedraft.site/components/context-menu): The actions for a thing, opened where you right-click it: grows from the pointer, turns to stay on screen, opens submenus beside their row, and runs from the keyboard with Shift+F10. `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuSub`
- [Lightbox](https://basedraft.site/components/lightbox): Thumbnails that open into a dark viewer, each photo growing out of its thumbnail without stretching, moved by arrows, swipes or keys, and shrinking back where it came from. `Lightbox`
- [Consent](https://basedraft.site/components/consent): Asking about cookies fairly: Reject all and Accept all set the same, Customize opening to a switch for each kind, the choice kept and read back, and a way to ask again. `Consent`
- [Hover card](https://basedraft.site/components/hover-card): A preview of where a link leads, opening after a pause, staying open on the way to it, with a caret pointing back at the link. `HoverCard`, `HoverCardTrigger`, `HoverCardContent`

### Navigation

- [Tabs](https://basedraft.site/components/tabs): A quiet row of names, the selected one inked on a pill that slides, its panel rising in. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- [Accordion](https://basedraft.site/components/accordion): Numbered questions on one card, each answer springing open as its plus turns into a cross. `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- [Breadcrumb](https://basedraft.site/components/breadcrumb): The path to the page, with a pill that glides from crumb to crumb, a long middle folded into one menu, and a caret that jumps to a level's siblings. `Breadcrumb`
- [Pagination](https://basedraft.site/components/pagination): Pages of a long list, the current one inked on a pill that slides, a row that keeps its length as you go, and numbers that roll the way you went. `Pagination`
- [Table of contents](https://basedraft.site/components/table-of-contents): A long page's sections with an ink bar that slides to the one you're reading, the ones you've passed a shade darker, and links that glide there without a jump. `TableOfContents`

### Display

- [Badge](https://basedraft.site/components/badge): A small stamp in ink, gray, outline, paper or metal, with a status dot that can pulse. `Badge`
- [Card](https://basedraft.site/components/card): A raised face on a soft gray shell, the actions resting on the shell beneath it; it lifts under the pointer with a light that follows, and takes a cover. `Card`, `CardMedia`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- [Avatar](https://basedraft.site/components/avatar): Initials on a stone tint drawn from the name, a status dot, and a group that fans out when you point at it. `Avatar`, `AvatarGroup`
- [Kbd](https://basedraft.site/components/kbd): A keycap that goes down when you press its key on your keyboard. `Kbd`, `KbdGroup`
- [Tooltip](https://basedraft.site/components/tooltip): An ink bubble with a caret, carrying the action's shortcut on small caps. `Tooltip`
- [Number](https://basedraft.site/components/number): A number that rolls to its value a digit at a time, as currency, compact, percent or plain. `RollingNumber`
- [Marquee](https://basedraft.site/components/marquee): An endless row of logos or quotes that drifts sideways, fades at its edges and holds still when pointed at. `Marquee`
- [Steps](https://basedraft.site/components/stepper): The way through a task in a few steps, down the page or across, with a line that fills as you go. `Steps`, `Step`
- [Empty state](https://basedraft.site/components/empty-state): What a list says before it has anything: a small fan of ghost cards that spreads when pointed at, a title, a line and the action that starts it. `EmptyState`
- [Timeline](https://basedraft.site/components/timeline): An activity log: times in a gutter, one rail through raised beads for what matters and small rings for the rest, days gathered, comments in bubbles, new events sliding in on top. `Timeline`, `TimelineGroup`, `TimelineItem`, `TimelineQuote`, `TimelineMeta`
- [Compare slider](https://basedraft.site/components/compare-slider): Two versions of one thing split by a line you drag: press anywhere and it springs there, arrow keys step it, and each side's name steps aside as the line comes near. `CompareSlider`
- [Code block](https://basedraft.site/components/code-block): Code on a card with its file's name or tabs for each package manager, colored in the theme's own hues, long lines wrapping on a hanging indent, marked lines, and a copy that turns to a check. `CodeBlock`
- [Scroll area](https://basedraft.site/components/scroll-area): A box that scrolls the browser's way with a quieter bar that wakes when you need it, and edges that fade, by gradient or by dither, only while there's more past them. `ScrollArea`
- [Countdown](https://basedraft.site/components/countdown): The time left until a launch or a sale's end, on raised tiles or inline, each digit rolling down as it turns over, and handing over to what you say at zero. `Countdown`
- [Panes](https://basedraft.site/components/resizable): Two panels and a line between them that catches at sizes you come back to, folds a side away, and springs home on a double-click. `ResizablePanel`, `Resizable`
- [Carousel](https://basedraft.site/components/carousel): Slides of any width that you drag or flick and that carry on with your speed before settling, with dots or a bar, and that wait while no one's looking. `CarouselSlide`, `Carousel`

### Data

- [Stat](https://basedraft.site/components/stat): A number that rolls into place, its change marked up or down in the tone that means good or bad, over a line that draws in and reads out each point you point at. `Stat`
- [Gauge](https://basedraft.site/components/gauge): A reading against its limit as a dial of dots, filling in ink or in the tone of its zone, its edge dithered and springing to the value as the number counts along. `Gauge`
- [Bar list](https://basedraft.site/components/bar-list): The top few of something, ranked, each over a slim bar whose dots thin through an ordered dither to a hard edge at its value, growing in one by one and gliding when the ranking changes. `BarList`
- [Sparkline](https://basedraft.site/components/sparkline): A trend in the space of a word: a smooth line that draws in, a wash under it that fades or thins as dots, and a dot on the latest value that can pulse while it's live. `Sparkline`

### Feedback

- [Meter](https://basedraft.site/components/meter): Progress drawn in dots, its edge dissolving through an ordered dither and springing as it moves. `Meter`
- [Alert](https://basedraft.site/components/alert): A note in the flow of the page in four tones, washed with its tone or bleeding in from the edge through a dither, with actions, that folds away when closed. `Alert`
- [Banner](https://basedraft.site/components/banner): The line across the top of a site, in ink or on paper, with a badge, a link whose arrow steps forward, messages that roll up in turn, and a close that remembers. `Banner`
- [Spinner](https://basedraft.site/components/spinner): A ring of dots with a crest that sweeps around it, its tail dissolving through an ordered dither. `Spinner`
- [Skeleton](https://basedraft.site/components/skeleton): Solid gray blocks, lines and circles in the shape of what's loading, with a band of fine dots passing through. `Skeleton`, `SkeletonText`, `SkeletonAvatar`

## With Claude Code

basedraft's guide for AI coding agents is at [basedraft.site/llms.txt](https://basedraft.site/llms.txt). Point Claude Code at it and it'll reach for these components instead of writing its own.

## License

MIT
