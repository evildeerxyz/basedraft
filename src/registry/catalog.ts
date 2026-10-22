/* Written by scripts/registry.mjs from src/registry/entries: each newer component's meta and documentation. Don't edit by hand. */
import type { ComponentDoc, ComponentMeta } from "./types";
import { doc as e_accordion } from "./entries/accordion/doc";
import { doc as e_actionBar } from "./entries/action-bar/doc";
import { doc as e_aiChat } from "./entries/ai-chat/doc";
import { doc as e_appSidebar } from "./entries/app-sidebar/doc";
import { doc as e_areaChart } from "./entries/area-chart/doc";
import { doc as e_avatar } from "./entries/avatar/doc";
import { doc as e_badge } from "./entries/badge/doc";
import { doc as e_barChart } from "./entries/bar-chart/doc";
import { doc as e_button } from "./entries/button/doc";
import { doc as e_card } from "./entries/card/doc";
import { doc as e_carousel } from "./entries/carousel/doc";
import { doc as e_checkbox } from "./entries/checkbox/doc";
import { doc as e_codeInput } from "./entries/code-input/doc";
import { doc as e_combobox } from "./entries/combobox/doc";
import { doc as e_command } from "./entries/command/doc";
import { doc as e_commandLine } from "./entries/command-line/doc";
import { doc as e_copyButton } from "./entries/copy-button/doc";
import { doc as e_dataTable } from "./entries/data-table/doc";
import { doc as e_datePicker } from "./entries/date-picker/doc";
import { doc as e_dialog } from "./entries/dialog/doc";
import { doc as e_donutChart } from "./entries/donut-chart/doc";
import { doc as e_emptyState } from "./entries/empty-state/doc";
import { doc as e_field } from "./entries/field/doc";
import { doc as e_fileDrop } from "./entries/file-drop/doc";
import { doc as e_holdButton } from "./entries/hold-button/doc";
import { doc as e_hoverCard } from "./entries/hover-card/doc";
import { doc as e_inbox } from "./entries/inbox/doc";
import { doc as e_inlineEdit } from "./entries/inline-edit/doc";
import { doc as e_input } from "./entries/input/doc";
import { doc as e_kanbanBoard } from "./entries/kanban-board/doc";
import { doc as e_kbd } from "./entries/kbd/doc";
import { doc as e_marquee } from "./entries/marquee/doc";
import { doc as e_menu } from "./entries/menu/doc";
import { doc as e_meter } from "./entries/meter/doc";
import { doc as e_number } from "./entries/number/doc";
import { doc as e_numberField } from "./entries/number-field/doc";
import { doc as e_onboarding } from "./entries/onboarding/doc";
import { doc as e_popover } from "./entries/popover/doc";
import { doc as e_pricingTable } from "./entries/pricing-table/doc";
import { doc as e_radioGroup } from "./entries/radio-group/doc";
import { doc as e_resizable } from "./entries/resizable/doc";
import { doc as e_segmented } from "./entries/segmented/doc";
import { doc as e_select } from "./entries/select/doc";
import { doc as e_sheet } from "./entries/sheet/doc";
import { doc as e_skeleton } from "./entries/skeleton/doc";
import { doc as e_slider } from "./entries/slider/doc";
import { doc as e_sortableList } from "./entries/sortable-list/doc";
import { doc as e_spinner } from "./entries/spinner/doc";
import { doc as e_stat } from "./entries/stat/doc";
import { doc as e_stepper } from "./entries/stepper/doc";
import { doc as e_switch } from "./entries/switch/doc";
import { doc as e_tabs } from "./entries/tabs/doc";
import { doc as e_tagInput } from "./entries/tag-input/doc";
import { doc as e_textarea } from "./entries/textarea/doc";
import { doc as e_themeToggle } from "./entries/theme-toggle/doc";
import { doc as e_toast } from "./entries/toast/doc";
import { doc as e_toolbar } from "./entries/toolbar/doc";
import { doc as e_tooltip } from "./entries/tooltip/doc";
import { doc as e_wizard } from "./entries/wizard/doc";

export const ENTRY_META: ComponentMeta[] = [
  {
    "order": 1,
    "name": "accordion",
    "title": "Accordion",
    "group": "Navigation",
    "description": "Numbered questions on one card, each answer springing open as its plus turns into a cross."
  },
  {
    "order": 61,
    "name": "action-bar",
    "title": "Action bar",
    "group": "Actions",
    "description": "An ink bar that rises while things are selected, its count rolling, with what you can do to all of them and a way to let them go."
  },
  {
    "order": 20,
    "name": "ai-chat",
    "title": "AI chat",
    "group": "Patterns",
    "description": "An assistant thread: replies that stream in word by word, tool calls that open to show their work, and a composer that sends, attaches and stops.",
    "pro": true
  },
  {
    "order": 50,
    "name": "app-sidebar",
    "title": "App sidebar",
    "group": "Patterns",
    "description": "An app's navigation down the left: a workspace switcher, search, sections with counts and groups, a pill that slides to the page you're on, a rail of icons, and a drawer that swipes away on a phone.",
    "pro": true
  },
  {
    "order": 30,
    "name": "area-chart",
    "title": "Area chart",
    "group": "Data",
    "description": "Smooth lines over a soft wash that draw in from the left, with a crosshair that snaps to the nearest point, stacking, and a legend that re-scales on a spring.",
    "pro": true
  },
  {
    "order": 2,
    "name": "avatar",
    "title": "Avatar",
    "group": "Display",
    "description": "Initials on a stone tint drawn from the name, a status dot, and a group that fans out when you point at it."
  },
  {
    "order": 0,
    "name": "badge",
    "title": "Badge",
    "group": "Display",
    "description": "A small stamp in ink, gray, outline, paper or metal, with a status dot that can pulse."
  },
  {
    "order": 31,
    "name": "bar-chart",
    "title": "Bar chart",
    "group": "Data",
    "description": "Grouped or stacked bars, standing up or lying down, that grow in one after another, with a band that follows the pointer, values below zero and labels on the bars.",
    "pro": true
  },
  {
    "order": 0,
    "name": "button",
    "title": "Button",
    "group": "Actions",
    "description": "A pill in ink, metal, paper, glass, outline or ghost, with a field of dithered dots while it loads."
  },
  {
    "order": 1,
    "name": "card",
    "title": "Card",
    "group": "Display",
    "description": "A raised face on a soft gray shell, the actions resting on the shell beneath it; it lifts under the pointer with a light that follows, and takes a cover."
  },
  {
    "order": 62,
    "name": "carousel",
    "title": "Carousel",
    "group": "Display",
    "description": "Slides of any width that you drag or flick and that carry on with your speed before settling, with dots or a bar, and that wait while no one's looking."
  },
  {
    "order": 50,
    "name": "checkbox",
    "title": "Checkbox",
    "group": "Forms",
    "description": "A box pressed into the page that fills with ink as its tick draws in, with a half-on state and a row that carries a label and a line."
  },
  {
    "order": 53,
    "name": "code-input",
    "title": "Code input",
    "group": "Forms",
    "description": "A one-time code a cell at a time: typing moves along, a paste or a phone's autofill fills them all, and a wrong code shakes."
  },
  {
    "order": 60,
    "name": "combobox",
    "title": "Combobox",
    "group": "Forms",
    "description": "A select you can type into: results filter and group as you go, the match drawn in bold, with chips for several and a row to create what's missing."
  },
  {
    "order": 5,
    "name": "command",
    "title": "Command",
    "group": "Overlays",
    "description": "A search that does things: type to narrow pages and actions, arrows and Enter to go, in place or as a ⌘K palette with the hero's light at its head."
  },
  {
    "order": 3,
    "name": "command-line",
    "title": "Command line",
    "group": "Actions",
    "description": "A shell command on a small ink terminal, colored, with a copy button and a switch between package managers."
  },
  {
    "order": 2,
    "name": "copy-button",
    "title": "Copy button",
    "group": "Actions",
    "description": "Copies a piece of text, its icon turning over into a check as a ring spreads from it."
  },
  {
    "order": 10,
    "name": "data-table",
    "title": "Data table",
    "group": "Data",
    "description": "Rows on a white sheet that sort with a turning arrow and glide into place, pick in ranges with Shift, open for detail, and keep their header and first column in view.",
    "pro": true
  },
  {
    "order": 63,
    "name": "date-picker",
    "title": "Date picker",
    "group": "Forms",
    "description": "A field that opens a month whose pages slide the way you go, walked by the arrow keys, for one day or a range with a band that follows the pointer."
  },
  {
    "order": 1,
    "name": "dialog",
    "title": "Dialog",
    "group": "Overlays",
    "description": "A white card lifted over a dimmed page, the hero's light at its head, that holds focus until its question is answered."
  },
  {
    "order": 32,
    "name": "donut-chart",
    "title": "Donut chart",
    "group": "Data",
    "description": "Parts of a whole that sweep around a ring, slide out to show their share in the middle, and a total that rolls up as it fills.",
    "pro": true
  },
  {
    "order": 53,
    "name": "empty-state",
    "title": "Empty state",
    "group": "Display",
    "description": "What a list says before it has anything: a small fan of ghost cards that spreads when pointed at, a title, a line and the action that starts it."
  },
  {
    "order": 54,
    "name": "field",
    "title": "Field",
    "group": "Forms",
    "description": "A label, a hint and an error around any control, wired for screen readers, with a count when there's a limit."
  },
  {
    "order": 64,
    "name": "file-drop",
    "title": "File drop",
    "group": "Forms",
    "description": "A zone that wakes when files are dragged over the page and lifts to meet them, listing each with its kind, its progress, and why it failed or was turned away."
  },
  {
    "order": 1,
    "name": "hold-button",
    "title": "Hold button",
    "group": "Actions",
    "description": "Press and hold to confirm: ink fills it as you hold, and letting go early cancels."
  },
  {
    "order": 60,
    "name": "hover-card",
    "title": "Hover card",
    "group": "Overlays",
    "description": "A preview of where a link leads, opening after a pause, staying open on the way to it, with a caret pointing back at the link."
  },
  {
    "order": 30,
    "name": "inbox",
    "title": "Inbox",
    "group": "Patterns",
    "description": "A notification center behind a bell: an unread count that rolls, tabs on a sliding pill, items grouped by day that you mark read with a click or a swipe.",
    "pro": true
  },
  {
    "order": 60,
    "name": "inline-edit",
    "title": "Inline edit",
    "group": "Forms",
    "description": "Text that becomes a field where it stands, the same size and type, growing as you type, with saving, a check, and a shake when it is refused."
  },
  {
    "order": 0,
    "name": "input",
    "title": "Input",
    "group": "Forms",
    "description": "A text field pressed into the page that lifts to a white face as you type, with room for an icon or a suffix."
  },
  {
    "order": 10,
    "name": "kanban-board",
    "title": "Kanban board",
    "group": "Patterns",
    "description": "Columns of cards you carry by hand or by keyboard: the lifted card tilts and casts a deeper shadow, the others make room, and every move is announced.",
    "pro": true
  },
  {
    "order": 3,
    "name": "kbd",
    "title": "Kbd",
    "group": "Display",
    "description": "A keycap that goes down when you press its key on your keyboard."
  },
  {
    "order": 51,
    "name": "marquee",
    "title": "Marquee",
    "group": "Display",
    "description": "An endless row of logos or quotes that drifts sideways, fades at its edges and holds still when pointed at."
  },
  {
    "order": 4,
    "name": "menu",
    "title": "Menu",
    "group": "Overlays",
    "description": "A dropdown of actions in quiet sections, each with its shortcut on small keys, options that tick, and the destructive one set apart in red."
  },
  {
    "order": 0,
    "name": "meter",
    "title": "Meter",
    "group": "Feedback",
    "description": "Progress drawn in dots, its edge dissolving through an ordered dither and springing as it moves."
  },
  {
    "order": 50,
    "name": "number",
    "title": "Number",
    "group": "Display",
    "description": "A number that rolls to its value a digit at a time, as currency, compact, percent or plain."
  },
  {
    "order": 62,
    "name": "number-field",
    "title": "Number field",
    "group": "Forms",
    "description": "A pill with − and + that speed up as they're held, a label you drag sideways to scrub, and arrow keys with Shift for bigger steps."
  },
  {
    "order": 60,
    "name": "onboarding",
    "title": "Onboarding checklist",
    "group": "Patterns",
    "description": "A new account's first steps in a card that keeps count: a ring that fills, ticks that draw in, the next step opening on its own, a pill to fold it into, and a finish that blooms.",
    "pro": true
  },
  {
    "order": 3,
    "name": "popover",
    "title": "Popover",
    "group": "Overlays",
    "description": "A small card that opens from its button for one setting or a link to share, follows it as the page scrolls, and flips when there's no room."
  },
  {
    "order": 40,
    "name": "pricing-table",
    "title": "Pricing table",
    "group": "Patterns",
    "description": "A whole pricing section: a monthly and yearly switch whose prices roll, Yearly tagged with what it saves, the plan you'd pick lit by the hero's light, seats with a rolling total, and a comparison that keeps the plan names in view.",
    "pro": true
  },
  {
    "order": 51,
    "name": "radio-group",
    "title": "Radio group",
    "group": "Forms",
    "description": "One choice from a short list, as rows with an ink dot and a bead, or as cards that take an ink edge."
  },
  {
    "order": 61,
    "name": "resizable",
    "title": "Resizable panels",
    "group": "Display",
    "description": "Two panels and a line between them that catches at sizes you come back to, folds a side away, and springs home on a double-click."
  },
  {
    "order": 3,
    "name": "segmented",
    "title": "Segmented control",
    "group": "Forms",
    "description": "One choice of a few in a machined track, the chosen one on a raised thumb that slides."
  },
  {
    "order": 52,
    "name": "select",
    "title": "Select",
    "group": "Forms",
    "description": "A pill that opens a card of choices in groups, ticked in ink, moved by the arrow keys and by typing a name."
  },
  {
    "order": 2,
    "name": "sheet",
    "title": "Sheet",
    "group": "Overlays",
    "description": "A panel that floats in from an edge with the page still in view, and from the bottom, a phone's sheet with a grip to drag it away."
  },
  {
    "order": 51,
    "name": "skeleton",
    "title": "Skeleton",
    "group": "Feedback",
    "description": "Solid gray blocks, lines and circles in the shape of what's loading, with a band of fine dots passing through."
  },
  {
    "order": 4,
    "name": "slider",
    "title": "Slider",
    "group": "Forms",
    "description": "A value along an ink track: a bead to drag, a bubble that says the value, and marked stops under it."
  },
  {
    "order": 60,
    "name": "sortable-list",
    "title": "Sortable list",
    "group": "Display",
    "description": "Rows you lift and carry with a spring while the rest make room, scrolling at the edges, and reorder from the keyboard just the same.",
    "pro": true
  },
  {
    "order": 50,
    "name": "spinner",
    "title": "Spinner",
    "group": "Feedback",
    "description": "A ring of dots with a crest that sweeps around it, its tail dissolving through an ordered dither."
  },
  {
    "order": 20,
    "name": "stat",
    "title": "Stat",
    "group": "Data",
    "description": "A number that rolls into place, its change marked up or down in the tone that means good or bad, over a line that draws in and reads out each point you point at."
  },
  {
    "order": 52,
    "name": "stepper",
    "title": "Steps",
    "group": "Display",
    "description": "The way through a task in a few steps, down the page or across, with a line that fills as you go."
  },
  {
    "order": 2,
    "name": "switch",
    "title": "Switch",
    "group": "Forms",
    "description": "A recessed track that fills with ink, and a bead for a knob that stretches while you press it."
  },
  {
    "order": 0,
    "name": "tabs",
    "title": "Tabs",
    "group": "Navigation",
    "description": "A quiet row of names, the selected one inked on a pill that slides, its panel rising in."
  },
  {
    "order": 61,
    "name": "tag-input",
    "title": "Tag input",
    "group": "Forms",
    "description": "A field that turns what you type into chips on Enter or a comma, splits a pasted list, and lets each chip be checked, edited in place or taken away."
  },
  {
    "order": 1,
    "name": "textarea",
    "title": "Textarea",
    "group": "Forms",
    "description": "A longer field that grows as you type, with a small ring that counts toward its limit."
  },
  {
    "order": 62,
    "name": "theme-toggle",
    "title": "Theme toggle",
    "group": "Actions",
    "description": "Light and dark, switched with a circle of the new theme opening from the button, a sun that turns into a moon, and a System choice."
  },
  {
    "order": 6,
    "name": "toast",
    "title": "Toast",
    "group": "Overlays",
    "description": "Short ink notes that rise at the corner and leave on their own, stack like paper, spread when you point at them, and update in place."
  },
  {
    "order": 60,
    "name": "toolbar",
    "title": "Toolbar",
    "group": "Actions",
    "description": "Tools on one white bar, with toggles, a group whose chip slides, a tooltip that glides from tool to tool, and a More menu when it runs out of room."
  },
  {
    "order": 4,
    "name": "tooltip",
    "title": "Tooltip",
    "group": "Display",
    "description": "An ink bubble with a caret, carrying the action's shortcut on small caps."
  },
  {
    "order": 70,
    "name": "wizard",
    "title": "Wizard",
    "group": "Patterns",
    "description": "A form in steps: a rail that fills, each step sliding in from the side you're heading, checks that land the cursor on what's wrong, a review to read it all back, and a finish.",
    "pro": true
  }
];

export const ENTRY_DOCS: Record<string, ComponentDoc> = {
  "accordion": e_accordion,
  "action-bar": e_actionBar,
  "ai-chat": e_aiChat,
  "app-sidebar": e_appSidebar,
  "area-chart": e_areaChart,
  "avatar": e_avatar,
  "badge": e_badge,
  "bar-chart": e_barChart,
  "button": e_button,
  "card": e_card,
  "carousel": e_carousel,
  "checkbox": e_checkbox,
  "code-input": e_codeInput,
  "combobox": e_combobox,
  "command": e_command,
  "command-line": e_commandLine,
  "copy-button": e_copyButton,
  "data-table": e_dataTable,
  "date-picker": e_datePicker,
  "dialog": e_dialog,
  "donut-chart": e_donutChart,
  "empty-state": e_emptyState,
  "field": e_field,
  "file-drop": e_fileDrop,
  "hold-button": e_holdButton,
  "hover-card": e_hoverCard,
  "inbox": e_inbox,
  "inline-edit": e_inlineEdit,
  "input": e_input,
  "kanban-board": e_kanbanBoard,
  "kbd": e_kbd,
  "marquee": e_marquee,
  "menu": e_menu,
  "meter": e_meter,
  "number": e_number,
  "number-field": e_numberField,
  "onboarding": e_onboarding,
  "popover": e_popover,
  "pricing-table": e_pricingTable,
  "radio-group": e_radioGroup,
  "resizable": e_resizable,
  "segmented": e_segmented,
  "select": e_select,
  "sheet": e_sheet,
  "skeleton": e_skeleton,
  "slider": e_slider,
  "sortable-list": e_sortableList,
  "spinner": e_spinner,
  "stat": e_stat,
  "stepper": e_stepper,
  "switch": e_switch,
  "tabs": e_tabs,
  "tag-input": e_tagInput,
  "textarea": e_textarea,
  "theme-toggle": e_themeToggle,
  "toast": e_toast,
  "toolbar": e_toolbar,
  "tooltip": e_tooltip,
  "wizard": e_wizard,
};
