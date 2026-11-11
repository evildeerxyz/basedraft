# @basedraft/ui

basedraft UI: React components with a material of their own. Ink, brushed metal, paper and glass, depth from light rather than borders, and motion that springs. 111 components, accessible, light and dark, with one stylesheet and nothing to configure.

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
- [Filter bar](https://basedraft.site/components/filter-bar): Filters that read as a sentence you edit in place: Showing deploys where status is not failed and region is Frankfurt or Tokyo. Every dashed word answers a click, and the keys drive it all. `FilterBar`
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
- [Color picker](https://basedraft.site/components/color-picker): A field of saturation and brightness, hue and alpha sliders, an eyedropper, a value typed as hex, rgb or hsl, swatches, and the contrast white and black text would have on the color. `ColorPicker`, `ColorField`

### Overlays

- [Dialog](https://basedraft.site/components/dialog): A white card lifted over a dimmed page, the hero's light at its head, that holds focus until its question is answered. `Dialog`, `DialogTrigger`, `DialogContent`, `DialogIcon`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- [Sheet](https://basedraft.site/components/sheet): A panel that floats in from an edge with the page still in view, and from the bottom, a phone's sheet with a grip to drag it away. `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter`, `SheetClose`
- [Popover](https://basedraft.site/components/popover): A small card that opens from its button for one setting or a link to share, follows it as the page scrolls, and flips when there's no room. `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose`
- [Menu](https://basedraft.site/components/menu): A dropdown of actions in quiet sections, each with its shortcut on small keys, options that tick, and the destructive one set apart in red. `Menu`, `MenuTrigger`, `MenuContent`, `MenuLabel`, `MenuSeparator`, `MenuGroup`, `MenuItem`, `MenuCheckboxItem`
- [Command](https://basedraft.site/components/command): A search that does things: type to narrow pages and actions, arrows and Enter to go, in place or as a ⌘K palette with the hero's light at its head. `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandFooter`, `CommandDialog`
- [Toast](https://basedraft.site/components/toast): Short ink notes that rise at the corner and leave on their own, stack like paper, spread when you point at them, and update in place. `Toaster`
- [Share](https://basedraft.site/components/share): Share, link first: who can open it and the link to copy lead, the faces of those invited open into their access, and new people are invited by email at the foot. `Share`
- [Context menu](https://basedraft.site/components/context-menu): The actions for a thing, opened where you right-click it: grows from the pointer, turns to stay on screen, opens submenus beside their row, and runs from the keyboard with Shift+F10. `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuSub`
- [Lightbox](https://basedraft.site/components/lightbox): Thumbnails that open into a dark viewer, each photo growing out of its thumbnail without stretching, moved by arrows, swipes or keys, and shrinking back where it came from. `Lightbox`
- [Consent](https://basedraft.site/components/consent): Asking about cookies fairly: Reject all and Accept all set the same, Customize opening to a switch for each kind, the choice kept and read back, and a way to ask again. `Consent`
- [Hover card](https://basedraft.site/components/hover-card): A preview of where a link leads, opening after a pause, staying open on the way to it, with a caret pointing back at the link. `HoverCard`, `HoverCardTrigger`, `HoverCardContent`
- [Tour](https://basedraft.site/components/tour): A walk through a screen one thing at a time: the page dims, a window opens over the thing and glides to the next taking its shape, with a card that goes to the side with room. `Tour`

### Navigation

- [Tabs](https://basedraft.site/components/tabs): A quiet row of names, the selected one inked on a pill that slides, its panel rising in. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- [Accordion](https://basedraft.site/components/accordion): Numbered questions on one card, each answer springing open as its plus turns into a cross. `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- [Breadcrumb](https://basedraft.site/components/breadcrumb): The path to the page, with a pill that glides from crumb to crumb, a long middle folded into one menu, and a caret that jumps to a level's siblings. `Breadcrumb`
- [Pagination](https://basedraft.site/components/pagination): Pages of a long list, the current one inked on a pill that slides, a row that keeps its length as you go, and numbers that roll the way you went. `Pagination`
- [Tree](https://basedraft.site/components/tree): Folders that spring open beside a guide line, darker along the branch to the chosen row, which rides a pill that glides; run by the keyboard like a file tree. `Tree`
- [Table of contents](https://basedraft.site/components/table-of-contents): A long page's sections with an ink bar that slides to the one you're reading, the ones you've passed a shade darker, and links that glide there without a jump. `TableOfContents`
- [Navigation menu](https://basedraft.site/components/navigation-menu): A site's top navigation with one panel that travels between its menus, gliding across and resizing to each one's content as it slides in the way you went, with a caret that follows. `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuCard`, `NavigationMenu`
- [Dock](https://basedraft.site/components/dock): A frosted dock of brushed-metal keys that swell on their own springs as the pointer nears, with a name rising over the one you're on, dots under the open ones, a hop when pressed, and the arrow keys to walk it. `Dock`, `DockItem`, `DockDivider`
- [Account menu](https://basedraft.site/components/account-menu): You, and what's yours: your dithered face that opens a menu with your name, email and plan, your pages with their shortcuts, light, dark or system, and Sign out set apart in red. `AccountMenu`

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
- [Dither image](https://basedraft.site/components/dither-image): Any picture printed as an ordered dither, in ink, as round halftone dots or in its own colors stepped down, that develops into view and shows the photo through a dissolve. `DitherImage`
- [Compare slider](https://basedraft.site/components/compare-slider): Two versions of one thing split by a line you drag: press anywhere and it springs there, arrow keys step it, and each side's name steps aside as the line comes near. `CompareSlider`
- [Code block](https://basedraft.site/components/code-block): Code on a card with its file's name or tabs for each package manager, colored in the theme's own hues, long lines wrapping on a hanging indent, marked lines, and a copy that turns to a check. `CodeBlock`
- [Scroll area](https://basedraft.site/components/scroll-area): A box that scrolls the browser's way with a quieter bar that wakes when you need it, and edges that fade, by gradient or by dither, only while there's more past them. `ScrollArea`
- [Countdown](https://basedraft.site/components/countdown): The time left until a launch or a sale's end, on raised tiles or inline, each digit rolling down as it turns over, and handing over to what you say at zero. `Countdown`
- [Sortable list](https://basedraft.site/components/sortable-list): Rows you lift and carry with a spring while the rest make room, scrolling at the edges, and reorder from the keyboard just the same. `SortableList`
- [Panes](https://basedraft.site/components/resizable): Two panels and a line between them that catches at sizes you come back to, folds a side away, and springs home on a double-click. `ResizablePanel`, `Resizable`
- [Carousel](https://basedraft.site/components/carousel): Slides of any width that you drag or flick and that carry on with your speed before settling, with dots or a bar, and that wait while no one's looking. `CarouselSlide`, `Carousel`
- [Code diff](https://basedraft.site/components/code-diff): Two versions of a file, unified or side by side: the words that changed marked inside each line, the code still in color, quiet stretches folded to a row that opens, and a count whose cells mix through a dither. `CodeDiff`
- [Swipe deck](https://basedraft.site/components/swipe-deck): A stack of cards to decide on one at a time: the top one tilts with your hand as it leans, flies off past the line or on a flick, and comes back with Undo. `SwipeDeck`
- [Particle text](https://basedraft.site/components/particle-text): A word made of ink pixels, lit from above through an ordered dither, that scatter from your pointer and settle back, and sweep from one word into the next. `ParticleText`
- [Split-flap](https://basedraft.site/components/split-flap): Letters on hinged flaps, the way a departures board turns over: each one flips forward through the alphabet to its letter, the top half falling and shading as it goes, rippling along the word. `FLAPS`, `SplitFlap`
- [Commit](https://basedraft.site/components/commit): A commit the way people read one: the message first, then who made it with their face, the branch and a short hash that copies the whole one. On one line for a list, or stacked for a page about it. `Commit`

### Data

- [Data table](https://basedraft.site/components/data-table): Rows on a white sheet that sort with a turning arrow and glide into place, pick in ranges with Shift, open for detail, and keep their header and first column in view. `DataTable`
- [Metric tabs](https://basedraft.site/components/metric-tabs): The figures that matter as tabs across a card, each with how far it moved and whether that's good news, and under them the chart for the one you pick, an ink rule sliding between them. `MetricTabs`
- [Stat](https://basedraft.site/components/stat): A number that rolls into place, its change marked up or down in the tone that means good or bad, over a line that draws in and reads out each point you point at. `Stat`
- [Gauge](https://basedraft.site/components/gauge): A reading against its limit as a dial of dots, filling in ink or in the tone of its zone, its edge dithered and springing to the value as the number counts along. `Gauge`
- [Roadmap](https://basedraft.site/components/roadmap): Work laid out over the weeks it takes, in groups, with today ruled in ink: drag a bar to move it or an end to stretch it, snapping to days, and see at a glance what's planned, under way, at risk or done. `Roadmap`
- [Allowance](https://basedraft.site/components/allowance): How much of an allowance is used: the share, a bar that turns amber near the limit and red past it, and where the month is heading at this pace, hatched ahead. Folds to a ring for a sidebar's rail. `Allowance`
- [Bar list](https://basedraft.site/components/bar-list): The top few of something, ranked, each over a slim bar whose dots thin through an ordered dither to a hard edge at its value, growing in one by one and gliding when the ranking changes. `BarList`
- [Sparkline](https://basedraft.site/components/sparkline): A trend in the space of a word: a smooth line that draws in, a wash under it that fades or thins as dots, and a dot on the latest value that can pulse while it's live. `Sparkline`
- [Area chart](https://basedraft.site/components/area-chart): Smooth lines over a soft wash that draw in from the left, with a crosshair that snaps to the nearest point, stacking, and a legend that re-scales on a spring. `AreaChart`
- [Bar chart](https://basedraft.site/components/bar-chart): Grouped or stacked bars, standing up or lying down, that grow in one after another, with a band that follows the pointer, values below zero and labels on the bars. `BarChart`
- [Donut chart](https://basedraft.site/components/donut-chart): Parts of a whole that sweep around a ring, slide out to show their share in the middle, and a total that rolls up as it fills. `DonutChart`
- [Heatmap](https://basedraft.site/components/heatmap): A year of activity a day at a time, each day's cell shaded by an ordered dither instead of a fade, fitting as many weeks as it has room for, with a card for any day by pointer or keys. `Heatmap`
- [Uptime](https://basedraft.site/components/uptime): A service's days as slim bars, a bad day mixed amber or red through an ordered dither in proportion to how much went wrong, with its incidents a point away. `Uptime`
- [Funnel](https://basedraft.site/components/funnel): How many make it from step to step: bars that rise in turn, the ones lost dissolving above each through a dither or held as a faint wash, a band carrying the flow, and what each step kept. `Funnel`
- [Log viewer](https://basedraft.site/components/log-viewer): Log lines as they stream in: errors and warnings marked down the edge, chips that filter by level with counts, a search that narrows and marks, lines that open to their fields, and a pill back to the newest. `LogViewer`
- [Globe](https://basedraft.site/components/globe): The Earth in dots, lit and shaded by an ordered dither, that spins when dragged and coasts to a stop, with markers that pulse, arcs that rise between them carrying a light, and a turn to face whatever you choose. `Globe`
- [Pipeline](https://basedraft.site/components/pipeline): A job's stages as a waterfall, the way a trace reads: a row each, and on one time axis a bar from where it started for as long as it took. Ghosts for what's to come, the running one growing in ink with a hairline for now, red where it failed. Pick a stage and its output opens under its row. `Pipeline`
- [Score meter](https://basedraft.site/components/score-meter): A score out of a hundred as a row of capsules: as many lit as it reaches, the last filled only as far as it does, in the tone of its band. They light one after another the first time it's seen, for a column of fit or health scores that reads at a glance. `ScoreMeter`
- [Runway](https://basedraft.site/components/runway): A balance's past and where it's heading on one line: what it was day by day in ink up to a hairline for today, then a ghost at the pace it's spent, down to the day it runs out. A top-up that runs by itself turns the ghost into a saw that never reaches zero. `Runway`
- [Pace](https://basedraft.site/components/pace): Where each allowance stands now and where it lands by the period's end, on one scale with the plan's line running down through them all. A dot for now, a ring for the end at this pace, and past the plan the ghost turns amber. `Pace`
- [Lanes](https://basedraft.site/components/lanes): Rows that share one time axis, each with what happened to it along its own lane: ink ticks for what shipped, gray for what was tried, red for what failed and a breathing ring for what's running, with a hairline for now and weekends shaded. `Lanes`

### Patterns

- [Kanban board](https://basedraft.site/components/kanban-board): Columns of cards you carry by hand or by keyboard: the lifted card tilts and casts a deeper shadow, the others make room, and every move is announced. `KanbanBoard`
- [AI chat](https://basedraft.site/components/ai-chat): An assistant thread: replies that stream in word by word, tool calls that open to show their work, and a composer that sends, attaches and stops. `Thinking`, `ChatThread`, `ChatComposer`, `AiChat`
- [Inbox](https://basedraft.site/components/inbox): A notification center behind a bell: an unread count that rolls, tabs on a sliding pill, items grouped by day that you mark read with a click or a swipe. `InboxPanel`, `Inbox`
- [Pricing table](https://basedraft.site/components/pricing-table): A whole pricing section: a monthly and yearly switch whose prices roll, Yearly tagged with what it saves, the plan you'd pick lit by the hero's light, seats with a rolling total, and a comparison that keeps the plan names in view. `PricingTable`
- [App sidebar](https://basedraft.site/components/app-sidebar): An app's navigation down the left: the workspace with search and the fold beside it, views like Home and Activity on a sliding thumb, pages whose ends carry a count, a New tag, an unread dot or a spinner, a fill that slides to the page you're on, a rail of icons, and a drawer that swipes away on a phone. `AppSidebar`
- [First steps](https://basedraft.site/components/onboarding): A new account's first steps in a card that keeps count: a ring that fills, ticks that draw in, the next step opening on its own, a pill to fold it into, and a finish that blooms. `OnboardingChecklist`
- [Wizard](https://basedraft.site/components/wizard): A form in steps: a rail that fills, each step sliding in from the side you're heading, checks that land the cursor on what's wrong, a review to read it all back, and a finish. `Wizard`
- [Scheduler](https://basedraft.site/components/scheduler): Booking a time: who and what, a month whose open days are lit with a pill that glides to the one you pick, the day's times splitting into a Confirm, and a confirmation with a check that draws and an .ics. `Scheduler`
- [Flow](https://basedraft.site/components/flow): A node editor on a dotted board that pans and zooms: steps that snap to the grid, curves you draw from an output to the input they snap to, data visibly flowing into the step that's running, a minimap, and undo. `Flow`
- [Live cursors](https://basedraft.site/components/live-cursors): Everyone else's pointer, gliding on a spring with their name, the box they've selected and what they're saying in a bubble; press / to say something at your own, and follow anyone from the faces above. `LiveCursors`, `Viewers`
- [Sign-in](https://basedraft.site/components/sign-in): Signing in, in two short steps: a provider in one click with the last one used tagged, or an email then a password or a six-digit code that fills from a paste, and a split layout beside art in a dither. `SignIn`
- [Top up](https://basedraft.site/components/top-up): Adding money to a balance, said in what it buys: the amount big in the middle, typed or run along a tape, and how long it lasts with it. What's charged reads as one sentence with the card a picker in it, paying is a hold, and once it's paid the column turns over to the balance and its runway, before and after. `TopUp`

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
