#!/usr/bin/env python3
"""One-shot inventory scanner for GVFI GitHub archive Phase 1."""
from __future__ import annotations

import os
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"d:\BaiduNetdiskDownload\GVFI")
OUT = ROOT / "docs" / "project-archive-inventory.md"
GITHUB_SOFT = 50 * 1024 * 1024
GITHUB_HARD = 100 * 1024 * 1024

EXT_MAP = {
    "source_ts": {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"},
    "source_py": {".py"},
    "source_cpp": {".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx", ".inl"},
    "cmake": {".cmake"},
    "docs": {".md", ".rst", ".txt"},
    "config": {".json", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".xml"},
    "web_css": {".css", ".scss", ".sass", ".less"},
    "html": {".html", ".htm"},
    "binary_dll": {".dll"},
    "binary_lib": {".lib"},
    "binary_exe": {".exe"},
    "binary_pdb": {".pdb"},
    "model_onnx": {".onnx"},
    "model_bin": {".bin"},
    "model_param": {".param"},
    "model_pth": {".pth", ".pt", ".pkl", ".pickle"},
    "model_engine": {".engine"},
    "video": {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"},
    "image": {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tga", ".exr"},
    "archive": {".zip", ".7z", ".rar", ".tar", ".gz", ".tgz"},
    "log": {".log"},
    "shader": {".comp", ".vert", ".frag", ".glsl", ".spv"},
}

PATH_KEYWORDS = [
    ("ncnn", ["ncnn"]),
    ("rife", ["rife"]),
    ("vulkan", ["vulkan"]),
    ("ffmpeg", ["ffmpeg", "ffprobe"]),
    ("realesrgan", ["realesrgan", "real-esrgan"]),
    ("realcugan", ["realcugan", "real-cugan"]),
    ("steam_svfi", ["steam", "svfi"]),
    (
        "c6_c7_c8",
        ["c6", "c7", "c8", "c9", "c71", "c72", "c73", "c81", "c91", "c92", "c93"],
    ),
    ("benchmark", ["benchmark", "profile"]),
    ("node_modules", ["node_modules"]),
    ("pycache", ["__pycache__", ".pyc"]),
    ("build_cache", ["build/", ".next", "dist-", "cmake-build", "cmakefiles"]),
]


def fmt_bytes(n: float) -> str:
    n = float(n)
    for u in ["B", "KB", "MB", "GB", "TB"]:
        if n < 1024 or u == "TB":
            return f"{int(n)} B" if u == "B" else f"{n:.2f} {u}"
        n /= 1024.0
    return f"{n:.2f} TB"


def classify_ext(path: Path) -> str:
    ext = path.suffix.lower()
    for cat, exts in EXT_MAP.items():
        if ext in exts:
            return cat
    if path.name.lower() == "cmakelists.txt":
        return "cmake"
    if path.name.lower() in {
        "dockerfile",
        ".gitignore",
        ".gitattributes",
        ".env",
        ".env.example",
    }:
        return "config"
    return "other"


def path_flags(rel: str) -> list[str]:
    low = rel.replace("\\", "/").lower()
    flags: list[str] = []
    for name, keys in PATH_KEYWORDS:
        for k in keys:
            if k in low:
                flags.append(name)
                break
    return flags


def is_cache_temp(rel: str, cat: str) -> bool:
    low = rel.replace("\\", "/").lower()
    needles = [
        "node_modules/",
        "__pycache__/",
        ".next/",
        "/build/",
        "cmakefiles/",
        "cmake-build",
        ".cache/",
        "/tmp/",
        "/temp/",
        "dist-gvfi",
        "dist-desktop",
        "dist-gvfi-build",
        "dist-gvfi-fresh",
        "_asar-repack",
        "_asar-extract",
        ".pyc",
        ".pyo",
        "coverage/",
        "test-results/",
        "playwright-report/",
        ".cleanup-quarantine/",
        "user_data/",
        "uploads/",
        ".venv/",
        "venv/",
    ]
    if any(n in low for n in needles):
        return True
    if cat in ("log", "binary_pdb"):
        return True
    if low.endswith(".log"):
        return True
    # Treat top-level native/CMakeFiles and native/CMakeCache as build cache
    if low.startswith("native/cmakefiles/") or low == "native/cmakecache.txt":
        return True
    return False


def can_regular_git(f) -> bool:
    rel, sz, cat, flags, is_cache = f
    if is_cache:
        return False
    if sz >= GITHUB_HARD:
        return False
    if cat in (
        "binary_dll",
        "binary_lib",
        "binary_exe",
        "model_onnx",
        "model_bin",
        "model_param",
        "model_pth",
        "model_engine",
        "video",
        "archive",
        "binary_pdb",
    ):
        return sz < 1 * 1024 * 1024 and sz < GITHUB_SOFT
    if "node_modules" in flags or "pycache" in flags:
        return False
    if sz >= GITHUB_SOFT:
        return False
    return True


def suggest_lfs(f) -> bool:
    rel, sz, cat, flags, is_cache = f
    if is_cache:
        return False
    if sz >= GITHUB_SOFT:
        return True
    if cat in (
        "model_onnx",
        "model_bin",
        "model_param",
        "model_pth",
        "model_engine",
    ) and sz >= 512 * 1024:
        return True
    if cat in ("binary_dll", "binary_lib", "binary_exe") and sz >= 512 * 1024:
        return True
    return False


def main() -> None:
    all_files = []
    dir_sizes: dict[str, int] = defaultdict(int)
    top_dir_sizes: dict[str, int] = defaultdict(int)
    cat_stats: dict[str, dict] = defaultdict(lambda: {"count": 0, "size": 0})
    keyword_stats: dict[str, dict] = defaultdict(lambda: {"count": 0, "size": 0})
    errors: list[str] = []
    total_count = 0
    total_size = 0
    git_dir_size = 0
    git_dir_count = 0

    print("Scanning...", flush=True)
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        if rel_dir == ".git" or rel_dir.startswith(".git" + os.sep):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    sz = os.path.getsize(fp)
                except OSError as e:
                    errors.append(str(e))
                    continue
                git_dir_size += sz
                git_dir_count += 1
            continue
        if ".git" in dirnames:
            dirnames.remove(".git")

        for f in filenames:
            fp = os.path.join(dirpath, f)
            try:
                sz = os.path.getsize(fp)
            except OSError as e:
                errors.append(f"{fp}: {e}")
                continue
            rel = os.path.relpath(fp, ROOT)
            cat = classify_ext(Path(fp))
            flags = path_flags(rel)
            isc = is_cache_temp(rel, cat)
            all_files.append((rel, sz, cat, flags, isc))
            total_count += 1
            total_size += sz
            cat_stats[cat]["count"] += 1
            cat_stats[cat]["size"] += sz
            for fl in flags:
                keyword_stats[fl]["count"] += 1
                keyword_stats[fl]["size"] += sz
            parts = Path(rel).parts
            if parts:
                top_dir_sizes[parts[0]] += sz
            if len(parts) >= 2:
                dir_sizes[str(Path(parts[0]) / parts[1])] += sz
            else:
                dir_sizes[parts[0]] += sz

    print(f"Files: {total_count}, Size: {fmt_bytes(total_size)}", flush=True)

    all_files.sort(key=lambda x: x[1], reverse=True)
    largest = all_files[:80]
    over_hard = [f for f in all_files if f[1] >= GITHUB_HARD]
    over_soft = [f for f in all_files if GITHUB_SOFT <= f[1] < GITHUB_HARD]
    cache_files = [f for f in all_files if f[4]]
    cache_size = sum(f[1] for f in cache_files)
    cache_count = len(cache_files)
    reg_git = [f for f in all_files if can_regular_git(f)]
    lfs = [f for f in all_files if suggest_lfs(f)]

    def filter_keyword(kw: str):
        return [f for f in all_files if kw in f[3]]

    sections = {
        "source_code_web": [
            f
            for f in all_files
            if f[2] in ("source_ts", "web_css", "html") and "node_modules" not in f[3]
        ],
        "source_python": [
            f for f in all_files if f[2] == "source_py" and "pycache" not in f[3]
        ],
        "source_native_cpp": [
            f
            for f in all_files
            if f[2] in ("source_cpp", "cmake")
            or f[0].lower().endswith("cmakelists.txt")
        ],
        "tests": [
            f
            for f in all_files
            if "test" in f[0].replace("\\", "/").lower() and not f[4]
        ],
        "docs": [
            f
            for f in all_files
            if f[2] == "docs" or f[0].replace("\\", "/").startswith("docs/")
        ],
        "config": [f for f in all_files if f[2] == "config"],
        "dll_lib_exe": [
            f
            for f in all_files
            if f[2] in ("binary_dll", "binary_lib", "binary_exe")
        ],
        "models": [f for f in all_files if f[2].startswith("model_")],
        "videos": [f for f in all_files if f[2] == "video"],
        "images_png": [f for f in all_files if f[2] == "image"],
        "ncnn": filter_keyword("ncnn"),
        "rife": filter_keyword("rife"),
        "vulkan": filter_keyword("vulkan"),
        "ffmpeg": filter_keyword("ffmpeg"),
        "realesrgan": filter_keyword("realesrgan"),
        "realcugan": filter_keyword("realcugan"),
        "steam_svfi": filter_keyword("steam_svfi"),
        "c6_c8_exps": filter_keyword("c6_c7_c8"),
        "benchmark": filter_keyword("benchmark"),
        "json_logs": [
            f
            for f in all_files
            if f[2] in ("config", "log")
            and (
                f[0].endswith(".json")
                or f[0].endswith(".log")
                or f[2] == "log"
            )
        ],
        "third_party": [
            f
            for f in all_files
            if "third_party" in f[0].replace("\\", "/").lower()
            or "thirdparty" in f[0].replace("\\", "/").lower()
        ],
        "AI_Tools": [
            f
            for f in all_files
            if f[0].replace("\\", "/").startswith("AI_Tools/")
        ],
        "releases": [
            f
            for f in all_files
            if f[0].replace("\\", "/").startswith("releases/")
        ],
        "electron_next": [
            f
            for f in all_files
            if f[0].replace("\\", "/").startswith("web-ui/")
        ],
        "native_dir": [
            f
            for f in all_files
            if f[0].replace("\\", "/").startswith("native/")
        ],
        "eccv_dir": [
            f
            for f in all_files
            if f[0].replace("\\", "/").startswith("ECCV2022-RIFE/")
        ],
    }

    top_sorted = sorted(top_dir_sizes.items(), key=lambda x: -x[1])
    dir2_sorted = sorted(dir_sizes.items(), key=lambda x: -x[1])[:60]

    d_candidates = []
    for f in all_files:
        rel = f[0].replace("\\", "/").lower()
        if any(
            x in rel
            for x in [
                "steam",
                "svfi",
                "vulkan-sdk",
                "vulkansdk",
                "visual studio",
                "nvidia",
                "cuda/",
                "cudnn",
            ]
        ):
            d_candidates.append(f)
        elif f[0].replace("\\", "/").startswith("AI_Tools/") and f[2] in (
            "binary_exe",
            "binary_dll",
            "binary_lib",
            "archive",
            "model_onnx",
            "model_bin",
            "model_param",
            "model_pth",
        ):
            d_candidates.append(f)
        elif any(
            x in rel
            for x in ["ffmpeg.exe", "ffprobe.exe", "realesrgan", "realcugan"]
        ):
            d_candidates.append(f)

    seen: set[str] = set()
    d_unique = []
    for f in sorted(d_candidates, key=lambda x: -x[1]):
        if f[0] not in seen:
            seen.add(f[0])
            d_unique.append(f)

    lines: list[str] = []

    def w(s: str = "") -> None:
        lines.append(s)

    w("# GVFI Project Archive Inventory")
    w()
    w("> Phase 1 complete inventory. Generated for GitHub archive planning.")
    w(">")
    w("> **Do not delete local files until GitHub archive is confirmed.**")
    w()
    w(f"- **Scan root:** `{ROOT}`")
    w(f"- **Total files (excluding `.git`):** {total_count:,}")
    w(f"- **Total size (excluding `.git`):** {fmt_bytes(total_size)} ({total_size:,} bytes)")
    w(f"- **`.git` objects (informational):** {git_dir_count:,} files, {fmt_bytes(git_dir_size)}")
    w("- **GitHub hard limit (regular Git):** 100 MB / file")
    w("- **Soft threshold used for LFS recommendation:** 50 MB / file")
    w()

    w("## 1. Top-level directory sizes")
    w()
    w("| Directory / File | Size | Share |")
    w("|---|---:|---:|")
    for name, sz in top_sorted:
        share = (sz / total_size * 100) if total_size else 0
        w(f"| `{name}` | {fmt_bytes(sz)} | {share:.1f}% |")
    w()

    w("## 2. Largest second-level directories")
    w()
    w("| Path | Size |")
    w("|---|---:|")
    for name, sz in dir2_sorted:
        w(f"| `{name}` | {fmt_bytes(sz)} |")
    w()

    w("## 3. File type / category statistics")
    w()
    w("| Category | Count | Size |")
    w("|---|---:|---:|")
    for cat, st in sorted(cat_stats.items(), key=lambda x: -x[1]["size"]):
        w(f"| `{cat}` | {st['count']:,} | {fmt_bytes(st['size'])} |")
    w()

    w("## 4. Keyword / domain path statistics")
    w()
    w("| Keyword | Count | Size | Notes |")
    w("|---|---:|---:|---|")
    notes = {
        "ncnn": "ncnn sources/binaries/models references",
        "rife": "RIFE code/models/workers",
        "vulkan": "Vulkan-related paths",
        "ffmpeg": "FFmpeg binaries/scripts",
        "realesrgan": "Real-ESRGAN",
        "realcugan": "RealCUGAN",
        "steam_svfi": "Steam / SVFI related paths — redistributability review required",
        "c6_c7_c8": "C6–C9 experiment docs/tests/artifacts",
        "benchmark": "benchmark/profile artifacts",
        "node_modules": "regenerable dependency tree",
        "pycache": "Python bytecode cache",
        "build_cache": "build/cache intermediates",
    }
    for kw, st in sorted(keyword_stats.items(), key=lambda x: -x[1]["size"]):
        w(f"| `{kw}` | {st['count']:,} | {fmt_bytes(st['size'])} | {notes.get(kw, '')} |")
    w()

    w("## 5. Inventory by requested categories")
    w()
    for key, items in sections.items():
        sz = sum(i[1] for i in items)
        w(f"### `{key}`")
        w(f"- Count: **{len(items):,}**")
        w(f"- Size: **{fmt_bytes(sz)}**")
        topn = sorted(items, key=lambda x: -x[1])[:15]
        if topn:
            w("- Largest samples:")
            for rel, s, cat, flags, isc in topn:
                tag = " [cache/temp]" if isc else ""
                w(f"  - `{rel}` — {fmt_bytes(s)} ({cat}){tag}")
        w()

    w("## 6. Largest files (top 80)")
    w()
    w("| Rank | Path | Size | Category | Cache/Temp? |")
    w("|---:|---|---:|---|---|")
    for i, (rel, sz, cat, flags, isc) in enumerate(largest, 1):
        w(f"| {i} | `{rel}` | {fmt_bytes(sz)} | {cat} | {'yes' if isc else 'no'} |")
    w()

    w("## 7. Files exceeding GitHub 100 MB (cannot use regular Git)")
    w()
    if not over_hard:
        w("_None found._")
    else:
        w(f"**Count:** {len(over_hard)} | **Total size:** {fmt_bytes(sum(f[1] for f in over_hard))}")
        w()
        w("| Path | Size | Category | Suggested action |")
        w("|---|---:|---|---|")
        for rel, sz, cat, flags, isc in sorted(over_hard, key=lambda x: -x[1]):
            low = rel.lower()
            if isc:
                act = "Ignore (cache/temp regenerable)"
            elif "steam" in low or "svfi" in low:
                act = "Do NOT redistribute (commercial) — document SHA256 only"
            elif cat in ("video", "image"):
                act = "LFS if needed for restore; else ignore + document"
            else:
                act = "Git LFS (if redistributable) OR document-only"
            w(f"| `{rel}` | {fmt_bytes(sz)} | {cat} | {act} |")
    w()

    w("## 8. Files 50–100 MB (strong LFS candidates)")
    w()
    if not over_soft:
        w("_None found._")
    else:
        w(f"**Count:** {len(over_soft)} | **Total size:** {fmt_bytes(sum(f[1] for f in over_soft))}")
        w()
        w("| Path | Size | Category | Cache/Temp? |")
        w("|---|---:|---|---|")
        for rel, sz, cat, flags, isc in sorted(over_soft, key=lambda x: -x[1]):
            w(f"| `{rel}` | {fmt_bytes(sz)} | {cat} | {'yes' if isc else 'no'} |")
    w()

    w("## 9. Classification for archive strategy")
    w()
    w("### A — Suitable for regular Git")
    w(f"- Count: **{len(reg_git):,}**")
    w(f"- Size: **{fmt_bytes(sum(f[1] for f in reg_git))}**")
    w("- Criteria: not cache/temp; <50 MB; not large binaries/models/videos/archives.")
    w()

    w("### B — Git LFS candidates (must still pass redistributability check in later phases)")
    w(f"- Count: **{len(lfs):,}**")
    w(f"- Size: **{fmt_bytes(sum(f[1] for f in lfs))}**")
    w("- Criteria: ≥50 MB, or model/binary ≥512 KB and not classified as cache/temp.")
    w("- Top 40 by size:")
    w()
    w("| Path | Size | Category |")
    w("|---|---:|---|")
    for rel, sz, cat, flags, isc in sorted(lfs, key=lambda x: -x[1])[:40]:
        w(f"| `{rel}` | {fmt_bytes(sz)} | {cat} |")
    w()

    w("### C — Cache / temp / regenerable (do not upload)")
    w(f"- Count: **{cache_count:,}**")
    w(f"- Size: **{fmt_bytes(cache_size)}**")
    w("- Includes: `node_modules`, `__pycache__`, `.next`, `build/`, CMakeFiles, dist artifacts, logs, pdb, user_data, uploads, quarantine.")
    w("- Top 30 by size:")
    w()
    w("| Path | Size | Category |")
    w("|---|---:|---|")
    for rel, sz, cat, flags, isc in sorted(cache_files, key=lambda x: -x[1])[:30]:
        w(f"| `{rel}` | {fmt_bytes(sz)} | {cat} |")
    w()

    w("### D — Likely third-party / non-redistributable (flag for Phase 4)")
    w()
    w("Heuristic flags (filename/path based; license verification deferred to Phase 4):")
    w()
    w(f"- Flagged count: **{len(d_unique):,}**")
    w(f"- Flagged size: **{fmt_bytes(sum(f[1] for f in d_unique))}**")
    w()
    w("| Path | Size | Category | Why flagged |")
    w("|---|---:|---|---|")
    for rel, sz, cat, flags, isc in d_unique[:80]:
        low = rel.replace("\\", "/").lower()
        why = []
        if "steam" in low or "svfi" in low:
            why.append("Steam/SVFI")
        if "ffmpeg" in low or "ffprobe" in low:
            why.append("FFmpeg binary")
        if "realesrgan" in low:
            why.append("Real-ESRGAN")
        if "realcugan" in low:
            why.append("RealCUGAN")
        if low.startswith("ai_tools/"):
            why.append("AI_Tools toolchain")
        if "vulkan" in low and "sdk" in low:
            why.append("Vulkan SDK")
        w(f"| `{rel}` | {fmt_bytes(sz)} | {cat} | {', '.join(why) or 'third-party heuristic'} |")
    if len(d_unique) > 80:
        w(f"| ... | ... | ... | (+{len(d_unique) - 80} more) |")
    w()

    w("## 10. Current `.gitignore` coverage notes")
    w()
    w("Existing ignore already excludes many large/runtime items (excerpt of intent):")
    w("- `web-ui/node_modules/`, `.next/`, dist artifacts")
    w("- Python `__pycache__/`, venv")
    w("- `AI_Tools/` entirely")
    w("- RIFE models (`*.bin`, `*.param`, `*.pt`, `*.pth`, `*.onnx`), ffmpeg/realesrgan exes")
    w("- Videos (`*.mp4` etc.), native `build/`, `*.lib`, `*.pdb`")
    w("- User data / uploads / logs / secrets patterns")
    w()
    w(
        "**Archive implication:** current ignore prioritizes a lean repo. "
        "For a *full restore archive*, Phase 6 must selectively un-ignore "
        "GVFI-owned must-keep binaries/models (or move them to LFS), while keeping "
        "truly regenerable and non-redistributable items out."
    )
    w()

    w("## 11. Summary verdict (Phase 1 only)")
    w()
    w("| Bucket | Count | Size | Action in later phases |")
    w("|---|---:|---:|---|")
    w(
        f"| A Regular Git | {len(reg_git):,} | "
        f"{fmt_bytes(sum(f[1] for f in reg_git))} | Commit normally |"
    )
    w(
        f"| B LFS candidates | {len(lfs):,} | "
        f"{fmt_bytes(sum(f[1] for f in lfs))} | Review then LFS or document |"
    )
    w(
        f"| C Cache/temp | {cache_count:,} | "
        f"{fmt_bytes(cache_size)} | Ignore |"
    )
    w(
        f"| D Third-party flagged | {len(d_unique):,} | "
        f"{fmt_bytes(sum(f[1] for f in d_unique))} | No binary upload; SHA256 + restore docs |"
    )
    w(
        f"| Over 100 MB | {len(over_hard):,} | "
        f"{fmt_bytes(sum(f[1] for f in over_hard))} | LFS or exclude |"
    )
    w()
    w(
        "Phase 1 complete. **Stopped as requested.** "
        "Awaiting next instruction for Phase 2 (secrets scan)."
    )
    w()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"TOTAL_FILES={total_count}")
    print(f"TOTAL_SIZE={total_size}")
    print(f"OVER100={len(over_hard)}")
    print(f"OVER50={len(over_soft)}")
    print(f"REG_GIT={len(reg_git)}")
    print(f"LFS={len(lfs)}")
    print(f"CACHE={cache_count}")
    print(f"D_FLAG={len(d_unique)}")
    if errors:
        print(f"ERRORS={len(errors)}")
        for e in errors[:20]:
            print("ERR:", e)


if __name__ == "__main__":
    main()
