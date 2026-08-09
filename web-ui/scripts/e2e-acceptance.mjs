/**
 * GVFI — Browser acceptance harness (CDP-friendly Runtime.evaluate payload).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Paste/run via browser console or CDP. Returns structured findings.
 */

export async function runGvfiAcceptance() {
  const routes = [
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
  ];

  const findings = [];
  const note = (level, area, message, extra) => {
    findings.push({ level, area, message, ...(extra || {}) });
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const visibleText = () => {
    const root = document.body;
    return (root?.innerText || "").replace(/\s+/g, " ").trim();
  };

  const chineseRe = /[\u4e00-\u9fff]/;
  const englishUiLeakRe =
    /\b(Warning|Normal|Optimal|Loading|Error|Success|Cancel|Confirm|Save|Close|Retry|Submit|Settings|Appearance|Dashboard|Gateway|Blur)\b/;

  async function go(path) {
    if (location.pathname !== path) {
      history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      // Next App Router: prefer soft nav via click if link exists
      const a = document.querySelector(`a[href="${path}"]`);
      if (a) {
        a.click();
      } else {
        location.assign(path);
        await sleep(800);
        return;
      }
      await sleep(500);
    }
  }

  function setLocale(locale) {
    try {
      const raw = localStorage.getItem("gvfi-locale-v1");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = { ...(parsed.state || {}), locale };
      localStorage.setItem("gvfi-locale-v1", JSON.stringify(parsed));
      document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
      document.documentElement.dataset.locale = locale;
    } catch (e) {
      note("error", "locale", String(e));
    }
  }

  function readCssVars() {
    const s = getComputedStyle(document.documentElement);
    return {
      fontFamily: s.getPropertyValue("--app-font-family").trim(),
      fontSize: s.getPropertyValue("--app-font-size").trim(),
      textColor: s.getPropertyValue("--app-text-color").trim(),
      glassOpacity: s.getPropertyValue("--glass-opacity").trim(),
      theme: document.documentElement.getAttribute("data-theme"),
      lang: document.documentElement.lang,
    };
  }

  function scrollbarSample() {
    const samples = [];
    const nodes = Array.from(document.querySelectorAll("*")).filter((el) => {
      const st = getComputedStyle(el);
      const ox = st.overflowX;
      const oy = st.overflowY;
      const scrollable =
        ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 2) ||
        ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 2);
      return scrollable;
    });
    for (const el of nodes.slice(0, 12)) {
      const st = getComputedStyle(el);
      samples.push({
        tag: el.tagName.toLowerCase(),
        className: String(el.className).slice(0, 80),
        scrollbarWidth: st.scrollbarWidth,
        scrollbarColor: st.scrollbarColor,
        overflowX: st.overflowX,
        overflowY: st.overflowY,
      });
    }
    return { scrollableCount: nodes.length, samples };
  }

  // —— Locale EN sweep ——
  setLocale("en");
  location.reload();
  await sleep(1200);

  for (const path of routes) {
    location.assign(path);
    await sleep(700);
    const text = visibleText();
    const zh = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
    const allowed = zh.filter(
      (w) =>
        w === "简体中文" ||
        w.includes("幼圆") ||
        w.includes("微软雅黑") ||
        w.includes("华文")
    );
    const badZh = zh.filter((w) => !allowed.includes(w));
    if (badZh.length) {
      note("fail", "i18n-en", `Chinese leftovers on ${path}`, {
        samples: [...new Set(badZh)].slice(0, 12),
      });
    } else {
      note("pass", "i18n-en", `Clean on ${path}`);
    }
  }

  // —— Locale ZH sweep ——
  setLocale("zh-CN");
  location.reload();
  await sleep(1200);

  for (const path of [
    "/app/dashboard",
    "/app/system",
    "/app/settings/appearance",
    "/app/ai",
  ]) {
    location.assign(path);
    await sleep(700);
    const text = visibleText();
    const leaks = text.match(englishUiLeakRe) || [];
    if (leaks.length) {
      note("fail", "i18n-zh", `English UI leaks on ${path}`, {
        samples: [...new Set(leaks)],
      });
    } else {
      note("pass", "i18n-zh", `No English UI leaks on ${path}`);
    }
  }

  // —— Display persistence simulate ——
  try {
    const displayKey = "gvfi-display-v1";
    const appearanceKey = "gvfi-appearance-v2";
    const d = JSON.parse(localStorage.getItem(displayKey) || '{"state":{}}');
    d.state = {
      ...(d.state || {}),
      fontSizePx: 18,
      fontColorMode: "white",
      textShadowStrength: 0.4,
      uiScale: 1.1,
    };
    localStorage.setItem(displayKey, JSON.stringify(d));
    const a = JSON.parse(localStorage.getItem(appearanceKey) || '{"state":{}}');
    a.state = {
      ...(a.state || {}),
      glass: {
        ...((a.state && a.state.glass) || {}),
        opacity: 0.35,
        blur: 28,
      },
      theme: "studio",
    };
    localStorage.setItem(appearanceKey, JSON.stringify(a));
    location.reload();
    await sleep(1200);
    const vars = readCssVars();
    if (!vars.fontSize.includes("18") && vars.fontSize !== "18px") {
      note("fail", "display", "font size not applied after reload", { vars });
    } else {
      note("pass", "display", "font size persisted", { vars });
    }
    if (vars.theme !== "studio") {
      note("fail", "theme", "studio theme not applied", { vars });
    } else {
      note("pass", "theme", "studio theme persisted", { vars });
    }
  } catch (e) {
    note("error", "display", String(e));
  }

  const sb = scrollbarSample();
  const badSb = sb.samples.filter(
    (s) => s.scrollbarWidth && s.scrollbarWidth !== "thin" && s.scrollbarWidth !== "none"
  );
  if (badSb.length) {
    note("fail", "scrollbar", "non-thin scrollbar-width detected", { badSb });
  } else {
    note("pass", "scrollbar", "scrollbar samples ok", sb);
  }

  // desktop bridge
  const desk = window.gvfiDesktop;
  note(desk ? "pass" : "warn", "desktop", desk ? "bridge present" : "no Electron bridge (browser mode)");

  const summary = {
    pass: findings.filter((f) => f.level === "pass").length,
    fail: findings.filter((f) => f.level === "fail").length,
    warn: findings.filter((f) => f.level === "warn").length,
    error: findings.filter((f) => f.level === "error").length,
    findings,
    css: readCssVars(),
  };
  return summary;
}
