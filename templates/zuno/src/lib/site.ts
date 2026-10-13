/* One source of truth for the site map: nav menus, footer columns and page breadcrumbs. */

export interface NavItem {
  href: string;
  label: string;
  desc?: string;
}

export const PRODUCT: NavItem[] = [
  { href: "/autopilot", label: "Autopilot", desc: "Portfolios that rebalance themselves" },
  { href: "/copilot", label: "Copilot", desc: "Ask anything about your money" },
  { href: "/tax-loss-harvesting", label: "Tax-loss harvesting", desc: "Turn market dips into tax savings" },
  { href: "/cash", label: "Cash", desc: "4.10% APY, FDIC-insured" },
  { href: "/crypto", label: "Crypto", desc: "Bitcoin and Ethereum, with a cap" },
  { href: "/retirement", label: "Retirement", desc: "Traditional, Roth and SEP IRAs" },
];

export const COMPANY: NavItem[] = [
  { href: "/about", label: "About", desc: "Why we built Zuno" },
  { href: "/careers", label: "Careers", desc: "11 open roles" },
  { href: "/press", label: "Press", desc: "News and brand assets" },
  { href: "/blog", label: "Blog", desc: "Notes on money and markets" },
  { href: "/contact", label: "Contact", desc: "Talk to a human" },
];

export const RESOURCES: NavItem[] = [
  { href: "/help", label: "Help center" },
  { href: "/security", label: "Security" },
  { href: "/fees", label: "Pricing & fees" },
  { href: "/status", label: "System status" },
  { href: "/developers", label: "Developers" },
];

export const LEGAL: NavItem[] = [
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/disclosures", label: "Disclosures" },
  { href: "/legal/form-crs", label: "Form CRS" },
  { href: "/legal/accessibility", label: "Accessibility" },
];

export type TopLink = { label: string; href: string } | { label: string; menu: NavItem[]; id: string };

export const TOP_NAV: TopLink[] = [
  { label: "Product", menu: PRODUCT, id: "product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Company", menu: COMPANY, id: "company" },
  { label: "Help", href: "/help" },
];

export const FOOTER_COLUMNS = [
  { title: "Product", links: [...PRODUCT.map(({ href, label }) => ({ href, label })), { href: "/pricing", label: "Pricing" }] },
  { title: "Company", links: COMPANY.map(({ href, label }) => ({ href, label })) },
  { title: "Resources", links: RESOURCES },
  { title: "Legal", links: LEGAL },
];
