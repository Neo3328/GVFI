/**
 * GVFI — Smoke checks for device status i18n mapping.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const zh = fs.readFileSync(
  path.join(root, "src/lib/i18n/messages/zh-CN.ts"),
  "utf8"
);
const en = fs.readFileSync(
  path.join(root, "src/lib/i18n/messages/en.ts"),
  "utf8"
);
const mapper = fs.readFileSync(
  path.join(root, "src/lib/i18n/device-label.ts"),
  "utf8"
);

const checks = [
  [/\"device\.localVulkan\":\s*\"本地 Vulkan\"/, zh, "zh device.localVulkan"],
  [/\"device\.localVulkan\":\s*\"Local Vulkan\"/, en, "en device.localVulkan"],
  [/\"dashboard\.kpi\.gpuSub\":\s*\"当前设备\"/, zh, "zh gpuSub"],
  [/\"dashboard\.kpi\.gpuSub\":\s*\"Current device\"/, en, "en gpuSub"],
  [/本地 vulkan/, mapper, "mapper alias 本地 vulkan"],
  [/local-vulkan/, mapper, "mapper alias local-vulkan"],
  [/formatDeviceLabel/, mapper, "formatDeviceLabel export"],
];

let failed = 0;
for (const [re, src, label] of checks) {
  if (!re.test(src)) {
    console.error("FAIL", label);
    failed += 1;
  } else {
    console.log("OK  ", label);
  }
}

process.exit(failed ? 1 : 0);
