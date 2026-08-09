/**
 * GVFI — Smoke checks for slim theme / custom background i18n + helpers.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const zh = fs.readFileSync(path.join(root, "src/lib/i18n/messages/zh-CN.ts"), "utf8");
const en = fs.readFileSync(path.join(root, "src/lib/i18n/messages/en.ts"), "utf8");
const panel = fs.readFileSync(
  path.join(root, "src/components/appearance-panel.tsx"),
  "utf8"
);
const apply = fs.readFileSync(path.join(root, "src/lib/apply-appearance.ts"), "utf8");
const image = fs.readFileSync(path.join(root, "src/lib/image-file.ts"), "utf8");

const checks = [
  [/appearance\.theme\.light/, zh, "zh light theme"],
  [/appearance\.theme\.image/, zh, "zh image theme"],
  [/"appearance\.theme\.dark":\s*"Dark"/, zh, "zh Dark label"],
  [/星光水面/, zh, "zh must NOT contain 星光水面", true],
  [/appearance\.theme\.light/, en, "en light theme"],
  [/Starlit water/, en, "en must NOT contain Starlit", true],
  [/loadBackgroundImageFile/, image, "image loader"],
  [/IMAGE_FILE_ACCEPT/, panel, "panel accept"],
  [/themeDefaultBackgroundStyle/, apply, "no preset wallpapers helper"],
  [/BackgroundPresetId|starlit|nebula/, apply, "apply must NOT keep presets", true],
  [/value: \"light\"/, panel, "panel light option"],
  [/value: \"image\"/, panel, "panel image option"],
  [/bg-preset|BG_KEYS/, panel, "panel must NOT keep preset select", true],
];

let failed = 0;
for (const entry of checks) {
  const [re, src, label, invert] = entry;
  const hit = re.test(src);
  const ok = invert ? !hit : hit;
  if (!ok) {
    console.error("FAIL", label);
    failed += 1;
  } else {
    console.log("OK  ", label);
  }
}

process.exit(failed ? 1 : 0);
