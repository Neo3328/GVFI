/**
 * GVFI — Acceptance scan (hardcoded UI Chinese / white chrome heuristics).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist-gvfi",
  "dist",
  "messages",
  "_asar-extract",
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(p, out);
    } else if (/\.(tsx?|jsx?|html|css)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function stripComments(line) {
  return line.replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "");
}

const files = walk(path.join(ROOT, "src")).concat(walk(path.join(ROOT, "electron")));
const zhHits = [];
const whiteHits = [];

const whiteRe =
  /\bbg-white\b|#ffffff\b|#fff\b|background:\s*white|background-color:\s*white|#f2f2f7|#f5f5f7|#fafafa|#eeeeee|#e8ecf4/i;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (rel.includes(`${path.sep}messages${path.sep}`)) continue;
  if (rel.endsWith("i18n.js") || rel.endsWith("catalog-labels.ts")) continue;

  const lines = fs.readFileSync(file, "utf8").split(/\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed.startsWith("//")) {
      return;
    }
    const code = stripComments(line);
    if (/[\u4e00-\u9fff]/.test(code)) {
      if (/match\(|\.test\(|replace\(|RegExp/.test(code)) return;
      if (/幼圆/.test(code) && !code.replace(/幼圆/g, "").match(/[\u4e00-\u9fff]/)) return;
      /* Splash tagline is locale-gated (zh vs en). */
      if (rel.endsWith(`splash.html`) && /AI 视频工作站/.test(code)) return;
      zhHits.push(`${rel}:${i + 1}: ${trimmed.slice(0, 160)}`);
    }
    if (whiteRe.test(code) && !/text-color|--text-strong|--app-text|--primary-foreground|color:\s*#fff|color:\s*#ffffff|#ffd0d8|#ff718d|#ff9f0a|#ff453a|#ff3b30|#ffd60a/.test(code)) {
      // skip intentional white text / glass edge highlights / comments
      if (/Never paint|never #|no milky|textColor|--app-text-color|--text-strong|--text-normal|foreground|customFontColor|border-color:\s*color-mix/.test(code + trimmed)) return;
      if (/color\s*=\s*[\"']#ffffff/.test(code)) return;
      if (/color:\s*#f[0-9a-f]{5}/i.test(code) && !/background|bg-|fill|panel/.test(code)) return;
      whiteHits.push(`${rel}:${i + 1}: ${trimmed.slice(0, 160)}`);
    }
  });
}

console.log("=== ZH UI literals (excl catalogs/comments/regex) ===");
console.log(zhHits.length ? zhHits.join("\n") : "(none)");
console.log("\n=== White / near-white chrome heuristics ===");
console.log(whiteHits.length ? whiteHits.join("\n") : "(none)");
console.log(`\nZH=${zhHits.length} WHITE=${whiteHits.length}`);
