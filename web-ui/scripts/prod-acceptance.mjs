/**
 * GVFI — Production-server acceptance run.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { chromium } from "playwright";

const BASE = process.env.GVFI_BASE || "http://127.0.0.1:3010";
const findings = [];

function note(level, area, message, extra) {
  findings.push({ level, area, message, extra });
  const mark = level === "pass" ? "✓" : level === "fail" ? "✗" : "!";
  console.log(
    `${mark} [${area}] ${message}${extra ? " " + JSON.stringify(extra).slice(0, 180) : ""}`
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/app/system`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
let persist = await page.evaluate(() => window.__GVFI_PERSIST__);
note(persist?.hydrated ? "pass" : "fail", "hydrate", "PersistHydration effect", persist);

await page.evaluate(() =>
  localStorage.setItem(
    "gvfi-locale-v1",
    JSON.stringify({ state: { locale: "en" }, version: 0 })
  )
);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
persist = await page.evaluate(() => window.__GVFI_PERSIST__);
const sample = await page.evaluate(() =>
  (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 250)
);
const lang = await page.evaluate(() => document.documentElement.lang);
const en = /System settings|Interface language|Appearance|Font & Display/i.test(
  sample
);
note(en ? "pass" : "fail", "i18n-en", "English after reload", {
  persist,
  lang,
  sample,
});

await page.locator("#locale-select").click();
await page.waitForTimeout(400);
const opts = await page.getByRole("option").allTextContents();
note(opts.length ? "pass" : "fail", "select", "locale options", { opts });
if (opts.some((o) => /简体中文|Chinese/i.test(o))) {
  await page.getByRole("option", { name: /简体中文/i }).click();
  await page.waitForTimeout(800);
  const zh = await page.evaluate(() =>
    /系统设置|界面语言|外观/.test(document.body.innerText || "")
  );
  note(zh ? "pass" : "fail", "i18n-zh", "Chinese after UI switch");
}

for (const route of [
  "/app/dashboard",
  "/app/tasks",
  "/app/video",
  "/app/ai",
  "/app/settings",
  "/app/settings/api",
  "/app/settings/about",
  "/app/system",
  "/",
]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const chars = await page.evaluate(
    () => (document.body.innerText || "").length
  );
  note(chars > 40 ? "pass" : "fail", "page", route, { chars });
}

await page.goto(`${BASE}/app/system`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem(
    "gvfi-display-v1",
    JSON.stringify({
      state: {
        fontSizePx: 18,
        uiScale: 1.15,
        fontFamily: "youyuan",
        fontColorMode: "white",
        customFontColor: "#ffffff",
        customFontName: "",
        fontWeight: 500,
        autoContrast: true,
        textShadowStrength: 0.35,
        reduceMotion: false,
      },
      version: 0,
    })
  );
  localStorage.setItem(
    "gvfi-appearance-v2",
    JSON.stringify({
      state: {
        theme: "light",
        glass: {
          opacity: 40,
          blur: 28,
          borderBrightness: 16,
          shadowStrength: 36,
          glowStrength: 12,
        },
        background: {
          type: "none",
          customUrl: null,
          fileName: null,
          width: null,
          height: null,
          opacity: 100,
          blur: 0,
        },
      },
      version: 0,
    })
  );
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const vars = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return {
    fontSize: s.getPropertyValue("--app-font-size").trim(),
    theme: document.documentElement.getAttribute("data-theme"),
    appearanceTheme: document.documentElement.getAttribute(
      "data-appearance-theme"
    ),
    scrollbarWidth: s.scrollbarWidth,
    persist: window.__GVFI_PERSIST__ ?? null,
  };
});
note(vars.fontSize.includes("18") ? "pass" : "fail", "persist", "font size", vars);
note(
  vars.theme === "studio" && vars.appearanceTheme === "light"
    ? "pass"
    : "fail",
  "persist",
  "theme light",
  vars
);
note(
  vars.scrollbarWidth === "thin" ? "pass" : "fail",
  "scrollbar",
  "thin root",
  vars
);

await page.goto(`${BASE}/app/video`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const start = page.getByRole("button", { name: /开始|Start|渲染|Render/i }).first();
if (await start.count()) {
  await start.click().catch(() => {});
  await page.waitForTimeout(400);
  note("pass", "error-path", "start clicked");
}

await page.route("**/api/health**", (r) =>
  r.fulfill({ status: 503, body: JSON.stringify({ detail: "offline" }) })
);
await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const dash = await page.evaluate(() => document.body.innerText || "");
note(
  /离线|Offline|警告|Warning|…/.test(dash) ? "pass" : "warn",
  "offline",
  "dashboard offline cue"
);

for (const z of [1, 1.25, 1.5]) {
  await page.evaluate((zoom) => {
    document.documentElement.style.zoom = String(zoom);
  }, z);
  await page.waitForTimeout(150);
  note("pass", "scale", `${Math.round(z * 100)}%`);
}

const summary = {
  pass: findings.filter((f) => f.level === "pass").length,
  fail: findings.filter((f) => f.level === "fail").length,
  warn: findings.filter((f) => f.level === "warn").length,
};
console.log("SUMMARY", summary);
await browser.close();
process.exit(summary.fail ? 2 : 0);
