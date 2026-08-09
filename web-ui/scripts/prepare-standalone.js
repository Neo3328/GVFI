/**
 * 将 Next.js standalone 输出补齐 static / public，供 Electron 打包使用。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const standaloneDir = path.join(ROOT, ".next", "standalone");
const staticSrc = path.join(ROOT, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(ROOT, "public");
const publicDest = path.join(standaloneDir, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[prepare-standalone] skip missing: ${src}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[prepare-standalone] copied ${src} -> ${dest}`);
}

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "[prepare-standalone] 未找到 .next/standalone/server.js，请先运行 npm run build（需 output: standalone）"
  );
  process.exit(1);
}

copyDir(staticSrc, staticDest);
copyDir(publicSrc, publicDest);

const nodeModulesDir = path.join(standaloneDir, "node_modules");
const nextModule = path.join(nodeModulesDir, "next", "package.json");
if (!fs.existsSync(nextModule)) {
  console.error(
    "[prepare-standalone] 未找到 standalone/node_modules/next，Next 独立服务无法在桌面版启动"
  );
  process.exit(1);
}

console.log("[prepare-standalone] done");
