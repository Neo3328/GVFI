/**
 * Electron main process — GVFI desktop shell.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const isPackaged = app.isPackaged;
const ROOT = isPackaged
  ? path.join(process.resourcesPath, "standalone")
  : path.join(__dirname, "..");
const PORT = Number(process.env.GVFI_PORT || 3456);
const APP_URL = `http://127.0.0.1:${PORT}/app/dashboard`;

let mainWindow = null;
let splashWindow = null;
let nextProcess = null;
let gvfiApiProcess = null;

function resolveGvfiRoot() {
  if (
    process.env.GVFI_ROOT &&
    fs.existsSync(path.join(process.env.GVFI_ROOT, "ECCV2022-RIFE", "gvfi_api.py"))
  ) {
    return process.env.GVFI_ROOT;
  }

  let dir = isPackaged ? path.dirname(process.execPath) : path.join(__dirname, "..", "..");
  for (let i = 0; i < 8; i += 1) {
    const apiScript = path.join(dir, "ECCV2022-RIFE", "gvfi_api.py");
    if (fs.existsSync(apiScript)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return path.join(__dirname, "..", "..");
}

const GVFI_ROOT = resolveGvfiRoot();
const RIFE_DIR = path.join(GVFI_ROOT, "ECCV2022-RIFE");
const LOG_FILE = path.join(app.getPath("userData"), "gvfi-desktop.log");

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch {
    /* ignore */
  }
  console.error(message);
}

function waitForUrl(url, timeoutMs = 90000, acceptStatus = (code) => code >= 200 && code < 400) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && acceptStatus(res.statusCode)) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(4000, () => {
        req.destroy();
        retry();
      });

      function retry() {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`等待服务超时: ${url}`));
          return;
        }
        setTimeout(attempt, 800);
      }
    };
    attempt();
  });
}

function resolvePythonExecutable() {
  if (process.env.GVFI_PYTHON && fs.existsSync(process.env.GVFI_PYTHON)) {
    return process.env.GVFI_PYTHON;
  }

  if (process.platform === "win32") {
    const candidates = [
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python312", "python.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python311", "python.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python310", "python.exe"),
      "C:\\Python312\\python.exe",
      "C:\\Python311\\python.exe",
      "python",
      "python3",
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate === "python" || candidate === "python3") return candidate;
      if (fs.existsSync(candidate)) return candidate;
    }
    return "python";
  }

  return "python3";
}

let apiRestarting = false;
let shuttingDown = false;

function startGvfiApi() {
  const apiScript = path.join(RIFE_DIR, "gvfi_api.py");
  if (!fs.existsSync(apiScript)) {
    log(`[GVFI] 未找到 gvfi_api.py (${apiScript})`);
    return null;
  }
  const py = resolvePythonExecutable();
  log(`[GVFI] 启动 API: ${py} ${apiScript}`);
  const proc = spawn(py, [apiScript], {
    cwd: RIFE_DIR,
    env: {
      ...process.env,
      GVFI_API_HOST: "127.0.0.1",
      GVFI_API_PORT: "8765",
      PYTHONUNBUFFERED: "1",
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.on("exit", (code, signal) => {
    log(`[GVFI] API process exit code=${code} signal=${signal}`);
    if (shuttingDown || apiRestarting) return;
    if (gvfiApiProcess !== proc) return;
    apiRestarting = true;
    log("[GVFI] API 意外退出，3 秒后自动重启…");
    setTimeout(() => {
      apiRestarting = false;
      if (shuttingDown) return;
      gvfiApiProcess = startGvfiApi();
      pipeProcessLogs(gvfiApiProcess, "api");
      if (gvfiApiProcess) {
        gvfiApiProcess.on("error", (err) => {
          log(`[GVFI] API spawn error: ${err.message}`);
        });
      }
    }, 3000);
  });

  return proc;
}

function startNextServer() {
  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    GVFI_API_ORIGIN: "http://127.0.0.1:8765",
  };

  if (isPackaged) {
    const serverJs = path.join(ROOT, "server.js");
    const nodeModules = path.join(ROOT, "node_modules");
    const nextModule = path.join(nodeModules, "next", "package.json");
    if (!fs.existsSync(serverJs)) {
      throw new Error(`未找到 standalone 服务: ${serverJs}`);
    }
    if (!fs.existsSync(nextModule)) {
      throw new Error(
        `未找到 standalone 依赖 (node_modules/next)。请重新打包桌面版，或运行 scripts\\sync-desktop-ui.cmd 同步 UI。`
      );
    }
    log(`[GVFI] 启动 Next standalone: ${serverJs}`);
    return spawn(process.execPath, [serverJs], {
      cwd: ROOT,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: nodeModules,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  const hasBuild = fs.existsSync(path.join(__dirname, "..", ".next", "BUILD_ID"));
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const args = hasBuild ? ["start", "-p", String(PORT)] : ["dev", "-p", String(PORT)];

  return spawn(process.execPath, [nextBin, ...args], {
    cwd: path.join(__dirname, ".."),
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function pipeProcessLogs(proc, label) {
  if (!proc) return;
  const decode = (chunk) => Buffer.from(chunk).toString("utf8").trim();
  proc.stdout?.on("data", (chunk) => log(`[${label}] ${decode(chunk)}`));
  proc.stderr?.on("data", (chunk) => log(`[${label}] ${decode(chunk)}`));
  proc.on("exit", (code) => log(`[${label}] exited ${code}`));
}

async function bootServices() {
  // Parallel boot: spawn API + Next together, wait for UI readiness without
  // serializing behind a hard API barrier (API soft-fails independently).
  const bootStarted = Date.now();
  gvfiApiProcess = startGvfiApi();
  pipeProcessLogs(gvfiApiProcess, "api");
  if (gvfiApiProcess) {
    gvfiApiProcess.on("error", (err) => {
      log(`[GVFI] API spawn error: ${err.message}`);
    });
  }

  nextProcess = startNextServer();
  pipeProcessLogs(nextProcess, "next");

  const apiReady = waitForUrl("http://127.0.0.1:8765/health", 45000)
    .then(() => {
      log(`[GVFI] API health OK (+${Date.now() - bootStarted}ms)`);
    })
    .catch((error) => {
      log(
        `[GVFI] API 未就绪: ${error.message}（界面可开，本地渲染暂不可用）`
      );
    });

  await waitForUrl(APP_URL, 120000);
  log(`[GVFI] Web UI ready: ${APP_URL} (+${Date.now() - bootStarted}ms)`);
  await apiReady;
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    show: true,
    backgroundColor: "#070914",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  splashWindow = null;
}

function showBootError(message) {
  closeSplashWindow();
  dialog.showErrorBox("GVFI 启动失败", `${message}\n\n日志: ${LOG_FILE}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "GVFI",
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#070914",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const reveal = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    closeSplashWindow();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once("ready-to-show", reveal);
  setTimeout(reveal, 8000);

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    log(`[GVFI] did-fail-load ${code} ${desc} ${url}`);
    showBootError(`页面加载失败 (${code}): ${desc}\n${url}`);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log("[GVFI] did-finish-load");
  });

  log(`[GVFI] loadURL ${APP_URL}`);
  mainWindow.loadURL(APP_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function killProcessTree(proc) {
  if (!proc || proc.killed) return;
  if (process.platform === "win32") {
    try {
      spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], {
        windowsHide: true,
        stdio: "ignore",
      });
      return;
    } catch {
      /* fall through */
    }
  }
  try {
    proc.kill("SIGTERM");
  } catch {
    /* ignore */
  }
}

function shutdownChildren() {
  shuttingDown = true;
  killProcessTree(nextProcess);
  killProcessTree(gvfiApiProcess);
  nextProcess = null;
  gvfiApiProcess = null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    log(`[GVFI] starting packaged=${isPackaged} root=${GVFI_ROOT}`);
    createSplashWindow();
    try {
      await bootServices();
      createWindow();
    } catch (error) {
      log(`[GVFI] boot failed: ${error.message}`);
      showBootError(error.message);
      shutdownChildren();
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    shutdownChildren();
    app.quit();
  });

  app.on("before-quit", () => {
    shutdownChildren();
  });
}
