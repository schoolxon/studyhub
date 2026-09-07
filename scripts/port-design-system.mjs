import fs from "node:fs";
import path from "node:path";

const srcPath = "E:\\Node_project\\waste_management\\src\\app\\globals.css";
const destPath = "E:\\Node_project\\libraryHub\\src\\index.css";

const src = fs.readFileSync(srcPath, "utf8");
const idx = src.indexOf(":root {");
if (idx < 0) throw new Error("no :root");
let rest = src.slice(idx);

const oldBase = `@layer base {
  * {
    @apply border-border outline-ring/50;
    box-sizing: border-box;
  }
  body {
    @apply bg-background text-foreground;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  html {
    @apply font-sans;
  }`;

const newBase = `@layer base {
  * {
    box-sizing: border-box;
    border-color: var(--border);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  html {
    font-family: "Rubik", sans-serif;
  }`;

if (!rest.includes(oldBase)) throw new Error("base block not found");
rest = rest.replace(oldBase, newBase);

const header = `/* StudyHub design system — copied from waste_management (SwachhTrack).
   Palette: Forest Green / Lime / Civic Blue. Tokens + vanilla .ui-* classes.
   Tailwind v4 utilities stay available for layout (flex, gap, etc.). */
@import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: "Rubik", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-heading: "Rubik", sans-serif;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

`;

fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, header + rest, "utf8");
console.log("wrote", destPath, "bytes", Buffer.byteLength(header + rest));
