/** Every internal destination, so nav, footer and the command menu agree. */
export const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
  { href: "/blog", label: "Blog" },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/download", label: "Download" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
      { href: "/docs", label: "Docs" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Blog" },
      { href: "/brand", label: "Brand" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/security", label: "Security" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/dpa", label: "DPA" },
    ],
  },
];

// Placeholder community URLs: point these at the real accounts.
export const SOCIAL_LINKS = {
  github: "https://github.com/",
  x: "https://x.com/",
  discord: "https://discord.com/",
};
