const fs = require("fs");
const zh = fs.readFileSync("src/lib/i18n/messages/zh-CN.ts", "utf8");
const en = fs.readFileSync("src/lib/i18n/messages/en.ts", "utf8");
const re = /"([^"]+)":/g;
function keys(s) {
  const m = new Set();
  let x;
  while ((x = re.exec(s))) m.add(x[1]);
  return m;
}
const z = keys(zh);
const e = keys(en);
const onlyZ = [...z].filter((k) => !e.has(k));
const onlyE = [...e].filter((k) => !z.has(k));
console.log("zh", z.size, "en", e.size);
console.log("only zh", onlyZ);
console.log("only en", onlyE);
process.exit(onlyZ.length || onlyE.length ? 1 : 0);
