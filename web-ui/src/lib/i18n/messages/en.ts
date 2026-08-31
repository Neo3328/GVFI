/**
 * GVFI — English messages.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Keep keys and meaning 1:1 with messages/zh-CN.ts — no add/omit when translating.
 */

import type { MessageDict } from "@/lib/i18n/types";

export const en: MessageDict = {
  /* Nav */
  "nav.home": "Home",
  "nav.homeAria": "Home dashboard",
  "nav.tasks": "Tasks",
  "nav.tasksAria": "Task management",
  "nav.video": "Video",
  "nav.videoAria": "Video processing",
  "nav.ai": "AI Workbench",
  "nav.aiAria": "AI Workbench",
  "nav.settings": "Connect",
  "nav.settingsAria": "Connection settings",
  "nav.system": "System",
  "nav.systemAria": "System settings",
  "nav.mobile": "Mobile navigation",

  /* Common chrome */
  "common.app": "GVFI",
  "common.gateway": "Gateway",
  "common.comingSoon": "Coming soon",
  "common.online": "Online",
  "common.offline": "Offline",
  "common.warning": "Warning",
  "common.loading": "Loading",
  "common.empty": "No content",
  "common.error": "Error",
  "common.success": "Success",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.close": "Close",
  "common.retry": "Retry",
  "common.ellipsis": "…",
  "common.emDash": "—",

  /* Chrome / shell */
  "chrome.breadcrumbAria": "Breadcrumb",
  "chrome.primaryNavAria": "Primary navigation",
  "chrome.defaultTitle": "GVFI Console",
  "chrome.windowMinimize": "Minimize",
  "chrome.windowMaximize": "Maximize",
  "chrome.windowRestore": "Restore",
  "chrome.windowClose": "Close",

  /* Glass states / dialogs */
  "glass.loading": "Loading",
  "glass.empty": "No content",
  "glass.error": "Something went wrong",
  "glass.retry": "Retry",
  "glass.retryAria": "Retry action",
  "glass.closeDialog": "Close dialog",
  "glass.closeDrawer": "Close drawer",
  "glass.close": "Close",
  "glass.closeToast": "Close notification",

  "dashboard.greetingSubtitle": "Professional AI video workstation",

  /* Locale / appearance */
  "locale.label": "Interface language",
  "locale.zhCN": "简体中文",
  "locale.en": "English",
  "appearance.cardTitle": "Appearance",
  "appearance.cardDesc": "Theme, custom background image, and glass material",
  "appearance.theme": "Theme",
  "appearance.background": "Background",
  "appearance.theme.light": "Light",
  "appearance.theme.dark": "Dark",
  "appearance.theme.image": "Image theme",
  "appearance.theme.needImage": "Upload a background image before using Image theme",
  "appearance.themeLog": "Appearance: {name}",
  "appearance.bg.hint":
    "Upload a local image as the background (PNG, JPG/JPEG, WebP)",
  "appearance.bg.upload": "Upload background",
  "appearance.bg.remove": "Remove image",
  "appearance.bg.restoreDefault": "Restore default background",
  "appearance.bg.none": "No background image yet — using the theme default",
  "appearance.bg.unnamed": "Untitled image",
  "appearance.bg.dimensions": "{width} × {height}",
  "appearance.bg.dimensionsUnknown": "Size unknown",
  "appearance.bg.inUse": "Currently in use",
  "appearance.bg.uploadedIdle":
    "Uploaded (switch to Image theme to use as the window background)",
  "appearance.bg.tooLarge": "Background image is too large to save",
  "appearance.bg.unsupported":
    "Unsupported image format (use PNG, JPG/JPEG, or WebP)",
  "appearance.bg.readFail": "Failed to read the file",
  "appearance.bg.decodeFail": "Failed to load the image",
  "appearance.bg.persistFail": "Could not save the background (storage full)",
  "appearance.bg.switched": "Background image set: {name}",
  "appearance.bg.resetLog": "Restored theme default background",
  "appearance.glassOpacity": "Glass opacity",
  "appearance.glassBlur": "Blur strength",
  "appearance.borderBrightness": "Border brightness",
  "appearance.shadowStrength": "Shadow strength",
  "appearance.glowStrength": "Bloom strength",

  /* System */
  "system.title": "System",
  "system.chromeTitle": "System settings",
  "system.subtitle":
    "Theme materials, developer diagnostics, runtime logs, and version information",
  "system.tab.appearance": "Appearance",
  "system.tab.display": "Font & Display",
  "system.tab.developer": "Developer",
  "system.tab.logs": "Logs",
  "system.tab.about": "About",

  /* Font & display */
  "display.cardTitle": "Font & Display",
  "display.cardDesc":
    "Global font, contrast, glass material, and UI scale — live and persisted",
  "display.fontFamily": "Font family",
  "display.font.youyuan": "YouYuan (rounded)",
  "display.font.yahei": "Microsoft YaHei",
  "display.font.system": "System default",
  "display.font.other": "Other available fonts",
  "display.font.custom": "Custom font name",
  "display.customFontName": "Custom font name",
  "display.customFontPlaceholder": "e.g. YouYuan or Segoe UI",
  "display.fontSize": "Font size",
  "display.fontColor": "Font color",
  "display.color.auto": "Auto",
  "display.color.white": "White",
  "display.color.dark": "Dark",
  "display.color.custom": "Custom color",
  "display.customColor": "Custom text color",
  "display.lowContrastHint":
    "Text contrast is low against the background. Enable auto contrast or deepen the glass scrim.",
  "display.fontWeight": "Font weight",
  "display.weightValue": "{weight}",
  "display.autoContrast": "Auto text contrast",
  "display.autoContrastHint":
    "Adjust text color and scrim from wallpaper brightness with hysteresis to avoid flicker",
  "display.textShadow": "Text shadow strength",
  "display.glassOpacity": "Glass opacity",
  "display.glassBlur": "Glass blur strength",
  "display.uiScale": "UI scale",
  "display.reduceMotion": "Reduce motion",
  "display.reduceMotionHint": "Shorten animations and transitions",
  "display.previewTitle": "Live preview",
  "display.previewZh": "Chinese preview: GVFI Video Workstation",
  "display.previewEn": "English preview: GVFI Workstation",
  "display.previewNums": "Digits 0123456789 · 24fps · 4K",
  "display.previewButton": "Button",
  "display.previewInput": "Input preview",
  "display.reset": "Reset display defaults",

  "system.about.blurb": "AI video frame-interpolation and large-model analysis workstation",
  "system.about.openFull": "Open full About page",

  /* AI workspace shell */
  "ai.title": "AI Workbench",
  "ai.subtitle":
    "Unified sessions, model configuration, and AI task scheduling — all large-model requests go through the AI Gateway",

  /* AI session sidebar */
  "ai.session.title": "AI Workspace",
  "ai.session.new": "New session",
  "ai.session.search": "Search sessions",
  "ai.session.favorites": "Favorites",
  "ai.session.recent": "Recently used",
  "ai.session.empty": "No sessions yet. Click + to create one",
  "ai.session.untitled": "Untitled",
  "ai.session.favorite": "Favorite",
  "ai.session.pin": "Pin",
  "ai.session.delete": "Delete",
  "ai.session.welcome": "Welcome",

  /* AI chat */
  "ai.chat.session": "Session",
  "ai.chat.emptyTitle": "Start chatting with the model",
  "ai.chat.emptyHint":
    "Paste error logs for diagnosis and fix retries, or attach a text file to generate a modified copy. For video visual analysis, use the right panel.",
  "ai.chat.placeholder":
    "Please enter a task… You can also paste full error logs for analysis",
  "ai.chat.attach": "Attachment",
  "ai.chat.attachTitle": "Attach a text file (for a modified copy)",
  "ai.chat.attachRemove": "Remove attachment",
  "ai.chat.attachTooLarge": "Attachment exceeds 256KB — please shrink it and retry",
  "ai.chat.attachUnsupported":
    "Only text files are supported (json/txt/md/py/ts/js, etc.)",
  "ai.chat.attachFail": "Failed to read attachment",
  "ai.chat.send": "Send",
  "ai.chat.stop": "Stop",
  "ai.chat.needKey": "Please configure an API Key in the right panel first",
  "ai.chat.emptyReply": "(Empty reply)",
  "ai.chat.errorPrefix": "Error: ",

  /* AI control panel */
  "ai.control.models": "Model management",
  "ai.control.provider": "Provider",
  "ai.control.current": "Current: {provider} · {model}",
  "ai.control.modelId": "Model ID",
  "ai.control.api": "API configuration",
  "ai.control.baseUrl": "Service URL (Base URL)",
  "ai.control.endpoint": "Endpoint",
  "ai.control.apiKey": "API Key",
  "ai.control.temperature": "Temperature",
  "ai.control.maxTokens": "Max Tokens",
  "ai.control.topP": "Top P",
  "ai.control.timeout": "Timeout (ms)",
  "ai.control.test": "Test connection",
  "ai.control.presets": "Task presets",
  "ai.control.maxFrames": "Frame extraction count",
  "ai.control.analyze": "Video visual analysis (via Gateway)",
  "ai.control.submitting": "Submitting…",
  "ai.control.queue": "Task queue",
  "ai.control.queueHint": "See the Tasks page for local render / LLM jobs",
  "ai.control.noTask": "No active task currently",
  "ai.control.openTasks": "Open task center",
  "ai.control.promptPath":
    "Enter an absolute local video path (or cancel and upload on the Tasks page)",
  "ai.control.cancelled": "Cancelled",
  "ai.control.jobSubmitted": "Submitted video analysis task {taskId}",

  /* Dashboard */
  "dashboard.title": "Workstation dashboard",
  "dashboard.crumb": "Dashboard",
  "dashboard.intro":
    "Status overview and shortcuts. Open the dedicated pages for advanced parameters and task details.",
  "dashboard.processVideo": "Process video",
  "dashboard.aiAnalyze": "AI analysis",
  "dashboard.statusOffline": "Service offline",
  "dashboard.statusLive": "Live monitoring on",
  "dashboard.statusConnecting": "Connecting",
  "dashboard.kpi.api": "API",
  "dashboard.kpi.apiSub": "Service connection",
  "dashboard.kpi.queue": "QUEUE",
  "dashboard.kpi.queueSub": "Active tasks",
  "dashboard.kpi.gpu": "GPU",
  "dashboard.kpi.gpuSub": "Current device",
  "device.localVulkan": "Local Vulkan",
  "dashboard.kpi.prog": "PROG",
  "dashboard.kpi.progSub": "Average progress",
  "dashboard.kpi.online": "Online",
  "dashboard.kpi.offline": "Offline",
  "dashboard.kpi.stable": "+Stable",
  "dashboard.kpi.total": "{count} total",
  "dashboard.kpi.devices": "{count} devices",
  "dashboard.kpi.rendering": "Rendering",
  "dashboard.kpi.idle": "Idle",
  "dashboard.kpi.gpuMissing": "Not detected",
  "dashboard.kpi.badge.normal": "Normal",
  "dashboard.kpi.badge.high": "High",
  "dashboard.kpi.badge.optimal": "Optimal",
  "dashboard.kpi.badge.warning": "Warning",
  "dashboard.kpi.badge.offline": "Offline",
  "dashboard.donut.title": "Task status overview",
  "dashboard.donut.subtitle": "Task distribution under the current filters",
  "dashboard.donut.totalLabel": "Total tasks in filter range",
  "dashboard.donut.active": "In progress",
  "dashboard.donut.done": "Completed",
  "dashboard.donut.failed": "Failed",
  "dashboard.donut.other": "Other",
  "dashboard.newTask": "New processing task",
  "dashboard.viewTasks": "View tasks",
  "dashboard.load.title": "Load and peak analysis",
  "dashboard.load.subtitle": "Task activity by time bucket (based on update time)",
  "dashboard.load.avg": "Average load",
  "dashboard.load.avgValue": "{count} tasks/bucket",
  "dashboard.load.peak": "Peak period",
  "dashboard.load.efficiency": "Completion rate",
  "dashboard.load.low": "Low-load period",
  "dashboard.load.lowValue": "{label} ({count} tasks)",
  "dashboard.load.recentLog": "Recent log",
  "dashboard.load.noLog": "None",
  "dashboard.load.models": "Available models",
  "dashboard.load.modelsValue": "{count}",
  "dashboard.filter.status": "Task status",
  "dashboard.filter.all": "All tasks",
  "dashboard.filter.active": "In progress",
  "dashboard.filter.done": "Completed",
  "dashboard.filter.model": "Interpolation model",
  "dashboard.filter.allModels": "All models",
  "dashboard.filter.time": "Time range",
  "dashboard.filter.24h": "Last 24 hours",
  "dashboard.filter.7d": "Last 7 days",
  "dashboard.filter.30d": "Last 30 days",
  "dashboard.filter.apply": "Apply filters",

  /* Video workspace */
  "video.title": "Video processing",
  "video.crumb": "Video",
  "video.subtitle": "Import media, preview comparisons, and start local interpolation",
  "video.advanced": "Advanced parameters",
  "video.advancedDesc":
    "Interpolation models, super-resolution, and presets — without cluttering the main flow",
  "video.emptyTitle": "Add a video to start",
  "video.emptyHint":
    "Drop a file or enter a local path. Encoding and super-resolution details are under Advanced parameters.",
  "video.run": "Run",
  "video.progress": "Progress",
  "video.progressAria": "Render progress",
  "video.start": "Start interpolation",
  "video.stop": "Stop",
  "video.output": "Output: {path}",
  "video.footerHint":
    "View the task queue and history on the Tasks page. Connection settings are on the Connect page.",
  "video.fileSelected": "Selected file: {name}",

  /* Input panel */
  "video.input.title": "Input",
  "video.input.desc":
    "Upload a video file, or enter an absolute local path for GVFI to read.",
  "video.input.privacyNotice":
    "Before selecting a video: processing stays on this device by default. Upload copies go to local user_data/uploads and are cleaned up after jobs when possible. API keys are never embedded in source code or the installer.",
  "video.input.consentTitle": "Confirm local video access",
  "video.input.consentBody":
    "By continuing, you allow GVFI to read this video locally for interpolation/analysis. Files are not uploaded to the internet automatically. If you later run cloud LLM analysis, extracted frames are sent to the provider you configured.",
  "video.input.consentConfirm": "I understand — continue",
  "video.input.uploadConfirm":
    "The selected video will be copied to the local GVFI service folder (user_data/uploads) to start the job. Continue?",
  "video.input.llmConsent":
    "Frames will be extracted and sent with your API key to the configured cloud model provider. Keys are not shipped in the installer. Confirm you trust that provider and consent to the transfer.",
  "video.input.dropAria": "Select or drop a video file",
  "video.input.drop": "Drop a video here",
  "video.input.orClick": "or click to select",
  "video.input.current": "Current file: {name}",
  "video.input.none": "None selected",
  "video.input.placeholder": "No uploaded file yet...",
  "video.input.selectedAria": "Selected file",
  "video.input.pathLabel": "Local input path (optional)",
  "video.input.pathPlaceholder": "e.g. D:\\Videos\\demo.mp4",
  "video.input.choose": "Choose video file",

  /* Params / presets */
  "video.params.title": "Processing parameters",
  "video.params.model": "Interpolation model",
  "video.params.fps": "Target frame rate",
  "video.params.resolution": "Output resolution",
  "video.params.resolutionSource": "Source",
  "video.params.gpu": "Acceleration device",
  "video.params.precision": "Compute precision",
  "video.params.defaultGpu": "Default GPU",
  "video.preset.title": "Workflow presets",
  "video.preset.desc":
    "Built-in presets can be saved under a new name; custom presets can be overwritten or deleted.",
  "video.preset.current": "Current preset",
  "video.preset.placeholder": "Select a preset",
  "video.preset.builtin": "(built-in)",
  "video.preset.apply": "Apply",
  "video.preset.create": "New",
  "video.preset.save": "Save",
  "video.preset.delete": "Delete",

  /* Video comparison */
  "video.compare.title": "Video preview",
  "video.compare.descBoth": "Drag the slider to compare original and processed",
  "video.compare.descEmpty": "Import a video to preview it here",
  "video.compare.aria": "Video comparison preview",
  "video.compare.none": "No video — please import media",
  "video.compare.before": "Original",
  "video.compare.after": "Processed",
  "video.compare.show": "Show {label}",
  "video.compare.position": "Compare position",

  /* Resource monitor */
  "video.resource.title": "Resource monitor",
  "video.resource.desc": "Local inference resources",
  "video.resource.online": "Service online",
  "video.resource.offline": "Service offline",
  "video.resource.cpu": "CPU",
  "video.resource.gpu": "GPU",
  "video.resource.memory": "Memory",
  "video.resource.vram": "VRAM",
  "video.resource.usageAria": "{label} usage {value}{unit}",

  /* Tasks / render center */
  "tasks.title": "Task management",
  "tasks.crumb": "Tasks",
  "tasks.loadFail": "Unable to load tasks",
  "tasks.activeCount": "{count} in progress",
  "tasks.recordCount": "{count} records",
  "tasks.queueTitle": "Task queue",
  "tasks.queueDesc": "Local render tasks (newest first)",
  "tasks.empty": "No tasks yet — submit a render from Video processing first",
  "tasks.untitled": "Untitled task",
  "tasks.status": "Status",
  "tasks.progress": "Progress",
  "tasks.output": "Output",
  "tasks.logs": "Runtime logs",
  "tasks.errors": "Error logs",
  "tasks.selectTitle": "Select a task",
  "tasks.selectDesc": "Choose a task from the list to view details and preview",
  "tasks.cloudHint":
    "Cloud render API is not connected yet; only local GVFI tasks are shown.",

  /* Logs panel */
  "tasks.logs.title": "Logs",
  "tasks.logs.feedback": "Task feedback",
  "tasks.logs.copy": "Copy",
  "tasks.logs.errors": "Error logs",
  "tasks.logs.copyAll": "Copy all",
  "tasks.logs.copyAllAria": "Copy all error logs",
  "tasks.logs.feedAi": "Feed to AI",
  "tasks.logs.feedAiAria": "Send error logs to AI for analysis",
  "tasks.logs.feedHint":
    "After copying or feeding to AI, paste or auto-fill the full raw log on the AI page for analysis.",

  /* Settings hub */
  "settings.title": "Connection settings",
  "settings.crumb": "Connect",
  "settings.subtitle":
    "Render engine Base URL and timeouts — configure large-model keys in AI Workbench",

  /* API profiles */
  "settings.api.title": "API connection profiles",
  "settings.api.desc":
    "Manually set the render engine base URL, timeout, and auth. The active profile drives all /health, /jobs, and upload requests.",
  "settings.api.route": "Current route: ",
  "settings.api.direct": "Direct fallback: ",
  "settings.api.default": "Default",
  "settings.api.setDefaultAria": "Set as default",
  "settings.api.deleteAria": "Delete profile",
  "settings.api.baseUrl": "Base URL",
  "settings.api.baseUrlPlaceholder": "/api or http://127.0.0.1:8765",
  "settings.api.timeout": "Timeout (ms)",
  "settings.api.concurrency": "Concurrency",
  "settings.api.kind": "Type",
  "settings.api.local": "Local",
  "settings.api.cloud": "Cloud",
  "settings.api.keyLabel": "API Key / Token (optional)",
  "settings.api.keyPlaceholder": "Bearer token (for cloud auth)",
  "settings.api.addSection": "Add profile",
  "settings.api.namePlaceholder": "Name",
  "settings.api.customName": "Custom API",
  "settings.api.addEnable": "Add and enable",

  /* API quick connect */
  "settings.api.quickConnect.title": "One-click local connection",
  "settings.api.quickConnect.desc":
    "First time here? Click the button to auto-detect and connect to the local render engine (127.0.0.1:8765) — no manual configuration needed.",
  "settings.api.quickConnect.button": "Connect to local API",
  "settings.api.quickConnect.checking": "Connecting…",
  "settings.api.quickConnect.success": "Connected to local service — ready to go",
  "settings.api.quickConnect.failed": "Local service not detected",
  "settings.api.quickConnect.hint":
    "Make sure the app has fully started (the desktop app launches the local engine automatically). If it still fails, check System → Logs, or run GVFI_API.cmd from the install folder and retry.",
  "settings.api.quickConnect.notReady":
    "Service responded, but the render engine is not ready",
  "settings.api.quickConnect.logOk": "Quick connect succeeded: local API ready",
  "settings.api.quickConnect.logFail": "Quick connect failed: local API unreachable",
  "settings.api.quickConnect.restart": "Restart local engine",
  "settings.api.quickConnect.restarting": "Restarting…",
  "settings.api.quickConnect.restartFailed":
    "Service still not ready after restart — check System → Logs",
  "settings.api.quickConnect.logRestart": "Requested local engine restart",

  /* Settings layout */
  "settings.aboutLink": "About GVFI",

  /* LLM settings summary */
  "settings.llm.title": "Large model configuration",
  "settings.llm.desc":
    "API Key / Base URL / Temperature and related settings have moved to the AI Workbench",
  "settings.llm.editInAi": "Edit in AI Workbench",
  "settings.llm.provider": "Provider",
  "settings.llm.model": "Model",
  "settings.llm.baseUrl": "Base URL",
  "settings.llm.apiKey": "API Key",
  "settings.llm.configured": "Configured",
  "settings.llm.notConfigured": "Not configured",

  /* Developer settings */
  "settings.developer.runtimeTitle": "Runtime diagnostics",
  "settings.developer.runtimeDesc":
    "Client log buffer, active API routes, and desktop log path.",
  "settings.developer.activeBase": "Active Base: ",
  "settings.developer.directOrigin": "Direct Origin: ",
  "settings.developer.profileCount": "Profiles: {count} · Active ID: {id}",
  "settings.developer.desktopLog": "Desktop log: ",
  "settings.developer.refreshLogs": "Refresh client logs",
  "settings.developer.clear": "Clear",
  "settings.developer.noLogs": "(No client logs yet)",
  "settings.developer.pluginsTitle": "Registered plugins",
  "settings.developer.pluginsDesc":
    "Plugin extension inventory (render backends / models / UI panels).",
  "settings.developer.noPlugins": "No plugins",
  "settings.developer.renderBackend": "Render:{id}",
  "settings.developer.modelPlugins": "Model plugins:{count}",
  "settings.developer.panels": "Panels:{count}",
  "settings.developer.noExtensions": "(No extension points)",
  "system.tab.backup": "Backup",
  "system.backup.title": "Configuration backup",
  "system.backup.desc": "Export or import local settings for migration and recovery.",
  "system.backup.security": "API keys and tokens are excluded by default. Importing a redacted file preserves the secrets already on this device. Only transfer backups between trusted devices.",
  "system.backup.includeSecrets": "Include API keys and tokens (caution)",
  "system.backup.export": "Export configuration",
  "system.backup.import": "Import configuration",
  "system.backup.exported": "Configuration exported",
  "system.backup.imported": "Configuration imported and applied",
  "system.backup.invalid": "Invalid or incompatible backup file",

  /* About page (UI labels only — brand/copyright values stay in @/lib/brand) */
  "about.chromeTitle": "About",
  "about.panelTitle": "About GVFI",
  "about.version": "Version {version}",
  "about.developerLabel": "Developer",
  "about.copyrightLabel": "Copyright",
  "about.creditLabel": "Credit",
  "about.backHome": "Back to home",
  "about.feedbackLabel": "Feedback",
  "about.feedbackHint":
    "Include the app version, Windows version, and a log excerpt. Never send API keys.",
  "about.feedbackEmail": "Email support",
  "about.feedbackWeb": "Open feedback page",
  "about.upgradeLabel": "Upgrade & rollback",
  "about.upgradeHint":
    "Upgrades are manual for this release: quit the app, then install the new Setup. Keep the previous installer and its SHA-256 for rollback. Auto-update is not enabled yet.",

  /* Task stage labels */
  "tasks.stage.queued": "Queued",
  "tasks.stage.extract": "Extract frames",
  "tasks.stage.rife": "Interpolate",
  "tasks.stage.upsample": "Upscale",
  "tasks.stage.encode": "Encode",
  "tasks.stage.done": "Done",

  /* Action / output panels (video workspace) */
  "video.action.title": "Render controls",
  "video.action.start": "▶ Start render",
  "video.action.stop": "■ Stop",
  "video.outputPanel.title": "Output",
  "video.outputPanel.desc":
    "The output directory is managed by the GVFI service; the actual file path appears when complete.",
  "video.outputPanel.dirLabel": "Service output directory",
  "video.outputPanel.lastLabel": "Latest output file",
  "video.outputPanel.placeholder": "Not generated yet",

  /* Landing */
  "landing.nav.features": "Features",
  "landing.nav.workflow": "Workflow",
  "landing.nav.pricing": "Plans",
  "landing.nav.console": "Console",
  "landing.nav.about": "About",
  "landing.nav.primaryAria": "Primary navigation",
  "landing.nav.footerAria": "Footer navigation",
  "landing.header.openApp": "Open App",
  "landing.hero.eyebrow": "AI frame interpolation",
  "landing.hero.titleLine1": "Make every frame",
  "landing.hero.titleLine2": "silky smooth",
  "landing.hero.desc":
    "GVFI wraps RIFE in a clean iOS-style experience. Upload, preset, render — pro interpolation and upscaling at your fingertips.",
  "landing.hero.start": "Get started",
  "landing.hero.learnFlow": "See the workflow",
  "landing.hero.previewLabel": "Console preview",
  "landing.hero.dropHint": "Drop a video here",
  "landing.hero.renderCta": "Start render",
  "landing.features.title": "Features",
  "landing.features.subtitle": "A video toolkit built for creators",
  "landing.features.interpolate.title": "Smart interpolation",
  "landing.features.interpolate.desc": "RIFE models smooth up to 120/240fps",
  "landing.features.upscale.title": "Upscale enhance",
  "landing.features.upscale.desc": "RealCUGAN / RealESRGAN options",
  "landing.features.gpu.title": "GPU acceleration",
  "landing.features.gpu.desc": "Local Vulkan-accelerated rendering",
  "landing.features.presets.title": "Preset workflows",
  "landing.features.presets.desc": "One-click anime, film, and more",
  "landing.steps.title": "Workflow",
  "landing.steps.subtitle": "Three steps — no command line",
  "landing.steps.stepLabel": "Step {n}",
  "landing.steps.upload.title": "Upload media",
  "landing.steps.upload.desc": "Drag a video or enter a local path",
  "landing.steps.preset.title": "Choose a preset",
  "landing.steps.preset.desc": "FPS, model, and upscale settings",
  "landing.steps.render.title": "Start render",
  "landing.steps.render.desc": "Live progress and log feedback",
  "landing.pricing.title": "Plans",
  "landing.pricing.subtitle": "The console is open for free use today",
  "landing.pricing.free.name": "Free trial",
  "landing.pricing.free.desc": "Local GVFI for personal tryouts",
  "landing.pricing.free.f1": "Basic RIFE models",
  "landing.pricing.free.f2": "Single-task queue",
  "landing.pricing.free.f3": "iOS-style console",
  "landing.pricing.creator.name": "Creator",
  "landing.pricing.creator.desc": "High-frequency interpolate & upscale",
  "landing.pricing.creator.f1": "All models",
  "landing.pricing.creator.f2": "Batch queue",
  "landing.pricing.creator.f3": "Priority GPU",
  "landing.pricing.creator.f4": "Export history",
  "landing.pricing.team.name": "Team",
  "landing.pricing.team.desc": "Multi-member collaboration",
  "landing.pricing.team.f1": "5 seats",
  "landing.pricing.team.f2": "Shared board",
  "landing.pricing.team.f3": "API access",
  "landing.pricing.team.f4": "Tech support",
  "landing.pricing.perMonth": "/mo",
  "landing.pricing.chooseCreator": "Choose Creator",
  "landing.pricing.start": "Get started",
  "landing.cta.title": "Ready to begin?",
  "landing.cta.desc":
    "Launch GVFI, open the console, and finish your first interpolate in minutes.",
  "landing.cta.openConsole": "Open console",

  /* Process workspace */
  "process.mode.local": "Local interpolate",
  "process.llmMovedBefore": "Large-model video analysis has moved to",
  "process.llmMovedLink": "AI Workbench",
  "process.input.llmHint":
    "For AI large-model mode, select a video above, then open Settings to fill analysis parameters and start.",
  "process.input.addVideo": "Add a video above first",
  "process.input.addHint": "Drag to upload, or enter a local absolute path",
  "process.preset.notFound": "Preset not found: {name}",
  "process.preset.applied": "Applied “{name}”",
  "process.preset.appliedDetail": "Applied “{name}”",
  "process.preset.namePrompt": "Preset name:",
  "process.preset.emptyName": "Could not create preset: name is required.",
  "process.preset.cannotOverwrite":
    "Cannot overwrite a built-in preset name. Choose another.",
  "process.preset.created": "Created “{name}”",
  "process.preset.saveAsPrompt": "Save built-in preset as a new name:",
  "process.preset.saveAsDefault": "{name}-custom",
  "process.preset.cannotOverwriteShort": "Cannot overwrite a built-in preset name.",
  "process.preset.saved": "Saved “{name}”",
  "process.preset.cannotDeleteBuiltin": "Built-in presets cannot be deleted.",
  "process.preset.confirmDelete": "Delete “{name}”?",
  "process.preset.deleted": "Deleted “{name}”",
  "process.err.needInput": "Upload a video or enter a local input path first.",
  "process.err.serviceDown": "GVFI service unavailable. Run GVFI_API.cmd first.",
  "process.err.needLlmKey": "Configure a large-model API key in API settings first.",
  "process.err.noCancelTarget": "No cancellable task right now.",
  "process.stage.wrap": "● Current stage: {detail}",
  "process.stage.withMessage": "● Current stage: {stage} · {message}",
  "process.stage.submitJob": "Submitting job",
  "process.stage.submitFail": "Submit failed",
  "process.stage.submitAi": "Submitting AI analysis",
  "process.stage.stopping": "Stopping",
  "process.stage.ready": "Ready",
  "process.stage.notReady": "Service not ready",
  "process.stage.connecting": "Connecting to service…",
  "process.stage.connectFail": "Cannot connect to GVFI",
  "process.stage.queued": "Queued",
  "process.stage.extract": "Extract frames",
  "process.stage.rife": "RIFE interpolate",
  "process.stage.interpolate": "Interpolate",
  "process.stage.upsample": "Upscale",
  "process.stage.encode": "Encode video",
  "process.stage.analyze": "AI analysis",
  "process.stage.doneFull": "Completed",
  "process.stage.cancelled": "Cancelled",
  "process.stage.failed": "Failed",
  "process.log.submitJob": "Submit job: {name} · {fps}fps · {model}",
  "process.log.submitLlm": "Submit LLM job: {name} · {model}",
  "process.log.cancelRequested": "Cancel requested",
  "process.gpu.indexed": "GPU {index}",
  "process.health.warning": "Service warning: {warnings}",
  "process.health.connected":
    "Connected to GVFI · {models} models · {gpus} GPUs",
  "process.health.connectFailDetail":
    "Cannot connect to GVFI. Run GVFI_API.cmd first.",

  /* Analysis report */
  "report.title": "AI analysis report",
  "report.emptyDesc":
    "After large-model analysis finishes, the Markdown report appears here.",
  "report.empty": "No analysis report yet",
  "report.emptyHint":
    "Start AI analysis in Settings — results show up here automatically",
  "report.previewDesc": "Markdown visual preview",
  "report.refreshAria": "Refresh report",
  "report.refresh": "Refresh",
  "report.copy": "Copy",
  "report.copied": "Copied",
  "report.modelMeta": "Model · {model}",
  "report.framesMeta": "Frames · {frames}",
  "report.loading": "Loading report…",
  "report.emptyContent": "Report is empty",

  /* LLM video panel */
  "llm.panel.needKeyBefore": "Configure a large-model API key in",
  "llm.panel.settingsLink": "Settings",
  "llm.panel.needKeyAfter": "first.",
  "llm.panel.title": "AI large-model video processing",
  "llm.panel.desc":
    "Extract key frames and call a vision model to produce scene analysis, summaries, or enhancement suggestions.",
  "llm.panel.taskType": "Analysis type",
  "llm.panel.customPrompt": "Custom prompt (optional; leave blank for preset)",
  "llm.panel.maxFrames": "Frame count (1–24)",
  "llm.panel.runTitle": "Run controls",
  "llm.panel.progress": "Analysis progress",
  "llm.panel.progressAria": "LLM analysis progress",
  "llm.panel.start": "Start AI analysis",
  "llm.panel.stop": "Stop",
  "llm.panel.reportReady": "Report ready — see the visual panel below",
  "llm.task.analyze": "Scene analysis",
  "llm.task.summary": "Content summary",
  "llm.task.enhance": "Smart enhance suggestions",
  "llm.provider.custom": "Custom (OpenAI-compatible)",
  "video.preset.name.anime": "Anime interpolate",
  "video.preset.name.cinema": "Cinema HD",
  "video.preset.name.svfi": "SVFI style",

  /* SVFI / super-resolution panel */
  "svfi.title": "Upscale & quality",
  "svfi.enable": "Enable upscale",
  "svfi.model": "Upscale model",
  "svfi.quality": "Quality level",

  /* Compact KPI row */
  "kpi.row.aria": "Status overview",
  "kpi.row.progress": "Progress",
  "kpi.row.queue": "Queue",

  /* Misc chrome */
  "glass.logs.empty": "No logs yet",
  "common.continue": "Continue",
  "brand.copyrightAria": "Copyright information",
  "chrome.documentTitle": "GVFI · AI Video Workstation",

  "jobs.warnPrefix": "Warning: {warnings}",
  "jobs.taskStatus": "Task {status}",
  "jobs.donePrefix": "Done: {detail}",
  "preset.builtin.anime": "Anime interpolate",
  "preset.builtin.film": "Film HD",
  "preset.builtin.svfi": "SVFI style",
  "liquid.navAria": "Liquid Glass navigation",
  "liquid.controlAria": "Liquid Glass control panel",
  "settings.api.logSwitched": "Switched API profile: {name}",
  "settings.api.logAdded": "Added API profile",

  /* API client error fallbacks */
  "api.err.appearanceRead": "Failed to read appearance settings ({status})",
  "api.err.logsRead": "Failed to read logs ({status})",
  "api.err.health": "GVFI health check failed ({status})",
  "api.err.jobsList": "Failed to list jobs ({status})",
  "api.err.jobGet": "Failed to fetch job ({status})",
  "api.err.start": "Failed to start ({status})",
  "api.err.cancel": "Failed to cancel ({status})",

  /* Brand (UI copy — legal lines stay in @/lib/brand) */
  "brand.tagline": "AI Video Workstation",

  /* API profile builtin names */
  "api.profile.localProxy": "Local proxy (/api)",
  "api.profile.localDirect": "Local direct (:8765)",

  /* Session / tools / plugins */
  "ai.session.newDefault": "New session",
  "plugin.local.description": "Local GVFI API (gvfi_api.py) render backend",
  "plugin.local.label": "Local render",
  "ai.tool.videoAnalyze.label": "Video vision analysis",
  "ai.tool.videoAnalyze.desc":
    "Submit a local gvfi_api LLM job via AI Gateway",
  "ai.tool.submitted": "Submitted",

  /* Runtime / service errors */
  "err.cloudUnconfigured": "Cloud render backend is not configured",
  "err.cloudUnimplemented": "Cloud render ({url}) is not implemented yet",
  "err.unknownRenderBackend": "Unknown render backend: {id}",
  "err.missingApiKey":
    "API Key is missing — configure it in the AI workspace panel",
  "err.missingBaseUrl": "Base URL is missing",
  "err.chatFailed": "Chat request failed",
  "err.upstreamHttp": "Upstream error HTTP {status}",
  "err.connectOk": "Connected ({model})",
  "err.connectEmpty": "Connected but the model returned an empty reply",
  "err.reportPathEmpty": "Report path is empty",
  "err.reportRead": "Failed to read report ({status})",
  "err.connectTestFail": "Connection test failed ({status})",
  "err.llmStartFail": "Failed to start LLM job ({status})",
  "err.pluginsOverwrite": "Overwriting registered plugin: {id}",

  /* AI system / error-log bridge */
  "ai.systemHint":
    "You are the GVFI AI workspace assistant for video failure diagnosis, render-parameter fixes, and text-file edits. Reply concisely in English. When analyzing errors or editing files, ALWAYS append a ```gvfi-fix JSON fence at the end: {\"diagnosis\":\"brief diagnosis\",\"settings_patch\":{\"fps\":60,\"superResolution\":false} or null,\"file_edits\":[{\"path\":\"optional abs path\",\"name\":\"filename\",\"content\":\"full revised text\"}] or null}. Put only safe render fields in settings_patch; use null if none. Put complete revised file bodies in file_edits; use null if none. Never claim you overwrote the original file.",
  "ai.errorLog.intro":
    "Analyze the following GVFI video-processing error log: locate the issue, explain the failure, and propose actionable fixes. If render parameters can be adjusted, put suggestions in settings_patch.",
  "ai.errorLog.keepRaw":
    "Preserve paths, exit codes, and stack traces from the log; do not omit critical lines. End your reply with a ```gvfi-fix structured block.",
  "ai.errorLog.begin": "----- RAW ERROR LOG START -----",
  "ai.errorLog.end": "----- RAW ERROR LOG END -----",

  /* AI fix actions */
  "ai.fix.diagnosisLabel": "Diagnosis:",
  "ai.fix.applyRetry": "Apply fix settings and retry",
  "ai.fix.saveCopies": "Save modified copies ({count})",
  "ai.fix.needInputPath":
    "Missing input video path. Re-select the file on the Video page, or have the model set settings_patch.inputPath.",
  "ai.fix.retryStarted": "Submitted retry job {id}…",
  "ai.fix.retryOk":
    "Retry started ({id}) — check progress on Video / Tasks",
  "ai.fix.retryFail": "Retry failed",
  "ai.fix.saveOk": "Saved {count} copies ({mode})",
  "ai.fix.saveFail": "Failed to save copies",
  "ai.fix.modeDesktop": "written to disk",
  "ai.fix.modeDownload": "download started",
  "ai.fix.reveal": "Show in folder",

  /* LLM provider / task prompts */
  "llm.provider.openai": "OpenAI",
  "llm.provider.openai.hint": "Supports GPT-4o vision analysis",
  "llm.provider.deepseek": "DeepSeek",
  "llm.provider.moonshot": "Moonshot (Kimi)",
  "llm.provider.custom.hint":
    "Enter an OpenAI Chat Completions-compatible Base URL",
  "llm.task.analyze.prompt":
    "Analyze each frame for content, camera motion, subjects, and scene changes; recommend post steps (interpolation / upscale / grading).",
  "llm.task.summary.prompt":
    "Summarize the video's main content, key events, and timeline in English — suitable as a short description.",
  "llm.task.enhance.prompt":
    "Assess noise, blur, and exposure; recommend concrete AI enhancement settings (target FPS, whether to upscale, model type).",

  /* About metadata */
  "about.metaTitle": "About · GVFI",
  "about.metaDesc": "GVFI software information and version",

  /* Electron desktop shell */
  "desktop.bootFailedTitle": "GVFI failed to start",
  "desktop.bootFailedBody": "{message}\n\nLog: {log}",
  "desktop.pageLoadFail": "Page failed to load ({code}): {desc}\n{url}",
  "desktop.waitTimeout": "Timed out waiting for service: {url}",
  "desktop.standaloneMissing": "Standalone server not found: {path}",
  "desktop.depsMissing":
    "Standalone dependencies missing (node_modules/next). Rebuild the desktop app or run scripts\\sync-desktop-ui.cmd.",
  "desktop.splashTagline": "AI Video Workstation",

  /* Legal */
  "legal.chromeTitle": "Legal & licenses",
  "legal.tab.privacy": "Privacy policy",
  "legal.tab.terms": "User agreement",
  "legal.tab.licenses": "Third-party licenses",
  "legal.privacy.title": "Privacy policy",
  "legal.privacy.updated": "Last updated: 2026-08-09",
  "legal.privacy.p1":
    "{app} Desktop processes video locally by default. Videos, job logs, and appearance settings stay on your machine. The installer does not collect account passwords.",
  "legal.privacy.p2":
    "LLM API keys are stored only in local browser storage on this device — never in frontend source code or the install package. Diagnostic logs redact tokens and Authorization headers.",
  "legal.privacy.p3":
    "When you enable cloud LLM analysis, extracted frames and requests go to the third-party provider you configure; that provider’s policy then applies.",
  "legal.privacy.p4":
    "The local API listens on 127.0.0.1 by default. Uploads live under user_data/uploads on this machine and temporary uploads are cleaned up after jobs when possible.",
  "legal.privacy.p5":
    "For more detail, see the User agreement and Third-party licenses, or contact the developer Mr. Gong.",
  "legal.terms.title": "User agreement",
  "legal.terms.updated": "Last updated: 2026-08-09",
  "legal.terms.p1":
    "You confirm you have the rights to any video or path content submitted to {app} and will comply with applicable law.",
  "legal.terms.p2":
    "The software is provided “as is”. Results of interpolation or analysis are not guaranteed — validate on samples before production use.",
  "legal.terms.p3":
    "Cracking, reselling, or removing copyright notices is prohibited. Third-party models and cloud services have their own terms.",
  "legal.terms.p4":
    "By continuing to use this software you agree to this agreement and the Privacy policy.",
  "legal.licenses.title": "Third-party licenses",
  "legal.licenses.p1":
    "This product uses or ships with the following open-source / third-party components (licenses are defined by their upstream projects):",
  "legal.licenses.item.next": "Next.js / React — MIT",
  "legal.licenses.item.electron": "Electron — MIT",
  "legal.licenses.item.rife": "RIFE / rife-ncnn-vulkan — upstream project licenses",
  "legal.licenses.item.ffmpeg": "FFmpeg — LGPL/GPL (build-dependent)",
  "legal.licenses.item.llm": "Optional cloud LLM APIs — vendor terms",
  "legal.licenses.p2":
    "When redistributing binaries that include these components, follow each license’s obligations.",
  "legal.licenses.fileHint":
    "See THIRD_PARTY_NOTICES.md in the source tree or install folder for the full list.",
};

