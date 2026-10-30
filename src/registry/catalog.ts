/* Written by scripts/registry.mjs from src/registry/entries: each newer component's meta and documentation. Don't edit by hand. */
import type { ComponentDoc, ComponentMeta } from "./types";
import { doc as e_accordion } from "./entries/accordion/doc";
import { doc as e_accountMenu } from "./entries/account-menu/doc";
import { doc as e_actionBar } from "./entries/action-bar/doc";
import { doc as e_aiChat } from "./entries/ai-chat/doc";
import { doc as e_alert } from "./entries/alert/doc";
import { doc as e_allowance } from "./entries/allowance/doc";
import { doc as e_appSidebar } from "./entries/app-sidebar/doc";
import { doc as e_areaChart } from "./entries/area-chart/doc";
import { doc as e_avatar } from "./entries/avatar/doc";
import { doc as e_badge } from "./entries/badge/doc";
import { doc as e_banner } from "./entries/banner/doc";
import { doc as e_barChart } from "./entries/bar-chart/doc";
import { doc as e_barList } from "./entries/bar-list/doc";
import { doc as e_breadcrumb } from "./entries/breadcrumb/doc";
import { doc as e_button } from "./entries/button/doc";
import { doc as e_card } from "./entries/card/doc";
import { doc as e_carousel } from "./entries/carousel/doc";
import { doc as e_checkbox } from "./entries/checkbox/doc";
import { doc as e_chips } from "./entries/chips/doc";
import { doc as e_codeBlock } from "./entries/code-block/doc";
import { doc as e_codeDiff } from "./entries/code-diff/doc";
import { doc as e_codeInput } from "./entries/code-input/doc";
import { doc as e_colorPicker } from "./entries/color-picker/doc";
import { doc as e_combobox } from "./entries/combobox/doc";
import { doc as e_command } from "./entries/command/doc";
import { doc as e_commandLine } from "./entries/command-line/doc";
import { doc as e_compareSlider } from "./entries/compare-slider/doc";
import { doc as e_consent } from "./entries/consent/doc";
import { doc as e_contextMenu } from "./entries/context-menu/doc";
import { doc as e_copyButton } from "./entries/copy-button/doc";
import { doc as e_countdown } from "./entries/countdown/doc";
import { doc as e_dataTable } from "./entries/data-table/doc";
import { doc as e_datePicker } from "./entries/date-picker/doc";
import { doc as e_dialog } from "./entries/dialog/doc";
import { doc as e_ditherImage } from "./entries/dither-image/doc";
import { doc as e_dock } from "./entries/dock/doc";
import { doc as e_donutChart } from "./entries/donut-chart/doc";
import { doc as e_emptyState } from "./entries/empty-state/doc";
import { doc as e_field } from "./entries/field/doc";
import { doc as e_fileDrop } from "./entries/file-drop/doc";
import { doc as e_filterBar } from "./entries/filter-bar/doc";
import { doc as e_flow } from "./entries/flow/doc";
import { doc as e_funnel } from "./entries/funnel/doc";
import { doc as e_gauge } from "./entries/gauge/doc";
import { doc as e_globe } from "./entries/globe/doc";
import { doc as e_heatmap } from "./entries/heatmap/doc";
import { doc as e_holdButton } from "./entries/hold-button/doc";
import { doc as e_hoverCard } from "./entries/hover-card/doc";
import { doc as e_inbox } from "./entries/inbox/doc";
import { doc as e_inlineEdit } from "./entries/inline-edit/doc";
import { doc as e_input } from "./entries/input/doc";
import { doc as e_kanbanBoard } from "./entries/kanban-board/doc";
import { doc as e_kbd } from "./entries/kbd/doc";
import { doc as e_lightbox } from "./entries/lightbox/doc";
import { doc as e_liveCursors } from "./entries/live-cursors/doc";
import { doc as e_logViewer } from "./entries/log-viewer/doc";
import { doc as e_marquee } from "./entries/marquee/doc";
import { doc as e_menu } from "./entries/menu/doc";
import { doc as e_meter } from "./entries/meter/doc";
import { doc as e_metricTabs } from "./entries/metric-tabs/doc";
import { doc as e_navigationMenu } from "./entries/navigation-menu/doc";
import { doc as e_number } from "./entries/number/doc";
import { doc as e_numberField } from "./entries/number-field/doc";
import { doc as e_onboarding } from "./entries/onboarding/doc";
import { doc as e_pagination } from "./entries/pagination/doc";
import { doc as e_particleText } from "./entries/particle-text/doc";
import { doc as e_passwordField } from "./entries/password-field/doc";
import { doc as e_popover } from "./entries/popover/doc";
import { doc as e_pricingTable } from "./entries/pricing-table/doc";
import { doc as e_radioGroup } from "./entries/radio-group/doc";
import { doc as e_resizable } from "./entries/resizable/doc";
import { doc as e_roadmap } from "./entries/roadmap/doc";
import { doc as e_scheduler } from "./entries/scheduler/doc";
import { doc as e_scrollArea } from "./entries/scroll-area/doc";
import { doc as e_segmented } from "./entries/segmented/doc";
import { doc as e_select } from "./entries/select/doc";
import { doc as e_share } from "./entries/share/doc";
import { doc as e_sheet } from "./entries/sheet/doc";
import { doc as e_signIn } from "./entries/sign-in/doc";
import { doc as e_skeleton } from "./entries/skeleton/doc";
import { doc as e_slider } from "./entries/slider/doc";
import { doc as e_sortableList } from "./entries/sortable-list/doc";
import { doc as e_sparkline } from "./entries/sparkline/doc";
import { doc as e_spinner } from "./entries/spinner/doc";
import { doc as e_splitButton } from "./entries/split-button/doc";
import { doc as e_splitFlap } from "./entries/split-flap/doc";
import { doc as e_stat } from "./entries/stat/doc";
import { doc as e_stepper } from "./entries/stepper/doc";
import { doc as e_swipeDeck } from "./entries/swipe-deck/doc";
import { doc as e_switch } from "./entries/switch/doc";
import { doc as e_tableOfContents } from "./entries/table-of-contents/doc";
import { doc as e_tabs } from "./entries/tabs/doc";
import { doc as e_tagInput } from "./entries/tag-input/doc";
import { doc as e_textarea } from "./entries/textarea/doc";
import { doc as e_themeToggle } from "./entries/theme-toggle/doc";
import { doc as e_timePicker } from "./entries/time-picker/doc";
import { doc as e_timeline } from "./entries/timeline/doc";
import { doc as e_toast } from "./entries/toast/doc";
import { doc as e_toolbar } from "./entries/toolbar/doc";
import { doc as e_tooltip } from "./entries/tooltip/doc";
import { doc as e_tour } from "./entries/tour/doc";
import { doc as e_tree } from "./entries/tree/doc";
import { doc as e_uptime } from "./entries/uptime/doc";
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
    "order": 9,
    "name": "account-menu",
    "title": "Account menu",
    "group": "Navigation",
    "description": "You, and what's yours: your dithered face that opens a menu with your name, email and plan, your pages with their shortcuts, light, dark or system, and Sign out set apart in red.",
    "added": "2026-10-30",
    "pro": true
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
    "order": 1,
    "name": "alert",
    "title": "Alert",
    "group": "Feedback",
    "description": "A note in the flow of the page in four tones, washed with its tone or bleeding in from the edge through a dither, with actions, that folds away when closed.",
    "added": "2026-10-23"
  },
  {
    "order": 22,
    "name": "allowance",
    "title": "Allowance",
    "group": "Data",
    "description": "How much of an allowance is used: the share, a bar that turns amber near the limit and red past it, and where the month is heading at this pace, hatched ahead. Folds to a ring for a sidebar's rail.",
    "added": "2026-10-30",
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
    "order": 2,
    "name": "banner",
    "title": "Banner",
    "group": "Feedback",
    "description": "The line across the top of a site, in ink or on paper, with a badge, a link whose arrow steps forward, messages that roll up in turn, and a close that remembers.",
    "added": "2026-10-29"
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
    "order": 22,
    "name": "bar-list",
    "title": "Bar list",
    "group": "Data",
    "description": "The top few of something, ranked, each over a slim bar whose dots thin through an ordered dither to a hard edge at its value, growing in one by one and gliding when the ranking changes.",
    "added": "2026-10-23"
  },
  {
    "order": 2,
    "name": "breadcrumb",
    "title": "Breadcrumb",
    "group": "Navigation",
    "description": "The path to the page, with a pill that glides from crumb to crumb, a long middle folded into one menu, and a caret that jumps to a level's siblings.",
    "added": "2026-10-23"
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
    "order": 56,
    "name": "chips",
    "title": "Chips",
    "group": "Forms",
    "description": "Filters as a row of chips that fill with ink as a check springs in, with counts, several or one at a time, a long tail folded into +N, and Clear once anything is on.",
    "added": "2026-10-23"
  },
  {
    "order": 57,
    "name": "code-block",
    "title": "Code block",
    "group": "Display",
    "description": "Code on a card with its file's name or tabs for each package manager, colored in the theme's own hues, long lines wrapping on a hanging indent, marked lines, and a copy that turns to a check.",
    "added": "2026-10-23"
  },
  {
    "order": 63,
    "name": "code-diff",
    "title": "Code diff",
    "group": "Display",
    "description": "Two versions of a file, unified or side by side: the words that changed marked inside each line, the code still in color, quiet stretches folded to a row that opens, and a count whose cells mix through a dither.",
    "added": "2026-10-29",
    "pro": true
  },
  {
    "order": 53,
    "name": "code-input",
    "title": "Code input",
    "group": "Forms",
    "description": "A one-time code a cell at a time: typing moves along, a paste or a phone's autofill fills them all, and a wrong code shakes."
  },
  {
    "order": 65,
    "name": "color-picker",
    "title": "Color picker",
    "group": "Forms",
    "description": "A field of saturation and brightness, hue and alpha sliders, an eyedropper, a value typed as hex, rgb or hsl, swatches, and the contrast white and black text would have on the color.",
    "added": "2026-10-29",
    "pro": true
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
    "order": 56,
    "name": "compare-slider",
    "title": "Compare slider",
    "group": "Display",
    "description": "Two versions of one thing split by a line you drag: press anywhere and it springs there, arrow keys step it, and each side's name steps aside as the line comes near.",
    "added": "2026-10-23"
  },
  {
    "order": 43,
    "name": "consent",
    "title": "Consent",
    "group": "Overlays",
    "description": "Asking about cookies fairly: Reject all and Accept all set the same, Customize opening to a switch for each kind, the choice kept and read back, and a way to ask again.",
    "added": "2026-10-29"
  },
  {
    "order": 41,
    "name": "context-menu",
    "title": "Context menu",
    "group": "Overlays",
    "description": "The actions for a thing, opened where you right-click it: grows from the pointer, turns to stay on screen, opens submenus beside their row, and runs from the keyboard with Shift+F10.",
    "added": "2026-10-29"
  },
  {
    "order": 2,
    "name": "copy-button",
    "title": "Copy button",
    "group": "Actions",
    "description": "Copies a piece of text, its icon turning over into a check as a ring spreads from it."
  },
  {
    "order": 59,
    "name": "countdown",
    "title": "Countdown",
    "group": "Display",
    "description": "The time left until a launch or a sale's end, on raised tiles or inline, each digit rolling down as it turns over, and handing over to what you say at zero.",
    "added": "2026-10-29"
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
    "order": 55,
    "name": "dither-image",
    "title": "Dither image",
    "group": "Display",
    "description": "Any picture printed as an ordered dither, in ink, as round halftone dots or in its own colors stepped down, that develops into view and shows the photo through a dissolve.",
    "added": "2026-10-23",
    "pro": true
  },
  {
    "order": 8,
    "name": "dock",
    "title": "Dock",
    "group": "Navigation",
    "description": "A frosted dock of brushed-metal keys that swell on their own springs as the pointer nears, with a name rising over the one you're on, dots under the open ones, a hop when pressed, and the arrow keys to walk it.",
    "added": "2026-10-30",
    "pro": true
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
    "order": 40,
    "name": "filter-bar",
    "title": "Filter bar",
    "group": "Forms",
    "description": "Filters that read as a sentence you edit in place: Showing deploys where status is not failed and region is Frankfurt or Tokyo. Every dashed word answers a click, and the keys drive it all.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 85,
    "name": "flow",
    "title": "Flow",
    "group": "Patterns",
    "description": "A node editor on a dotted board that pans and zooms: steps that snap to the grid, curves you draw from an output to the input they snap to, data visibly flowing into the step that's running, a minimap, and undo.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 35,
    "name": "funnel",
    "title": "Funnel",
    "group": "Data",
    "description": "How many make it from step to step: bars that rise in turn, the ones lost dissolving above each through a dither or held as a faint wash, a band carrying the flow, and what each step kept.",
    "added": "2026-10-23",
    "pro": true
  },
  {
    "order": 21,
    "name": "gauge",
    "title": "Gauge",
    "group": "Data",
    "description": "A reading against its limit as a dial of dots, filling in ink or in the tone of its zone, its edge dithered and springing to the value as the number counts along.",
    "added": "2026-10-23"
  },
  {
    "order": 37,
    "name": "globe",
    "title": "Globe",
    "group": "Data",
    "description": "The Earth in dots, lit and shaded by an ordered dither, that spins when dragged and coasts to a stop, with markers that pulse, arcs that rise between them carrying a light, and a turn to face whatever you choose.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 33,
    "name": "heatmap",
    "title": "Heatmap",
    "group": "Data",
    "description": "A year of activity a day at a time, each day's cell shaded by an ordered dither instead of a fade, fitting as many weeks as it has room for, with a card for any day by pointer or keys.",
    "added": "2026-10-23",
    "pro": true
  },
  {
    "order": 1,
    "name": "hold-button",
    "title": "Hold button",
    "group": "Actions",
    "description": "Press and hold to confirm: a dial winds closed and the time left counts down as the button sinks under your finger, and letting go early unwinds it."
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
    "title": "Edit in place",
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
    "order": 42,
    "name": "lightbox",
    "title": "Lightbox",
    "group": "Overlays",
    "description": "Thumbnails that open into a dark viewer, each photo growing out of its thumbnail without stretching, moved by arrows, swipes or keys, and shrinking back where it came from.",
    "added": "2026-10-29"
  },
  {
    "order": 86,
    "name": "live-cursors",
    "title": "Live cursors",
    "group": "Patterns",
    "description": "Everyone else's pointer, gliding on a spring with their name, the box they've selected and what they're saying in a bubble; press / to say something at your own, and follow anyone from the faces above.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 36,
    "name": "log-viewer",
    "title": "Log viewer",
    "group": "Data",
    "description": "Log lines as they stream in: errors and warnings marked down the edge, chips that filter by level with counts, a search that narrows and marks, lines that open to their fields, and a pill back to the newest.",
    "added": "2026-10-29",
    "pro": true
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
    "order": 20,
    "name": "metric-tabs",
    "title": "Metric tabs",
    "group": "Data",
    "description": "The figures that matter as tabs across a card, each with how far it moved and whether that's good news, and under them the chart for the one you pick, an ink rule sliding between them.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 6,
    "name": "navigation-menu",
    "title": "Navigation menu",
    "group": "Navigation",
    "description": "A site's top navigation with one panel that travels between its menus, gliding across and resizing to each one's content as it slides in the way you went, with a caret that follows.",
    "added": "2026-10-23",
    "pro": true
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
    "title": "First steps",
    "group": "Patterns",
    "description": "A new account's first steps in a card that keeps count: a ring that fills, ticks that draw in, the next step opening on its own, a pill to fold it into, and a finish that blooms.",
    "pro": true
  },
  {
    "order": 3,
    "name": "pagination",
    "title": "Pagination",
    "group": "Navigation",
    "description": "Pages of a long list, the current one inked on a pill that slides, a row that keeps its length as you go, and numbers that roll the way you went.",
    "added": "2026-10-23"
  },
  {
    "order": 65,
    "name": "particle-text",
    "title": "Particle text",
    "group": "Display",
    "description": "A word made of ink pixels, lit from above through an ordered dither, that scatter from your pointer and settle back, and sweep from one word into the next.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 55,
    "name": "password-field",
    "title": "Password field",
    "group": "Forms",
    "description": "A password that helps as you type: an eye to show it, a four-step meter with a word for how strong, rules that tick as they're met, and a word when Caps Lock is on.",
    "added": "2026-10-23"
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
    "title": "Panes",
    "group": "Display",
    "description": "Two panels and a line between them that catches at sizes you come back to, folds a side away, and springs home on a double-click."
  },
  {
    "order": 21,
    "name": "roadmap",
    "title": "Roadmap",
    "group": "Data",
    "description": "Work laid out over the weeks it takes, in groups, with today ruled in ink: drag a bar to move it or an end to stretch it, snapping to days, and see at a glance what's planned, under way, at risk or done.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 80,
    "name": "scheduler",
    "title": "Scheduler",
    "group": "Patterns",
    "description": "Booking a time: who and what, a month whose open days are lit with a pill that glides to the one you pick, the day's times splitting into a Confirm, and a confirmation with a check that draws and an .ics.",
    "added": "2026-10-29",
    "pro": true
  },
  {
    "order": 58,
    "name": "scroll-area",
    "title": "Scroll area",
    "group": "Display",
    "description": "A box that scrolls the browser's way with a quieter bar that wakes when you need it, and edges that fade, by gradient or by dither, only while there's more past them.",
    "added": "2026-10-29"
  },
  {
    "order": 3,
    "name": "segmented",
    "title": "Segmented",
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
    "order": 30,
    "name": "share",
    "title": "Share",
    "group": "Overlays",
    "description": "Share, link first: who can open it and the link to copy lead, the faces of those invited open into their access, and new people are invited by email at the foot.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 2,
    "name": "sheet",
    "title": "Sheet",
    "group": "Overlays",
    "description": "A panel that floats in from an edge with the page still in view, and from the bottom, a phone's sheet with a grip to drag it away."
  },
  {
    "order": 90,
    "name": "sign-in",
    "title": "Sign-in",
    "group": "Patterns",
    "description": "Signing in, in two short steps: a provider in one click with the last one used tagged, or an email then a password or a six-digit code that fills from a paste, and a split layout beside art in a dither.",
    "added": "2026-10-29",
    "pro": true
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
    "order": 23,
    "name": "sparkline",
    "title": "Sparkline",
    "group": "Data",
    "description": "A trend in the space of a word: a smooth line that draws in, a wash under it that fades or thins as dots, and a dot on the latest value that can pulse while it's live.",
    "added": "2026-10-23"
  },
  {
    "order": 50,
    "name": "spinner",
    "title": "Spinner",
    "group": "Feedback",
    "description": "A ring of dots with a crest that sweeps around it, its tail dissolving through an ordered dither."
  },
  {
    "order": 4,
    "name": "split-button",
    "title": "Split button",
    "group": "Actions",
    "description": "One action and its alternatives, the way a merge button works: pick another from the caret and it takes the pill's place, its name rolling in, ready for the next press.",
    "added": "2026-10-23"
  },
  {
    "order": 66,
    "name": "split-flap",
    "title": "Split-flap",
    "group": "Display",
    "description": "Letters on hinged flaps, the way a departures board turns over: each one flips forward through the alphabet to its letter, the top half falling and shading as it goes, rippling along the word.",
    "added": "2026-10-30",
    "pro": true
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
    "order": 64,
    "name": "swipe-deck",
    "title": "Swipe deck",
    "group": "Display",
    "description": "A stack of cards to decide on one at a time: the top one tilts with your hand as it leans, flies off past the line or on a flick, and comes back with Undo.",
    "added": "2026-10-30",
    "pro": true
  },
  {
    "order": 2,
    "name": "switch",
    "title": "Switch",
    "group": "Forms",
    "description": "A recessed track that fills with ink, and a bead for a knob that stretches while you press it."
  },
  {
    "order": 5,
    "name": "table-of-contents",
    "title": "Table of contents",
    "group": "Navigation",
    "description": "A long page's sections with an ink bar that slides to the one you're reading, the ones you've passed a shade darker, and links that glide there without a jump.",
    "added": "2026-10-23"
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
    "order": 64,
    "name": "time-picker",
    "title": "Time picker",
    "group": "Forms",
    "description": "A time typed the way you'd say it or picked from a list in steps, scrolled to the one you have, each time saying how long after the start it is.",
    "added": "2026-10-29"
  },
  {
    "order": 54,
    "name": "timeline",
    "title": "Timeline",
    "group": "Display",
    "description": "An activity log: times in a gutter, one rail through raised beads for what matters and small rings for the rest, days gathered, comments in bubbles, new events sliding in on top.",
    "added": "2026-10-23"
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
    "order": 61,
    "name": "tour",
    "title": "Tour",
    "group": "Overlays",
    "description": "A walk through a screen one thing at a time: the page dims, a window opens over the thing and glides to the next taking its shape, with a card that goes to the side with room.",
    "added": "2026-10-23",
    "pro": true
  },
  {
    "order": 4,
    "name": "tree",
    "title": "Tree",
    "group": "Navigation",
    "description": "Folders that spring open beside a guide line, darker along the branch to the chosen row, which rides a pill that glides; run by the keyboard like a file tree.",
    "added": "2026-10-23",
    "pro": true
  },
  {
    "order": 34,
    "name": "uptime",
    "title": "Uptime",
    "group": "Data",
    "description": "A service's days as slim bars, a bad day mixed amber or red through an ordered dither in proportion to how much went wrong, with its incidents a point away.",
    "added": "2026-10-23",
    "pro": true
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
  "account-menu": e_accountMenu,
  "action-bar": e_actionBar,
  "ai-chat": e_aiChat,
  "alert": e_alert,
  "allowance": e_allowance,
  "app-sidebar": e_appSidebar,
  "area-chart": e_areaChart,
  "avatar": e_avatar,
  "badge": e_badge,
  "banner": e_banner,
  "bar-chart": e_barChart,
  "bar-list": e_barList,
  "breadcrumb": e_breadcrumb,
  "button": e_button,
  "card": e_card,
  "carousel": e_carousel,
  "checkbox": e_checkbox,
  "chips": e_chips,
  "code-block": e_codeBlock,
  "code-diff": e_codeDiff,
  "code-input": e_codeInput,
  "color-picker": e_colorPicker,
  "combobox": e_combobox,
  "command": e_command,
  "command-line": e_commandLine,
  "compare-slider": e_compareSlider,
  "consent": e_consent,
  "context-menu": e_contextMenu,
  "copy-button": e_copyButton,
  "countdown": e_countdown,
  "data-table": e_dataTable,
  "date-picker": e_datePicker,
  "dialog": e_dialog,
  "dither-image": e_ditherImage,
  "dock": e_dock,
  "donut-chart": e_donutChart,
  "empty-state": e_emptyState,
  "field": e_field,
  "file-drop": e_fileDrop,
  "filter-bar": e_filterBar,
  "flow": e_flow,
  "funnel": e_funnel,
  "gauge": e_gauge,
  "globe": e_globe,
  "heatmap": e_heatmap,
  "hold-button": e_holdButton,
  "hover-card": e_hoverCard,
  "inbox": e_inbox,
  "inline-edit": e_inlineEdit,
  "input": e_input,
  "kanban-board": e_kanbanBoard,
  "kbd": e_kbd,
  "lightbox": e_lightbox,
  "live-cursors": e_liveCursors,
  "log-viewer": e_logViewer,
  "marquee": e_marquee,
  "menu": e_menu,
  "meter": e_meter,
  "metric-tabs": e_metricTabs,
  "navigation-menu": e_navigationMenu,
  "number": e_number,
  "number-field": e_numberField,
  "onboarding": e_onboarding,
  "pagination": e_pagination,
  "particle-text": e_particleText,
  "password-field": e_passwordField,
  "popover": e_popover,
  "pricing-table": e_pricingTable,
  "radio-group": e_radioGroup,
  "resizable": e_resizable,
  "roadmap": e_roadmap,
  "scheduler": e_scheduler,
  "scroll-area": e_scrollArea,
  "segmented": e_segmented,
  "select": e_select,
  "share": e_share,
  "sheet": e_sheet,
  "sign-in": e_signIn,
  "skeleton": e_skeleton,
  "slider": e_slider,
  "sortable-list": e_sortableList,
  "sparkline": e_sparkline,
  "spinner": e_spinner,
  "split-button": e_splitButton,
  "split-flap": e_splitFlap,
  "stat": e_stat,
  "stepper": e_stepper,
  "swipe-deck": e_swipeDeck,
  "switch": e_switch,
  "table-of-contents": e_tableOfContents,
  "tabs": e_tabs,
  "tag-input": e_tagInput,
  "textarea": e_textarea,
  "theme-toggle": e_themeToggle,
  "time-picker": e_timePicker,
  "timeline": e_timeline,
  "toast": e_toast,
  "toolbar": e_toolbar,
  "tooltip": e_tooltip,
  "tour": e_tour,
  "tree": e_tree,
  "uptime": e_uptime,
  "wizard": e_wizard,
};
