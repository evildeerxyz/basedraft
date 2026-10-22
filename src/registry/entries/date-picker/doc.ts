import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { DatePicker } from "@basedraft/ui";

export function PublishOn() {
  const [on, setOn] = useState<Date | null>(null);
  return (
    <DatePicker
      label="Publish the site on"
      value={on}
      onValueChange={setOn}
      min={new Date()}
    />
  );
}`,
  use: [
    "For a day, or a range of days, close enough that seeing the month helps: a publish date, a trial, a booking.",
    "When some days can't be chosen: before today, past a deadline, weekends, booked days.",
    "Calendar on its own, in a card or a panel, when the month should always be in view.",
  ],
  avoid: [
    "For a birthday or a date years away: three fields (or an Input with a pattern) are quicker than paging back through months.",
    "For a time of day: the calendar has no hours; pair it with an Input or a Select.",
    "For a handful of named options like Today, Tomorrow, Next week: use Segmented control or Select.",
  ],
  parts: [
    {
      name: "DatePicker",
      note: "A field that opens Calendar in a card over the page, with Today and Clear at its foot. It takes all of Calendar's choosing props too.",
      props: [
        { name: "mode", type: '"single" | "range"', default: '"single"', note: "One day, or a range: the first press sets the start, the second the end." },
        { name: "value", type: "Date | null, or DateRange | null in range mode", note: "Controlled: the day, or { from, to }." },
        { name: "defaultValue", type: "Date | null, or DateRange | null in range mode", note: "Where it starts, uncontrolled." },
        { name: "onValueChange", type: "(day: Date | null) => void, or (range: DateRange | null) => void", note: "Called when a day is chosen or cleared; in range mode, once the end is chosen." },
        { name: "min", type: "Date", note: "The earliest day that can be chosen. Months before it can't be paged to." },
        { name: "max", type: "Date", note: "The latest day that can be chosen." },
        { name: "isDisabled", type: "(day: Date) => boolean", note: "Days that can't be chosen besides those outside min and max: weekends, booked days." },
        { name: "weekStartsOn", type: "0 | 1", default: "0", note: "Sunday or Monday first." },
        { name: "locale", type: "string", default: '"en-US"', note: "Names the months and days, and formats the field." },
        { name: "format", type: "Intl.DateTimeFormatOptions", default: '{ month: "short", day: "numeric", year: "numeric" }', note: "How the chosen day reads in the field." },
        { name: "placeholder", type: "string", default: '"Pick a day"', note: "Shown in the field while nothing is chosen." },
        { name: "clearable", type: "boolean", default: "true", note: "A cross in the field once something's chosen, and Clear at the card's foot." },
        { name: "label", type: "string", note: "Names the field and the card for screen readers; the field reads it with the chosen day." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "36 or 44px tall." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded, and it won't open." },
        { name: "name", type: "string", note: "With a name, a hidden input carries 2026-10-30, or a range as 2026-10-03/2026-10-09." },
        { name: "id", type: "string", note: "Goes on the field, so a <label htmlFor> can point at it. Field sets it for you." },
        { name: "className", type: "string", note: "Goes on the field, to size it. It's full width until you say otherwise." },
      ],
    },
    {
      name: "Calendar",
      note: "The month on its own: the same choosing props as DatePicker, without the field.",
      props: [
        { name: "mode, value, defaultValue, onValueChange", type: "as DatePicker", note: "One day or a range, controlled or not." },
        { name: "min, max, isDisabled, weekStartsOn, locale", type: "as DatePicker", note: "The days that can be chosen, and how the month reads." },
        { name: "defaultMonth", type: "Date", note: "The month it opens on. The chosen day's month, or this month, unless set." },
        { name: "autoFocus", type: "boolean", default: "false", note: "Puts focus on the chosen day, or today, as it appears. DatePicker sets it." },
        { name: "onDone", type: "() => void", note: "Called once a choice is complete: a day, or a range's end." },
        { name: "onPending", type: "(range: DateRange | null) => void", note: "In range mode, called with the range so far while it's being chosen, from the start to the day pointed at, and with null once it's complete. DatePicker counts its days at the card's foot." },
        { name: "className", type: "string", note: "Goes on the calendar. It's 280px wide." },
      ],
    },
    {
      name: "DateRange",
      note: "A range, as data.",
      props: [
        { name: "from", type: "Date", required: true, note: "The first day, inclusive." },
        { name: "to", type: "Date", required: true, note: "The last day, inclusive. Chosen before from, they're swapped." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One day, from today on",
      note: "Days before min are struck through and the months before it can't be paged to.",
      code: `<DatePicker
  label="Publish on"
  placeholder="Pick a day"
  min={new Date()}
  className="max-w-[260px]"
/>`,
    },
    {
      id: "range",
      title: "A range",
      note: "Press a start, and a band follows the pointer until you press the end.",
      code: `function Trial() {
  const [trial, setTrial] = useState<DateRange | null>({
    from: today,
    to: inTwoWeeks,
  });
  return (
    <DatePicker
      mode="range"
      label="Free trial"
      value={trial}
      onValueChange={setTrial}
      min={today}
      className="max-w-[300px]"
    />
  );
}`,
    },
    {
      id: "limits",
      title: "Weekdays in the next two weeks",
      note: "min, max and isDisabled together, with the week starting on Monday.",
      code: `<DatePicker
  label="Book a call"
  placeholder="A weekday in the next two weeks"
  min={tomorrow}
  max={inTwoWeeks}
  isDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
  weekStartsOn={1}
  className="max-w-[300px]"
/>`,
    },
    {
      id: "calendar",
      title: "Calendar on its own",
      note: "The month without the field, in a card of your own.",
      code: `<div className="rounded-[20px] bg-[var(--bd-surface)] p-3 shadow-[0_0_0_1px_var(--bd-line)]">
  <Calendar mode="range" defaultValue={{ from: inTwoDays, to: inSixDays }} />
</div>`,
    },
    {
      id: "small",
      title: "Small",
      code: `<DatePicker
  size="sm"
  label="Due"
  placeholder="Due date"
  defaultValue={nextWeek}
  className="max-w-[220px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space / ↓", does: "On the field: opens the card, with focus on the chosen day, or today, or the first day after it that can be chosen." },
    { keys: "← →", does: "The day before or after." },
    { keys: "↑ ↓", does: "The same day a week before or after." },
    { keys: "Page Up / Page Down", does: "The same day a month before or after; the month slides in from that side." },
    { keys: "Shift + Page Up / Page Down", does: "A year before or after." },
    { keys: "Home / End", does: "The first or last day of the week." },
    { keys: "Enter / Space", does: "Chooses the day; in range mode, the first sets the start and the second the end." },
    { keys: "Esc", does: "Closes the card and puts focus back on the field, from anywhere in it." },
  ],
  a11y: [
    "The field is a button with aria-haspopup dialog and aria-expanded, named by label and the chosen day. The card is a dialog named the same.",
    "The month is a grid of buttons, each named in full (Friday, October 30, 2026, today) and pressed when chosen. Only the focused day is a Tab stop; the arrows move between days.",
    "The month's name is a polite live region, so paging months is announced. Days that can't be chosen are disabled, not just faded.",
    "With reduced motion, months change in place rather than sliding, and the chosen circle doesn't glide.",
  ],
};
