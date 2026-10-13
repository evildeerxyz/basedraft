/*
 * The company pello is shown running: Fieldwork, 214 people in six teams and four countries (the
 * US, the UK, Germany and Canada). Every name, number and request on the site comes from here, so
 * the hero, the feed and the product shots agree.
 */

export type TeamId = "people" | "engineering" | "design" | "sales" | "support" | "finance";

export interface Team {
  id: TeamId;
  name: string;
  /** A hue for the team's ring in the org graph and its avatars. */
  hue: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  team: TeamId;
  lead?: boolean;
  /** Days off left this year, of 25. */
  daysLeft: number;
  location: string;
}

export const TEAMS: Team[] = [
  { id: "people", name: "People", hue: "#2f5bff" },
  { id: "engineering", name: "Engineering", hue: "#5b6cff" },
  { id: "design", name: "Design", hue: "#8b5cf6" },
  { id: "sales", name: "Sales", hue: "#0ea5a4" },
  { id: "support", name: "Support", hue: "#12a36d" },
  { id: "finance", name: "Finance", hue: "#64748b" },
];

const p = (id: string, name: string, role: string, team: TeamId, daysLeft: number, location: string, lead = false): Person => ({ id, name, role, team, daysLeft, location, lead });

export const PEOPLE: Person[] = [
  p("hannah", "Hannah Becker", "Head of People", "people", 14, "Berlin", true),
  p("iris", "Iris Novak", "People Partner", "people", 18, "Berlin"),
  p("tom", "Tom Ellis", "Recruiter", "people", 9, "London"),
  p("oliver", "Oliver Grant", "Engineering Lead", "engineering", 11, "London", true),
  p("leo", "Leo Marsh", "Backend Engineer", "engineering", 25, "London"),
  p("priya", "Priya Shah", "Staff Engineer", "engineering", 7, "Toronto"),
  p("daniel", "Daniel Kim", "Platform Engineer", "engineering", 16, "Toronto"),
  p("noah", "Noah Fischer", "Mobile Engineer", "engineering", 12, "Berlin"),
  p("clara", "Clara Jensen", "Frontend Engineer", "engineering", 20, "Hamburg"),
  p("ravi", "Ravi Mehta", "Data Engineer", "engineering", 5, "New York"),
  p("mei", "Mei Lin", "Design Lead", "design", 13, "New York", true),
  p("julia", "Julia Costa", "Product Designer", "design", 17, "Munich"),
  p("ethan", "Ethan Brooks", "Brand Designer", "design", 21, "New York"),
  p("ava", "Ava Thompson", "Researcher", "design", 10, "London"),
  p("marco", "Marco Ricci", "Sales Lead", "sales", 8, "New York", true),
  p("grace", "Grace Walsh", "Account Executive", "sales", 15, "Manchester"),
  p("lucas", "Lucas Meyer", "Account Executive", "sales", 19, "Berlin"),
  p("sofia", "Sofia Moreau", "Sales Engineer", "sales", 6, "Chicago"),
  p("ben", "Ben Carter", "Partnerships", "sales", 22, "Austin"),
  p("nina", "Nina Kowalski", "Support Lead", "support", 12, "Berlin", true),
  p("jack", "Jack Turner", "Support Specialist", "support", 18, "London"),
  p("zoe", "Zoe Adams", "Support Specialist", "support", 9, "Austin"),
  p("hugo", "Hugo Laurent", "Onboarding Specialist", "support", 14, "Vancouver"),
  p("arjun", "Arjun Rao", "Finance Lead", "finance", 11, "London", true),
  p("emma", "Emma Schultz", "Payroll Specialist", "finance", 16, "Berlin"),
  p("felix", "Felix Wagner", "Controller", "finance", 20, "Munich"),
];

export const personOf = (id: string) => PEOPLE.find((x) => x.id === id)!;
export const teamOf = (id: TeamId) => TEAMS.find((t) => t.id === id)!;
export const leadOf = (team: TeamId) => PEOPLE.find((x) => x.team === team && x.lead)!;
export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
export const firstName = (name: string) => name.split(" ")[0];

export const COMPANY = { name: "Fieldwork", people: 214, countries: 4 };
