/*
 * What basedraft sells on Whop. Each product's Whop plan (variant) id is set on the deployment,
 * e.g. WHOP_PLAN_ZUNO=plan_xxx. Pro and Team include every template.
 */
export const PRODUCTS = {
  zuno: { name: "Zuno", template: true, env: "WHOP_PLAN_ZUNO" },
  auren: { name: "Auren", template: true, env: "WHOP_PLAN_AUREN" },
  noma: { name: "Noma", template: true, env: "WHOP_PLAN_NOMA" },
  pro: { name: "basedraft Pro", template: false, env: "WHOP_PLAN_PRO" },
  team: { name: "basedraft Team", template: false, env: "WHOP_PLAN_TEAM" },
} as const;

export type Product = keyof typeof PRODUCTS;
export const isProduct = (p: string): p is Product => p in PRODUCTS;
/** The templates a set of products unlocks. */
export const TEMPLATES = ["zuno", "noma", "auren"] as const;
/** The templates whose code a set of products unlocks. */
export function unlocked(products: string[]) {
  const all = products.includes("pro") || products.includes("team");
  return TEMPLATES.filter((t) => all || products.includes(t));
}
