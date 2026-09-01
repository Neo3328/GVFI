#!/usr/bin/env python3
"""GVFI full-project archive audit (Phase 1+2 inventory). Read-only; writes docs only."""
from __future__ import annotations

import hashlib
import os
import re
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"d:\BaiduNetdiskDownload\GVFI")
OUT = ROOT / "docs" / "github" / "full-project-inventory.md"

THRESHOLDS = [
    (50 * 1024 * 1024, "gt_50mb"),
    (100 * 1024 * 1024, "gt_100mb"),
    (500 * 1024 * 1024, "gt_500mb"),
    (1024 * 1024 * 1024, "gt_1gb"),
]

MODEL_EXTS = {".bin", ".param", ".weights", ".pth", ".pt", ".onnx", ".pkl", ".pickle", ".engine"}
BIN_EXTS = {".exe", ".dll", ".lib", ".pdb"}
VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"}
SRC_PY = {".py"}
SRC_CPP = {".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx", ".inl"}
SRC_WEB = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".html"}
DOC_EXTS = {".md", ".rst", ".txt"}
CFG_EXTS = {".json", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".xml", ".cmake"}

SECRET_PATTERNS = [
    (re.compile(r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}"), "api_key"),
    (re.compile(r"(?i)(secret[_-]?key|client[_-]?secret)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{8,}"), "secret"),
    (re.compile(r"(?i)(access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*['\"]?[A-Za-z0-9_\-\.]{16,}"), "token"),
    (re.compile(r"(?i)password\s*[:=]\s*['\"][^'\"]{4,}"), "password"),
    (re.compile(r"-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"), "private_key"),
    (re.compile(r"(?i)(aws_access_key_id|aws_secret_access_key)\s*[:=]"), "aws"),
    (re.compile(r"(?i)(sk-[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_\-]{20,})"), "openai_like_key"),
    (re.compile(r"(?i)(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})"), "github_token"),
    (re.compile(r"(?i)(xox[baprs]-[A-Za-z0-9-]{10,})"), "slack_token"),
]

TEXT_SCAN_EXTS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yml", ".yaml",
    ".toml", ".env", ".md", ".txt", ".cfg", ".ini", ".conf", ".ps1", ".cmd", ".bat",
    ".vbs", ".sh", ".cmake", ".h", ".hpp", ".cpp", ".c", ".html", ".css",
}
SECRET_SKIP_DIRS = {
    "node_modules", ".next", "__pycache__", ".git", "dist-gvfi", "dist-gvfi-build",
    "dist-gvfi-fresh", "dist-desktop", "_asar-repack", "_asar-extract", "AI_Tools",
    "CMakeFiles", "build", "venv", ".venv",
}


def fmt(n: float) -> str:
    n = float(n)
    for u in ["B", "KB", "MB", "GB", "TB"]:
        if n < 1024 or u == "TB":
            return f"{int(n)} B" if u == "B" else f"{n:.2f} {u}"
        n /= 1024.0
    return f"{n:.2f} TB"


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8", errors="replace")
    return (p.stdout or "") + (("\n" + p.stderr) if p.stderr else "")


def is_cache_temp(rel: str) -> bool:
    low = rel.replace("\\", "/").lower()
    needles = [
        "node_modules/", "__pycache__/", ".next/", "/build/", "cmakefiles/",
        "cmake-build", ".cache/", "/tmp/", "/temp/", "dist-gvfi", "dist-desktop",
        "dist-gvfi-build", "dist-gvfi-fresh", "_asar-repack", "_asar-extract",
        ".pyc", "coverage/", "test-results/", "playwright-report/",
        ".cleanup-quarantine/", "user_data/", "uploads/", ".venv/", "venv/",
    ]
    return any(n in low for n in needles) or low.endswith(".log") or low.endswith(".pdb")


def path_category(rel: str, ext: str) -> str:
    low = rel.replace("\\", "/").lower()
    if is_cache_temp(rel):
        return "C_cache_temp"
    if ext in MODEL_EXTS or "/models/" in low or "rife-" in low and ext in {".bin", ".param"}:
        return "B_lfs_candidate"
    if ext in BIN_EXTS and not is_cache_temp(rel):
        return "B_lfs_candidate"
    if ext in VIDEO_EXTS and not is_cache_temp(rel):
        return "B_lfs_candidate"
    if ext in {".zip", ".7z", ".rar", ".tar", ".gz", ".tgz", ".asar"} and Path(rel).stat().st_size if False else True:
        # size checked later
        pass
    if ext in SRC_PY | SRC_CPP | SRC_WEB | DOC_EXTS | CFG_EXTS | {".glsl", ".comp", ".vert", ".frag", ".spv"}:
        return "A_regular_git"
    if ext in {".cmd", ".bat", ".vbs", ".ps1", ".sh"}:
        return "A_regular_git"
    return "A_or_review"


def main() -> None:
    print("Collecting git file sets...", flush=True)
    tracked = set()
    for line in run(["git", "ls-files"]).splitlines():
        line = line.strip()
        if line:
            tracked.add(line.replace("/", "\\") if os.name == "nt" else line)
            tracked.add(line.replace("\\", "/"))

    # ignored: git status --ignored --porcelain
    ignored_paths: set[str] = set()
    untracked_paths: set[str] = set()
    for line in run(["git", "status", "--ignored", "--porcelain", "-u"]).splitlines():
        if not line:
            continue
        code = line[:2]
        path = line[3:].strip().strip('"')
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        norm = path.replace("\\", "/")
        if code == "!!":
            ignored_paths.add(norm)
        elif code in {"??", "A ", "AM", "AD"} or code.startswith("?"):
            untracked_paths.add(norm)

    # Also use check-ignore for accuracy on sample later; for counts walk FS
    print("Walking filesystem...", flush=True)
    all_files: list[tuple[str, int, str]] = []  # rel_posix, size, ext
    dir_count = 0
    top_sizes: dict[str, int] = defaultdict(int)
    ext_stats: dict[str, dict] = defaultdict(lambda: {"count": 0, "size": 0})
    errors: list[str] = []

    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        if rel_dir == ".git" or rel_dir.startswith(".git" + os.sep):
            dirnames[:] = []
            continue
        if ".git" in dirnames:
            dirnames.remove(".git")
        dir_count += 1
        for f in filenames:
            fp = os.path.join(dirpath, f)
            try:
                sz = os.path.getsize(fp)
            except OSError as e:
                errors.append(str(e))
                continue
            rel = os.path.relpath(fp, ROOT)
            rel_posix = rel.replace("\\", "/")
            ext = Path(f).suffix.lower()
            all_files.append((rel_posix, sz, ext))
            top = Path(rel).parts[0]
            top_sizes[top] += sz
            key = ext if ext else "(noext)"
            ext_stats[key]["count"] += 1
            ext_stats[key]["size"] += sz

    total_files = len(all_files)
    total_size = sum(s for _, s, _ in all_files)
    print(f"Files={total_files} dirs={dir_count} size={fmt(total_size)}", flush=True)

    # Classify git membership for every file
    tracked_files = []
    untracked_files = []
    ignored_files = []
    other_files = []

    # Expand directory-level ignore markers from git status
    ignored_prefixes = [p for p in ignored_paths if p.endswith("/")]
    ignored_exact = {p.rstrip("/") for p in ignored_paths}

    def is_ignored(rel_posix: str) -> bool:
        if rel_posix in ignored_exact or (rel_posix + "/") in ignored_paths:
            return True
        for pref in ignored_prefixes:
            if rel_posix.startswith(pref) or rel_posix.startswith(pref.rstrip("/") + "/"):
                return True
        # common ignore heuristics matching .gitignore when git status collapsed dirs
        low = rel_posix.lower()
        if low.startswith("ai_tools/"):
            return True
        if "/node_modules/" in f"/{low}" or low.startswith("web-ui/node_modules/"):
            return True
        if "/__pycache__/" in f"/{low}" or low.endswith(".pyc"):
            return True
        if low.startswith("web-ui/.next/") or low.startswith("web-ui/dist-"):
            return True
        if low.startswith("web-ui/_asar-"):
            return True
        if low.startswith("eccv2022-rife/dist/") or low.startswith("eccv2022-rife/build/"):
            return True
        if low.startswith("eccv2022-rife/user_data/"):
            return True
        if low.startswith("eccv2022-rife/models/"):
            return True
        if low.startswith("native/build/"):
            return True
        if low.endswith((".mp4", ".mkv", ".avi", ".mov")) and not low.startswith("web-ui/public/"):
            return True
        if low.endswith((".bin", ".param", ".pt", ".pth", ".onnx")) and low.startswith("eccv2022-rife/"):
            return True
        if low.endswith((".pdb", ".lib")):
            return True
        if low.endswith(".log"):
            return True
        if low.endswith(".asar"):
            return True
        if "rife-ncnn-vulkan" in low and low.startswith("eccv2022-rife/"):
            return True
        if "/realesrgan" in low and low.startswith("eccv2022-rife/"):
            return True
        if low in {"eccv2022-rife/ffmpeg.exe", "eccv2022-rife/ffprobe.exe", "eccv2022-rife/realesrgan-ncnn-vulkan.exe"}:
            return True
        if low.startswith("native/tools/") and low.endswith(".zip"):
            return True
        if low.startswith(".cursor/") and not low.startswith(".cursor/rules/"):
            return True
        return False

    tracked_norm = {p.replace("\\", "/") for p in tracked}

    for rel, sz, ext in all_files:
        if rel in tracked_norm:
            tracked_files.append((rel, sz, ext))
        elif is_ignored(rel):
            ignored_files.append((rel, sz, ext))
        else:
            # untracked visible or unknown
            if rel in untracked_paths or any(rel.startswith(u.rstrip("/") + "/") for u in untracked_paths if u.endswith("/")) or rel in {u.replace("\\", "/") for u in untracked_paths}:
                untracked_files.append((rel, sz, ext))
            else:
                # likely ignored but not listed as dir (git status collapses)
                # double-check with check-ignore for uncertain — too slow for all; use heuristic
                if is_cache_temp(rel):
                    ignored_files.append((rel, sz, ext))
                else:
                    untracked_files.append((rel, sz, ext))

    # Large files
    by_thresh = {
        "gt_50mb": [],
        "gt_100mb": [],
        "gt_500mb": [],
        "gt_1gb": [],
    }
    for rel, sz, ext in all_files:
        if sz > 1024 * 1024 * 1024:
            by_thresh["gt_1gb"].append((rel, sz, ext))
        if sz > 500 * 1024 * 1024:
            by_thresh["gt_500mb"].append((rel, sz, ext))
        if sz > 100 * 1024 * 1024:
            by_thresh["gt_100mb"].append((rel, sz, ext))
        if sz > 50 * 1024 * 1024:
            by_thresh["gt_50mb"].append((rel, sz, ext))

    def filt_ext(exts):
        return [(r, s, e) for r, s, e in all_files if e in exts]

    exe = filt_ext({".exe"})
    dll = filt_ext({".dll"})
    lib = filt_ext({".lib"})
    pdb = filt_ext({".pdb"})
    models = [(r, s, e) for r, s, e in all_files if e in MODEL_EXTS]
    videos = filt_ext(VIDEO_EXTS)
    py_files = [(r, s, e) for r, s, e in all_files if e in SRC_PY and not is_cache_temp(r)]
    cpp_files = [(r, s, e) for r, s, e in all_files if e in SRC_CPP and not is_cache_temp(r)]
    web_files = [(r, s, e) for r, s, e in all_files if e in SRC_WEB and "node_modules" not in r and not is_cache_temp(r)]
    docs = [(r, s, e) for r, s, e in all_files if e in DOC_EXTS or r.startswith("docs/")]
    native = [(r, s, e) for r, s, e in all_files if r.startswith("native/")]
    frontend = [(r, s, e) for r, s, e in all_files if r.startswith("web-ui/")]
    ncnn = [(r, s, e) for r, s, e in all_files if "ncnn" in r.lower()]
    vulkan = [(r, s, e) for r, s, e in all_files if "vulkan" in r.lower()]
    rife = [(r, s, e) for r, s, e in all_files if "rife" in r.lower()]
    c6 = [(r, s, e) for r, s, e in all_files if re.search(r"(^|[/_\-])c6([._\-]|\d)", r.lower())]
    c7 = [(r, s, e) for r, s, e in all_files if re.search(r"(^|[/_\-])c7([._\-]|\d)", r.lower())]
    c8 = [(r, s, e) for r, s, e in all_files if re.search(r"(^|[/_\-])c8([._\-]|\d)", r.lower())]
    bench = [(r, s, e) for r, s, e in all_files if "benchmark" in r.lower() or "profile" in r.lower()]

    # Ignored but possibly needed for restore
    needed_ignore_patterns = [
        ("AI_Tools/", "完整本地工具链（RIFE/RealCUGAN/FFmpeg）；恢复运行常需要，但体积巨大且多为第三方"),
        ("ECCV2022-RIFE/models/", "RIFE/超分模型权重；运行必需"),
        ("ECCV2022-RIFE/**/*.bin|*.param|*.pt|*.pth|*.onnx", "ncnn/Torch 模型文件；运行必需"),
        ("ECCV2022-RIFE/**/rife-ncnn-vulkan*/", "RIFE CLI 可执行与模型包；当前 production CLI 路径依赖"),
        ("ECCV2022-RIFE/ffmpeg.exe / ffprobe.exe", "音视频管线必需二进制"),
        ("ECCV2022-RIFE/realesrgan*", "超分可执行与模型"),
        ("ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll", "Native 后端 DLL（若走 native）；文件本身可能被 *.dll 规则以外跟踪——需核对"),
        ("native/tools/*.zip", "本地构建工具包（如 zig）；可再下载"),
        ("*.lib / *.pdb", "MSVC 链接/调试产物；通常可重建，但完整调试归档可能需要"),
        ("web-ui/node_modules/", "可 npm install 重建"),
        ("web-ui/.next/ / dist-*", "可重建前端产物"),
        ("ECCV2022-RIFE/dist/ / build/", "PyInstaller 打包产物；可重建"),
        ("*.mp4 等视频", "测试/用户视频；实验复现可能需要部分样本"),
    ]

    # Secrets scan (text files, skip huge caches)
    print("Scanning for secrets...", flush=True)
    secret_hits: list[tuple[str, int, str, str]] = []  # path, line, kind, snippet
    env_files: list[tuple[str, int]] = []
    for rel, sz, ext in all_files:
        name = Path(rel).name.lower()
        if name == ".env" or name.startswith(".env."):
            env_files.append((rel, sz))
        parts = set(rel.replace("\\", "/").split("/"))
        if parts & SECRET_SKIP_DIRS:
            continue
        if is_cache_temp(rel):
            continue
        if ext not in TEXT_SCAN_EXTS and name not in {".env", ".env.example", ".gitignore"}:
            continue
        if sz > 2 * 1024 * 1024:
            continue
        fp = ROOT / rel
        try:
            text = fp.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            # skip obvious placeholders
            if re.search(r"(?i)(your[_-]?api[_-]?key|xxx+|placeholder|example\.com|changeme|<api|TODO)", line):
                continue
            for pat, kind in SECRET_PATTERNS:
                if pat.search(line):
                    snippet = line.strip()
                    if len(snippet) > 120:
                        snippet = snippet[:117] + "..."
                    secret_hits.append((rel, i, kind, snippet))
                    break

    # Git history large blobs
    print("Checking git history for large blobs...", flush=True)
    hist_large: list[str] = []
    # Use git rev-list + cat-file batch roughly via git verify-pack if pack exists
    pack_out = run(["git", "rev-list", "--objects", "--all"])
    # Map oid -> path from rev-list; then size via cat-file --batch-check (sample approach)
    # Faster: git lfs ls-files; and find blobs >50MB with python via git cat-file
    oids = []
    oid_path = {}
    for line in pack_out.splitlines():
        parts = line.split(" ", 1)
        if not parts or len(parts[0]) < 40:
            continue
        oid = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        oid_path[oid] = path
        oids.append(oid)

    # batch-check in chunks
    large_hist = []
    chunk = 2000
    for i in range(0, min(len(oids), 200000), chunk):
        batch = oids[i : i + chunk]
        p = subprocess.run(
            ["git", "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
            cwd=str(ROOT),
            input="\n".join(batch) + "\n",
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        for line in (p.stdout or "").splitlines():
            bits = line.split()
            if len(bits) >= 3 and bits[1] == "blob":
                try:
                    sz = int(bits[2])
                except ValueError:
                    continue
                if sz > 50 * 1024 * 1024:
                    large_hist.append((bits[0], sz, oid_path.get(bits[0], "")))

    large_hist.sort(key=lambda x: -x[1])

    # Git LFS status
    lfs_ver = run(["git", "lfs", "version"]).strip()
    lfs_tracked = run(["git", "lfs", "ls-files"]).strip()
    lfs_attrs = ""
    ga = ROOT / ".gitattributes"
    if ga.exists():
        lfs_attrs = ga.read_text(encoding="utf-8", errors="ignore")

    # SHA256 for important large non-cache files (>50MB, or models/dll/exe under ECCV/native)
    print("Hashing important large files...", flush=True)
    hash_targets = []
    for rel, sz, ext in sorted(all_files, key=lambda x: -x[1]):
        if is_cache_temp(rel):
            continue
        if sz > 50 * 1024 * 1024:
            hash_targets.append((rel, sz, ext))
        elif ext in MODEL_EXTS | {".dll", ".exe"} and sz > 1 * 1024 * 1024 and (
            rel.startswith("ECCV2022-RIFE/") or rel.startswith("native/") or rel.startswith("AI_Tools/")
        ):
            hash_targets.append((rel, sz, ext))
        if len(hash_targets) >= 120:
            break

    hashes: list[tuple[str, int, str, str]] = []
    for rel, sz, ext in hash_targets:
        h = hashlib.sha256()
        try:
            with open(ROOT / rel, "rb") as f:
                while True:
                    b = f.read(1024 * 1024)
                    if not b:
                        break
                    h.update(b)
            hashes.append((rel, sz, ext, h.hexdigest()))
        except OSError as e:
            hashes.append((rel, sz, ext, f"ERROR:{e}"))

    # Cannot enter GitHub easily
    cannot_regular = [(r, s, e) for r, s, e in all_files if s > 100 * 1024 * 1024]
    github_lfs_soft_limit_note = "GitHub LFS recommended; single file still has practical limits; >2GB problematic"
    external_archive = [
        (r, s, e)
        for r, s, e in all_files
        if (s > 500 * 1024 * 1024 and r.startswith("AI_Tools/"))
        or (s > 1024 * 1024 * 1024)
    ]

    # Write markdown
    lines: list[str] = []
    def w(s: str = "") -> None:
        lines.append(s)

    w("# GVFI Full Project Inventory")
    w()
    w("> Phase 1–2 archive audit. **No files deleted. No commit. No push.**")
    w()
    w("## 0. Git snapshot")
    w()
    w(f"- **Root:** `{ROOT}`")
    w(f"- **Branch:** `docs/baidu-mirror-and-download-guide` (ahead of origin by 14)")
    w(f"- **Remote:** `origin` → `https://github.com/Neo3328/GVFI.git`")
    w(f"- **HEAD:** `d9152dd` — feat: add native backend production fallback")
    w(f"- **Tracked files (`git ls-files`):** {len(tracked_norm):,}")
    w(f"- **Git LFS:** `{lfs_ver}`")
    w(f"- **Current LFS tracked files:** {'none listed' if not lfs_tracked else 'see below'}")
    if lfs_tracked:
        w("```")
        w(lfs_tracked[:3000])
        w("```")
    w()
    w("### Recent commits")
    w("```")
    w(run(["git", "log", "-8", "--oneline", "--decorate"]).strip())
    w("```")
    w()
    w("### Current `.gitignore` (summary of intent)")
    w("- Ignores: `node_modules`, `.next`, `dist-*`, `__pycache__`, `AI_Tools/`, RIFE models/binaries, ffmpeg, videos, native build, secrets patterns")
    w("- Full file: repository root `.gitignore`")
    w()

    w("## 1. Totals")
    w()
    w("| Metric | Value |")
    w("|---|---:|")
    w(f"| Total files (excl. `.git`) | {total_files:,} |")
    w(f"| Total directories (excl. `.git`) | {dir_count:,} |")
    w(f"| Total size (excl. `.git`) | {fmt(total_size)} ({total_size:,} bytes) |")
    w(f"| Git tracked (on disk & in index) | {len(tracked_files):,} / {fmt(sum(s for _,s,_ in tracked_files))} |")
    w(f"| Git untracked (visible / not ignored heuristic) | {len(untracked_files):,} / {fmt(sum(s for _,s,_ in untracked_files))} |")
    w(f"| Git ignored (status + heuristic) | {len(ignored_files):,} / {fmt(sum(s for _,s,_ in ignored_files))} |")
    w()

    w("## 2. Top-level sizes")
    w()
    w("| Path | Size | Share |")
    w("|---|---:|---:|")
    for name, sz in sorted(top_sizes.items(), key=lambda x: -x[1]):
        share = sz / total_size * 100 if total_size else 0
        w(f"| `{name}` | {fmt(sz)} | {share:.1f}% |")
    w()

    w("## 3. Large files by threshold")
    w()
    for label, key in [
        ("> 1 GB", "gt_1gb"),
        ("> 500 MB", "gt_500mb"),
        ("> 100 MB", "gt_100mb"),
        ("> 50 MB", "gt_50mb"),
    ]:
        items = sorted(by_thresh[key], key=lambda x: -x[1])
        w(f"### {label}")
        w(f"- Count: **{len(items)}**")
        w(f"- Total size: **{fmt(sum(s for _,s,_ in items))}**")
        w()
        w("| Path | Size | Ext | Cache/temp? |")
        w("|---|---:|---|---|")
        for rel, sz, ext in items[:80]:
            w(f"| `{rel}` | {fmt(sz)} | {ext or '-'} | {'yes' if is_cache_temp(rel) else 'no'} |")
        if len(items) > 80:
            w(f"| ... | ... | ... | (+{len(items)-80} more) |")
        w()

    def section(title: str, items: list, limit: int = 40) -> None:
        w(f"### {title}")
        w(f"- Count: **{len(items):,}**")
        w(f"- Size: **{fmt(sum(s for _,s,_ in items))}**")
        top = sorted(items, key=lambda x: -x[1])[:limit]
        if top:
            w("| Path | Size | Ext |")
            w("|---|---:|---|")
            for rel, sz, ext in top:
                w(f"| `{rel}` | {fmt(sz)} | {ext or '-'} |")
            if len(items) > limit:
                w(f"| ... | ... | (+{len(items)-limit} more) |")
        w()

    w("## 4. Special asset categories")
    w()
    section("EXE", exe)
    section("DLL", dll, 50)
    section("LIB", lib)
    section("PDB", pdb)
    section("Model weights (.bin/.param/.pth/.pt/.onnx/.weights/...)", models, 50)
    section("Videos", videos)
    section("ncnn-related paths", ncnn, 30)
    section("Vulkan-related paths", vulkan, 30)
    section("RIFE-related paths", rife, 30)
    section("C6.x related", c6, 40)
    section("C7.x related", c7, 40)
    section("C8.x related", c8, 40)
    section("Benchmark / profile related", bench, 30)
    section("Native tree (`native/`)", native, 30)
    section("Frontend tree (`web-ui/`)", frontend, 20)
    section("Python sources (non-cache)", py_files, 30)
    section("C/C++ sources (non-cache)", cpp_files, 30)
    section("Web sources TS/JS/CSS/HTML (non-cache, excl node_modules)", web_files, 30)
    section("Docs", docs, 40)

    w("## 5. Ignored but may be required for restore/runtime")
    w()
    w("These are currently excluded by `.gitignore` (or equivalent heuristic). **Not deleted.** For a full restore archive they need LFS / Release / external archive decisions:")
    w()
    for pat, why in needed_ignore_patterns:
        w(f"- `{pat}` — {why}")
    w()
    w("### Notable ignored runtime binaries/models currently on disk (sample)")
    samples = []
    for rel, sz, ext in sorted(ignored_files, key=lambda x: -x[1]):
        if ext in MODEL_EXTS | {".exe", ".dll"} or "models/" in rel or "rife-ncnn" in rel or "ffmpeg" in rel:
            if not is_cache_temp(rel) or rel.startswith("AI_Tools/"):
                samples.append((rel, sz, ext))
        if len(samples) >= 60:
            break
    w("| Path | Size | Ext |")
    w("|---|---:|---|")
    for rel, sz, ext in samples:
        w(f"| `{rel}` | {fmt(sz)} | {ext or '-'} |")
    w()

    w("## 6. Sensitive information scan")
    w()
    w(f"- `.env*` files found: **{len(env_files)}**")
    if env_files:
        for rel, sz in env_files:
            w(f"  - `{rel}` ({fmt(sz)})")
    w(f"- Pattern hits (heuristic): **{len(secret_hits)}**")
    w()
    if secret_hits:
        w("| File | Line | Kind | Snippet |")
        w("|---|---:|---|---|")
        for rel, ln, kind, snip in secret_hits[:100]:
            safe = snip.replace("|", "\\|")
            w(f"| `{rel}` | {ln} | {kind} | `{safe}` |")
        if len(secret_hits) > 100:
            w(f"| ... | ... | ... | (+{len(secret_hits)-100} more) |")
    else:
        w("_No high-confidence secret pattern hits in scanned text sources (caches/AI_Tools/node_modules skipped)._")
    w()
    w("**Note:** Heuristic scan can false-positive on docs/examples. Manual review required before any commit of flagged files.")
    w()

    w("## 7. Large files already in Git history (>50 MB blobs)")
    w()
    if not large_hist:
        w("_No blobs >50 MB found in current object database scan._")
    else:
        w(f"- Count: **{len(large_hist)}**")
        w()
        w("| OID | Size | Path (if known) |")
        w("|---|---:|---|")
        for oid, sz, path in large_hist[:50]:
            w(f"| `{oid[:12]}` | {fmt(sz)} | `{path}` |")
    w()

    w("## 8. Preliminary A/B/C classification")
    w()
    a_files = []
    b_files = []
    c_files = []
    for rel, sz, ext in all_files:
        if is_cache_temp(rel):
            c_files.append((rel, sz, ext))
        elif sz > 50 * 1024 * 1024 or ext in MODEL_EXTS or (ext in BIN_EXTS and sz > 512 * 1024) or (ext in VIDEO_EXTS and sz > 5 * 1024 * 1024):
            b_files.append((rel, sz, ext))
        elif ext in SRC_PY | SRC_CPP | SRC_WEB | DOC_EXTS | CFG_EXTS | {".cmd", ".bat", ".vbs", ".ps1", ".sh", ".glsl", ".comp", ".vert", ".frag"}:
            a_files.append((rel, sz, ext))
        elif sz < 50 * 1024 * 1024:
            a_files.append((rel, sz, ext))
        else:
            b_files.append((rel, sz, ext))

    w("| Class | Count | Size | Meaning |")
    w("|---|---:|---:|---|")
    w(f"| A Regular Git | {len(a_files):,} | {fmt(sum(s for _,s,_ in a_files))} | Source/docs/config/small assets |")
    w(f"| B LFS candidates | {len(b_files):,} | {fmt(sum(s for _,s,_ in b_files))} | Models/binaries/large media (review license) |")
    w(f"| C Cache/temp | {len(c_files):,} | {fmt(sum(s for _,s,_ in c_files))} | Regenerable; suggest ignore; **do not delete now** |")
    w()

    w("## 9. GitHub limit / storage routing (preliminary)")
    w()
    w("| Route | Count | Size | Guidance |")
    w("|---|---:|---:|---|")
    w(f"| Cannot use regular Git (>100 MB) | {len(cannot_regular):,} | {fmt(sum(s for _,s,_ in cannot_regular))} | Must be LFS, Release, or external |")
    w(f"| Strong external-archive candidates (>1 GB or huge AI_Tools) | {len(external_archive):,} | {fmt(sum(s for _,s,_ in external_archive))} | Prefer external disk/Netdisk + SHA256 in repo |")
    w()
    w("### Files that cannot enter regular GitHub Git (>100 MB)")
    w()
    w("| Path | Size | Suggested route |")
    w("|---|---:|---|")
    for rel, sz, ext in sorted(cannot_regular, key=lambda x: -x[1]):
        if is_cache_temp(rel):
            route = "Do not upload (cache/temp); rebuild"
        elif rel.startswith("AI_Tools/"):
            route = "External archive + SHA256 (third-party toolchain)"
        elif sz > 2 * 1024 * 1024 * 1024:
            route = "External only (exceeds practical GitHub file comfort)"
        else:
            route = "Git LFS or GitHub Release Asset"
        w(f"| `{rel}` | {fmt(sz)} | {route} |")
    w()

    w("## 10. Important large-file SHA256 (for later restore verification)")
    w()
    w(f"Hashed **{len(hashes)}** important large/runtime files:")
    w()
    w("| Path | Size | SHA256 |")
    w("|---|---:|---|")
    for rel, sz, ext, digest in hashes:
        w(f"| `{rel}` | {fmt(sz)} | `{digest}` |")
    w()

    w("## 11. Extension statistics (top by size)")
    w()
    w("| Ext | Count | Size |")
    w("|---|---:|---:|")
    for ext, st in sorted(ext_stats.items(), key=lambda x: -x[1]["size"])[:40]:
        w(f"| `{ext}` | {st['count']:,} | {fmt(st['size'])} |")
    w()

    w("## 12. Phase-1 conclusions")
    w()
    w("1. Working tree is large (~15 GB excl. `.git`); majority is `AI_Tools` + regenerable `web-ui` build/deps + RIFE toolchain/models.")
    w("2. Current `.gitignore` keeps the GitHub repo lean but **omits runtime-critical models/binaries** needed for full restore.")
    w("3. Git LFS **is installed** locally (`git-lfs/3.7.1`) but **not yet configured** with meaningful track rules in `.gitattributes` (no LFS files listed).")
    w("4. **No deletion performed.** Next steps (after your confirmation): finalize A/B/C, configure LFS track patterns, write `archive-manifest.txt`, then prepare `git add` — still no push until you approve.")
    w()
    if secret_hits or env_files:
        w("5. Sensitive-scan produced findings or `.env` files — **review before any commit** (see §6).")
    else:
        w("5. Sensitive-scan found no high-confidence secrets in scanned sources; still review before commit.")
    w()
    w("---")
    w()
    w("**Stopped after inventory generation. Awaiting confirmation before commit/LFS config/push.**")
    w()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"TOTAL_FILES={total_files}")
    print(f"TOTAL_DIRS={dir_count}")
    print(f"TOTAL_SIZE={total_size}")
    print(f"TRACKED={len(tracked_files)}")
    print(f"UNTRACKED={len(untracked_files)}")
    print(f"IGNORED={len(ignored_files)}")
    print(f"GT50={len(by_thresh['gt_50mb'])}")
    print(f"GT100={len(by_thresh['gt_100mb'])}")
    print(f"GT500={len(by_thresh['gt_500mb'])}")
    print(f"GT1G={len(by_thresh['gt_1gb'])}")
    print(f"SECRETS={len(secret_hits)}")
    print(f"ENVFILES={len(env_files)}")
    print(f"HIST_LARGE={len(large_hist)}")
    print(f"HASHED={len(hashes)}")
    if errors:
        print(f"ERRORS={len(errors)}")


if __name__ == "__main__":
    main()
