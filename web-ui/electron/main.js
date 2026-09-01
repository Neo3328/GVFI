/**
 * Electron main process — GVFI desktop shell.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const desktopI18n = require("./i18n");

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

function redactLogMessage(message) {
  return String(message)
    .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, "Bearer ***")
    .replace(
      /("?(?:api[_-]?key|apiKey|token|authorization|password|secret)"?\s*[:=]\s*)(["']?)[^"'\s,}\\]]+/gi,
      "$1$2***"
    );
}

function log(message) {
  const safe = redactLogMessage(message);
  const line = `[${new Date().toISOString()}] ${safe}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch {
    /* ignore */
  }
  console.error(safe);
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
          reject(new Error(desktopI18n.t("waitTimeout", { url })));
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
    log(`[GVFI] gvfi_api.py not found (${apiScript})`);
    return null;
  }
  const py = resolvePythonExecutable();
  log(`[GVFI] Starting API: ${py} ${apiScript}`);
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
    log("[GVFI] API exited unexpectedly; restarting in 3s…");
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

async function restartGvfiApi() {
  if (shuttingDown) return false;
  apiRestarting = true;
  killProcessTree(gvfiApiProcess);
  gvfiApiProcess = null;
  await new Promise((resolve) => setTimeout(resolve, 800));
  gvfiApiProcess = startGvfiApi();
  pipeProcessLogs(gvfiApiProcess, "api");
  if (gvfiApiProcess) {
    gvfiApiProcess.on("error", (err) => {
      log(`[GVFI] API spawn error: ${err.message}`);
    });
  }
  apiRestarting = false;
  if (!gvfiApiProcess) return false;
  try {
    await waitForUrl("http://127.0.0.1:8765/health", 30000);
    log("[GVFI] API restart OK");
    return true;
  } catch (error) {
    log(`[GVFI] API restart failed: ${error.message}`);
    return false;
  }
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
      throw new Error(desktopI18n.t("standaloneMissing", { path: serverJs }));
    }
    if (!fs.existsSync(nextModule)) {
      throw new Error(desktopI18n.t("depsMissing"));
    }
    log(`[GVFI] Starting Next standalone: ${serverJs}`);
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
        `[GVFI] API not ready: ${error.message} (UI can open; local render unavailable)`
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
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"), {
    query: { lang: desktopI18n.getLocale() },
  });
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
  dialog.showErrorBox(
    desktopI18n.t("bootFailedTitle"),
    desktopI18n.t("bootFailedBody", { message, log: LOG_FILE })
  );
}

function registerWindowIpc() {
  ipcMain.handle("gvfi:window-minimize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
  });
  ipcMain.handle("gvfi:window-maximize-toggle", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle("gvfi:window-close", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });
  ipcMain.handle("gvfi:window-is-maximized", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    return mainWindow.isMaximized();
  });
  ipcMain.handle("gvfi:set-locale", (_event, locale) => {
    return desktopI18n.setLocale(locale);
  });
  ipcMain.handle("gvfi:get-locale", () => desktopI18n.getLocale());
  ipcMain.handle("gvfi:restart-api", () => restartGvfiApi());

  ipcMain.handle("gvfi:write-text-copy", (_event, payload) => {
    try {
      const content = String(payload?.content ?? "");
      const suggestedName = String(payload?.suggestedName || "untitled.txt");
      const sourcePath =
        typeof payload?.sourcePath === "string" && payload.sourcePath.trim()
          ? path.resolve(payload.sourcePath.trim())
          : "";

      let outPath;
      if (sourcePath && fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
        const dir = path.dirname(sourcePath);
        const base = path.basename(sourcePath);
        const ext = path.extname(base);
        const stem = path.basename(base, ext);
        outPath = path.join(dir, `${stem}.gvfi-fixed${ext || ".txt"}`);
      } else {
        const dir = path.join(app.getPath("userData"), "ai-fixes");
        fs.mkdirSync(dir, { recursive: true });
        const base = path.basename(suggestedName);
        const ext = path.extname(base);
        const stem = path.basename(base, ext) || "untitled";
        outPath = path.join(dir, `${stem}.gvfi-fixed${ext || ".txt"}`);
      }

      const resolved = path.resolve(outPath);
      const userDataRoot = path.resolve(app.getPath("userData"));
      const sourceDir = sourcePath ? path.dirname(sourcePath) : "";
      const allowed =
        resolved.startsWith(userDataRoot + path.sep) ||
        (sourceDir && resolved.startsWith(sourceDir + path.sep));
      if (!allowed) {
        return { ok: false, error: "PATH_NOT_ALLOWED" };
      }
      if (resolved.includes(".." + path.sep) || resolved.includes(path.sep + "..")) {
        return { ok: false, error: "PATH_TRAVERSAL" };
      }

      fs.writeFileSync(resolved, content, "utf8");
      log(`[GVFI] AI text copy written: ${resolved}`);
      return { ok: true, path: resolved };
    } catch (error) {
      log(`[GVFI] write-text-copy failed: ${error.message}`);
      return { ok: false, error: error.message || "WRITE_FAILED" };
    }
  });

  ipcMain.handle("gvfi:reveal-in-folder", (_event, targetPath) => {
    try {
      const resolved = path.resolve(String(targetPath || ""));
      if (!resolved || !fs.existsSync(resolved)) return false;
      shell.showItemInFolder(resolved);
      return true;
    } catch (error) {
      log(`[GVFI] reveal-in-folder failed: ${error.message}`);
      return false;
    }
  });

  ipcMain.handle("gvfi:select-directory", async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "选择输出目录",
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("gvfi:select-video-file", async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "选择输入视频",
      properties: ["openFile"],
      filters: [
        {
          name: "视频文件",
          extensions: ["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv", "m4v"],
        },
        { name: "所有文件", extensions: ["*"] },
      ],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("gvfi:open-path", async (_event, targetPath) => {
    try {
      const resolved = path.resolve(String(targetPath || ""));
      if (!resolved || !fs.existsSync(resolved)) return false;
      const errorMessage = await shell.openPath(resolved);
      return !errorMessage;
    } catch (error) {
      log(`[GVFI] open-path failed: ${error.message}`);
      return false;
    }
  });
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
    /* Transparent frameless shell — renderer owns --window-radius clip */
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  const emitMaximized = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send(
      "gvfi:maximized-changed",
      mainWindow.isMaximized()
    );
  };
  mainWindow.on("maximize", emitMaximized);
  mainWindow.on("unmaximize", emitMaximized);

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
    showBootError(
      desktopI18n.t("pageLoadFail", { code, desc, url })
    );
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
    desktopI18n.initLocale();
    log(`[GVFI] starting packaged=${isPackaged} root=${GVFI_ROOT}`);
    registerWindowIpc();
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
