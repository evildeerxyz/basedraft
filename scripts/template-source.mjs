/*
 * What a template's buyer gets: these files and folders at its root, and nothing else. The routes
 * that hand out a template (Download project, Send to GitHub) read only these, and a deployment
 * traces only these, so a template's installs, builds and local secrets never travel with it.
 * A template that grows a new top-level folder needs it added here, or it won't be in exports.
 */
export const TEMPLATE_FILES = [".gitignore", ".env.example", ".prettierrc.json", "AGENTS.md", "README.md", "LICENSE", "package.json", "next.config.ts", "tsconfig.json", "eslint.config.mjs", "postcss.config.mjs", "vercel.json"];
export const TEMPLATE_DIRS = ["src", "app", "components", "lib", "public", "assets", "docs", "scripts", ".github"];

/** The same list as globs, for next.config's outputFileTracingIncludes. */
export const TEMPLATE_GLOBS = [...TEMPLATE_FILES.map((f) => `./templates/*/${f}`), ...TEMPLATE_DIRS.map((d) => `./templates/*/${d}/**/*`)];
