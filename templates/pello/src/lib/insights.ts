import { TEAMS, firstName, leadOf, type TeamId } from "./people";

/*
 * A year of Fieldwork, by team: headcount, time off taken and overtime, and the note pello writes
 * about it. The "Insights" card in components/home/features.tsx draws them.
 */

export const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
export type Metric = "headcount" | "timeoff" | "overtime";
export const METRICS: Array<{ id: Metric; label: string; unit: string }> = [
  { id: "headcount", label: "Headcount", unit: "people" },
  { id: "timeoff", label: "Time off", unit: "days" },
  { id: "overtime", label: "Overtime", unit: "hours" },
];

// Start and end of the year for each team; the months between are filled in smoothly.
const HEAD: Record<TeamId, [number, number]> = { people: [8, 10], engineering: [70, 84], design: [20, 24], sales: [44, 48], support: [33, 36], finance: [11, 12] };
// Time off by month, as a share of the year's average: December and summer are high.
const SEASON = [0.8, 1.7, 0.7, 0.8, 0.9, 1.1, 1.0, 1.2, 1.6, 1.7, 0.9, 0.8];
// Overtime per person per month, and how it moves: engineering's has climbed since July.
const OVER: Record<TeamId, number[]> = {
  people: [1.1, 1.4, 1, 1, 1.2, 1, 0.9, 1, 0.8, 0.7, 1.2, 1.1],
  engineering: [1.6, 1.2, 1.4, 1.5, 1.4, 1.6, 1.5, 1.7, 1.8, 2.1, 2.5, 2.9],
  design: [1, 0.8, 1, 1.1, 1, 1.2, 1.1, 1, 0.9, 0.8, 1, 1.1],
  sales: [1.5, 2.2, 0.9, 1.1, 1.6, 1.2, 1.3, 1.6, 1, 0.9, 1.4, 1.8],
  support: [1.4, 2.4, 1.6, 1.2, 1.1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.2, 1.1],
  finance: [1.2, 2.6, 2.2, 1, 1.1, 1.8, 1, 1, 1.1, 1, 1.2, 1.4],
};

function headcount(t: TeamId) {
  const [a, z] = HEAD[t];
  return MONTHS.map((_, i) => Math.round(a + (z - a) * (i / 11) ** 0.9));
}
export function seriesOf(team: TeamId | "all", metric: Metric): number[] {
  const teams = team === "all" ? TEAMS.map((t) => t.id) : [team];
  return MONTHS.map((_, i) =>
    teams.reduce((sum, t) => {
      const h = headcount(t)[i];
      if (metric === "headcount") return sum + h;
      if (metric === "timeoff") return sum + Math.round(h * 2.1 * SEASON[i]);
      return sum + Math.round(h * OVER[t][i] * 1.4);
    }, 0),
  );
}

export function noteOf(team: TeamId | "all", metric: Metric, s: number[]) {
  const name = team === "all" ? "Fieldwork" : TEAMS.find((t) => t.id === team)!.name;
  const last = s[11];
  if (metric === "headcount") return `${name} went from ${s[0]} to ${last} people in twelve months. ${team === "engineering" ? "Two more engineers start in November, and both have a laptop on the way." : "Nobody left in October, and the open roles are on track for January."}`;
  if (metric === "timeoff") {
    const prior = Math.round((s[7] + s[8] + s[9]) / 3);
    const quiet = team === "all" ? 11 : Math.max(1, Math.round(s[11] / 40));
    return `${name} took ${last} days off in October, against ${prior} a month over the summer. ${quiet} ${quiet === 1 ? "person hasn't" : "people haven't"} taken a day since June, and their managers have a reminder.`;
  }
  const change = Math.round(((last - s[8]) / s[8]) * 100);
  const lead = team === "all" ? "Hannah" : firstName(leadOf(team).name);
  return change > 15
    ? `Overtime in ${name} is up ${change}% since July. ${team === "all" ? "Most of it is in Engineering." : "Three people are above 48 hours this month."} ${lead} has the details.`
    : `Overtime in ${name} is ${change >= 0 ? `up ${change}%` : `down ${-change}%`} since July, which is about normal for the time of year. Nothing needs a look.`;
}

