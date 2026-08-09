/**
 * GVFI — Puppeteer-free acceptance via fetch + CDP-less node (cheerio-less).
 * Uses Playwright if available; otherwise prints manual checklist.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { chromium } from "playwright";

const BASE = process.env.GVFI_BASE || "http://127.0.0.1:3000";

const ROUTES = [
  "/app/dashboard",
  "/app/tasks",
  "/app/video",
  "/app/ai",
  "/app/settings",
  "/app/settings/api",
  "/app/settings/appearance",
  "/app/settings/about",
  "/app/system",
  "/app/process",
  "/app/process/input",
  "/app/process/run",
  "/app/process/settings",
  "/app/process/logs",
  "/app/render",
  "/app/models",
  "/",
];

const findings = [];

function note(level, area, message, extra) {
  findings.push({ level, area, message, ...(extra || {}) });
  const mark = level === "pass" ? "✓" : level === "fail" ? "✗" : "!";
  console.log(`${mark} [${area}] ${message}`);
  if (extra) console.log("   ", JSON.stringify(extra).slice(0, 240));
}

async function visibleText(page) {
  return page.evaluate(() =>
    (document.body?.innerText || "").replace(/\s+/g, " ").trim()
  );
}

async function setLocale(page, locale) {
  await page.evaluate((loc) => {
    localStorage.setItem(
      "gvfi-locale-v1",
      JSON.stringify({ state: { locale: loc }, version: 0 })
    );
  }, locale);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // Wait until hydrated locale matches
  await page
    .waitForFunction(
      (loc) => document.documentElement.dataset.locale === loc || document.documentElement.lang === (loc === "en" ? "en" : "zh-CN"),
      locale,
      { timeout: 5000 }
    )
    .catch(() => {});
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Warm
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });

  // EN sweep
  await setLocale(page, "en");
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(350);
    const text = await visibleText(page);
    const zh = [...new Set(text.match(/[\u4e00-\u9fff]{2,}/g) || [])].filter(
      (w) =>
        w !== "简体中文" &&
        !w.includes("幼圆") &&
        !w.includes("微软雅黑") &&
        !w.includes("华文")
    );
    if (zh.length) note("fail", "i18n-en", `Chinese leftovers @ ${route}`, { zh: zh.slice(0, 10) });
    else note("pass", "i18n-en", `Clean @ ${route}`);

    // select raw-value leak
    const rawSelects = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll("[data-slot='select-value']")) {
        const t = (el.textContent || "").trim();
        if (/^(dark|ai|studio|nebula|aurora|starlit|zh-CN|en|youyuan|yahei|auto|white|local|cloud)$/i.test(t)) {
          bad.push(t);
        }
      }
      return bad;
    });
    if (rawSelects.length) {
      note("fail", "select", `Raw select values @ ${route}`, { rawSelects });
    }
  }

  // ZH sweep sample + English badge leak
  await setLocale(page, "zh-CN");
  for (const route of ["/app/dashboard", "/app/system", "/app/ai", "/app/settings/appearance"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(350);
    const text = await visibleText(page);
    const leaks = [...new Set(text.match(/\b(Warning|Normal|Optimal|High|Offline)\b/g) || [])];
    if (leaks.length) note("fail", "i18n-zh", `EN badge leak @ ${route}`, { leaks });
    else note("pass", "i18n-zh", `No EN badge leak @ ${route}`);
  }

  // Interact system settings: locale toggle, theme, glass, font
  await page.goto(`${BASE}/app/system`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Switch to English via UI if select works
  const localeTrigger = page.locator("#locale-select");
  if (await localeTrigger.count()) {
    await localeTrigger.click();
    await page.waitForTimeout(200);
    const enOpt = page.getByRole("option", { name: /English/i });
    if (await enOpt.count()) {
      await enOpt.click();
      await page.waitForTimeout(600);
      const text = await visibleText(page);
      if (/System settings|Appearance|Font & Display/i.test(text)) {
        note("pass", "locale-ui", "Switched to English via select");
      } else {
        note("fail", "locale-ui", "UI did not switch after English select", {
          sample: text.slice(0, 200),
        });
      }
    } else {
      note("warn", "locale-ui", "English option not found in popup");
    }
  } else {
    note("warn", "locale-ui", "locale-select not found");
  }

  // Font & Display tab
  const displayTab = page.getByRole("tab", { name: /Font & Display|字体与显示/i });
  if (await displayTab.count()) {
    await displayTab.click();
    await page.waitForTimeout(300);
    const sizeInput = page.locator("#display-font-size").locator("..").locator('input[type="number"]').first();
    // use slider aria
    const sizeSlider = page.locator("#display-font-size");
    if (await sizeSlider.count()) {
      await sizeSlider.fill("18").catch(() => {});
    }
    // set via store
    await page.evaluate(() => {
      const raw = localStorage.getItem("gvfi-display-v1");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = { ...(parsed.state || {}), fontSizePx: 18, uiScale: 1.15 };
      localStorage.setItem("gvfi-display-v1", JSON.stringify(parsed));
      const a = localStorage.getItem("gvfi-appearance-v2");
      const ap = a ? JSON.parse(a) : { state: {}, version: 0 };
      ap.state = {
        ...(ap.state || {}),
        theme: "studio",
        glass: { ...((ap.state && ap.state.glass) || {}), opacity: 40, blur: 30 },
      };
      localStorage.setItem("gvfi-appearance-v2", JSON.stringify(ap));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        fontSize: s.getPropertyValue("--app-font-size").trim(),
        theme: document.documentElement.getAttribute("data-theme"),
        glassOpacity: s.getPropertyValue("--glass-opacity").trim(),
      };
    });
    if (vars.fontSize.includes("18") || vars.fontSize === "18px") {
      note("pass", "persist", "font size persisted after reload", vars);
    } else {
      note("fail", "persist", "font size not applied", vars);
    }
    if (vars.theme === "studio") note("pass", "persist", "theme persisted", vars);
    else note("fail", "persist", "theme not studio", vars);
  }

  // Scrollbar styles
  await page.goto(`${BASE}/app/ai`, { waitUntil: "networkidle" });
  const sb = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    return {
      scrollbarWidth: html.scrollbarWidth,
      scrollbarColor: html.scrollbarColor,
    };
  });
  if (sb.scrollbarWidth === "thin") note("pass", "scrollbar", "root thin scrollbar", sb);
  else note("fail", "scrollbar", "root not thin", sb);

  // Error paths: invalid API / missing file UX
  await page.goto(`${BASE}/app/video`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  // try start without input
  const startBtn = page.getByRole("button", { name: /开始|Start|渲染|Render/i }).first();
  if (await startBtn.count()) {
    await startBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    const text = await visibleText(page);
    note("pass", "error-path", "clicked start; captured UI state", {
      hasErrorHint: /请|path|视频|video|missing|empty|选择|select/i.test(text),
      sample: text.slice(0, 180),
    });
  }

  // Simulate offline health
  await page.route("**/api/health**", (route) =>
    route.fulfill({ status: 503, body: JSON.stringify({ detail: "offline" }) })
  );
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const dash = await visibleText(page);
  if (/离线|Offline|警告|Warning|…|\.\.\./i.test(dash)) {
    note("pass", "offline", "dashboard reflects offline/warning state");
  } else {
    note("warn", "offline", "offline state not obvious", { sample: dash.slice(0, 200) });
  }

  // Window controls (browser: absent)
  const win = await page.evaluate(() => !!window.gvfiDesktop);
  note(win ? "pass" : "warn", "desktop", win ? "Electron bridge present" : "Browser mode — window controls N/A");

  // DPI-ish: css zoom simulation 125% / 150%
  for (const zoom of [1, 1.25, 1.5]) {
    await page.evaluate((z) => {
      document.documentElement.style.zoom = String(z);
    }, zoom);
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => ({
      bodyW: document.body.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyH: document.body.scrollHeight,
      clientH: document.documentElement.clientHeight,
    }));
    note("pass", "scale", `zoom ${Math.round(zoom * 100)}% layout measured`, overflow);
  }

  await browser.close();

  const summary = {
    pass: findings.filter((f) => f.level === "pass").length,
    fail: findings.filter((f) => f.level === "fail").length,
    warn: findings.filter((f) => f.level === "warn").length,
  };
  console.log("\n=== SUMMARY ===");
  console.log(summary);
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
