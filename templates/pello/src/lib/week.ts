/*
 * Hannah's week, before pello and with it: the blocks in her calendar, by day and hour. The
 * "Before and after" card in components/home/features.tsx draws them.
 */

export type Kind = "admin" | "people" | "fixed" | "pello";
export interface Block {
  id: string;
  day: number;
  start: number;
  len: number;
  text: string;
  kind: Kind;
}

const b = (id: string, day: number, start: number, len: number, text: string, kind: Kind): Block => ({ id, day, start, len, text, kind });

const FIXED = [b("lead", 0, 10, 1, "Leadership meeting", "fixed"), b("standup", 2, 9, 1, "People team standup", "fixed")];

export const BEFORE: Block[] = [
  ...FIXED,
  b("inbox-mon", 0, 9, 1, "Leave requests inbox", "admin"),
  b("sheet", 0, 11, 2, "Fix the payroll sheet", "admin"),
  b("slack", 0, 13.5, 1, "Policy questions in Slack", "admin"),
  b("laptop", 0, 15, 1.5, "Chase IT for Leo's laptop", "admin"),
  b("hours", 1, 9, 1.5, "Copy hours into payroll", "admin"),
  b("iris", 1, 11, 1, "1:1 with Iris", "people"),
  b("offers", 1, 13, 2, "Offer letters", "admin"),
  b("benefits", 1, 15.5, 1.5, "Benefits questions", "admin"),
  b("receipts", 2, 10.5, 2, "Expense receipts", "admin"),
  b("interview", 2, 14, 1, "Interview: Staff Designer", "people"),
  b("checklists", 2, 15.5, 1.5, "Onboarding checklists", "admin"),
  b("changes", 3, 9, 2, "Payroll changes for Arjun", "admin"),
  b("calendar", 3, 11.5, 1, "Update the leave calendar", "admin"),
  b("contracts", 3, 14, 2, "Contract updates", "admin"),
  b("inbox-fri", 4, 9.5, 1, "Leave requests inbox", "admin"),
  b("checks", 4, 11, 1.5, "Check payroll by hand", "admin"),
  b("lunch", 4, 12.5, 1, "Team lunch", "people"),
  b("report", 4, 15, 1.5, "Weekly report", "admin"),
];

export const AFTER: Block[] = [
  ...FIXED,
  ...[0, 1, 3, 4].map((d) => b(`flags-${d}`, d, 9, 0.5, "pello's flagged items", "pello")),
  b("flags-2", 2, 10, 0.5, "pello's flagged items", "pello"),
  b("hiring", 0, 11, 1.5, "Hiring plan with Oliver", "people"),
  b("tom", 0, 14, 1, "1:1 with Tom", "people"),
  b("offsite", 0, 15.5, 1.5, "Plan the team offsite", "people"),
  b("iris", 1, 10, 1, "1:1 with Iris", "people"),
  b("training", 1, 11.5, 2, "Manager training", "people"),
  b("careers", 1, 14.5, 1.5, "Career talks", "people"),
  b("interview", 2, 11, 1, "Interview: Staff Designer", "people"),
  b("starters", 2, 12.5, 1.5, "Lunch with new starters", "people"),
  b("survey", 2, 15, 1.5, "Engagement survey results", "people"),
  b("comp", 3, 10, 2, "Pay review with Arjun", "people"),
  b("mei", 3, 13.5, 1, "Coffee with Mei", "people"),
  b("leo", 3, 15, 1, "Check in with Leo", "people"),
  b("approve", 4, 10, 0.5, "Approve payroll", "pello"),
  b("lunch", 4, 12.5, 1, "Team lunch", "people"),
  b("focus", 4, 14, 2.5, "Time to think", "people"),
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const FROM = 9;
export const TO = 17;

export const hours = (list: Block[], kinds: Kind[]) => list.filter((x) => kinds.includes(x.kind)).reduce((n, x) => n + x.len, 0);

