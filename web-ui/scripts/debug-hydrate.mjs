import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const logs = [];
page.on("console", (msg) => logs.push([msg.type(), msg.text()]));
page.on("pageerror", (err) => logs.push(["pageerror", err.message]));

await page.goto("http://127.0.0.1:3000/app/dashboard", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1500);

await page.getByRole("link", { name: /系统|System/i }).first().click();
await page.waitForTimeout(1500);
console.log("url", page.url());

const interactive = await page.evaluate(() => {
  const node =
    document.querySelector("[data-slot='select-trigger']") ||
    document.querySelector("a");
  let fiberKey = null;
  if (node) {
    fiberKey =
      Object.keys(node).find(
        (k) =>
          k.startsWith("__reactFiber") ||
          k.startsWith("__reactInternalInstance")
      ) || null;
  }
  return {
    fiberKey,
    persist: window.__GVFI_PERSIST__ ?? null,
    title: document.title,
  };
});
console.log("interactive", interactive);
console.log(
  "logs",
  logs.filter((l) => l[0] !== "info" || /hydrat|error|warn/i.test(l[1])).slice(0, 40)
);

await browser.close();
