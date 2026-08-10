# -*- coding: utf-8 -*-
"""
RIFE Pro (SVFI Optimized) 打包脚本
依赖：ffmpeg / ffprobe / rife-ncnn-vulkan(20221029) / realesrgan-ncnn-vulkan / models / assets
"""
import os
import sys
import shutil
import subprocess

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

APP_NAME = "RIFE_Pro"
SEP = ";" if os.name == "nt" else ":"

REQUIRED_FILES = [
    "main.py",
    "svfi_pipeline.py",
    "ui_prefs.py",
    "ffmpeg.exe",
    "ffprobe.exe",
    "realesrgan-ncnn-vulkan.exe",
]

REQUIRED_DIRS = [
    "rife-ncnn-vulkan-20221029-windows",
    "models",
    "assets",
]

OPTIONAL_DIRS = [
    "realesrgan",
]

OLD_ARTIFACTS = (
    "build",
    "dist",
    "RIFE_Pro_KON.spec",
    "RIFE_Pro.spec",
)


def check():
    ok = True
    print("=== 依赖检查 ===")
    for name in REQUIRED_FILES:
        exists = os.path.isfile(name)
        print(("[OK]" if exists else "[X]"), name)
        ok = ok and exists

    for name in REQUIRED_DIRS:
        exists = os.path.isdir(name)
        print(("[OK]" if exists else "[X]"), name + "/")
        ok = ok and exists

    rife_exe = os.path.join(
        "rife-ncnn-vulkan-20221029-windows", "rife-ncnn-vulkan.exe"
    )
    if not os.path.isfile(rife_exe):
        print("[X]", rife_exe)
        ok = False
    else:
        print("[OK]", rife_exe)

    for name in OPTIONAL_DIRS:
        exists = os.path.isdir(name)
        print(("[OK]" if exists else "[!]"), name + "/", "(可选)")

    if not ok:
        print("\n请补全缺失组件后再打包！")
        sys.exit(1)
    print("\n[OK] 文件检查通过\n")


def clean():
    for item in OLD_ARTIFACTS:
        if not os.path.exists(item):
            continue
        if os.path.isdir(item):
            shutil.rmtree(item)
            print(f"[DEL] 已清理 {item}/")
        else:
            os.remove(item)
            print(f"[DEL] 已清理 {item}")


def build():
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", APP_NAME,
        "--windowed",
        "--noconfirm",
        "--clean",
        "--onedir",
        f"--add-binary=ffmpeg.exe{SEP}.",
        f"--add-binary=ffprobe.exe{SEP}.",
        f"--add-binary=realesrgan-ncnn-vulkan.exe{SEP}.",
        f"--add-data=assets{SEP}assets",
        f"--add-data=models{SEP}models",
        f"--add-data=rife-ncnn-vulkan-20221029-windows{SEP}rife-ncnn-vulkan-20221029-windows",
        "--hidden-import=svfi_pipeline",
        "--hidden-import=gvfi_runtime.frame_pipeline",
        "--hidden-import=gvfi_runtime.rife_cli_pipeline",
        "--hidden-import=gvfi_runtime.rife_scene_scheduler",
        "--hidden-import=ui_prefs",
        "--hidden-import=numpy",
        "--hidden-import=PyQt5.sip",
        "--hidden-import=PyQt5.QtCore",
        "--hidden-import=PyQt5.QtGui",
        "--hidden-import=PyQt5.QtWidgets",
        "main.py",
    ]

    if os.path.isdir("realesrgan"):
        cmd.insert(-1, f"--add-data=realesrgan{SEP}realesrgan")

    print(f"[BUILD] 开始打包: {APP_NAME}")
    print("... 预计需要几分钟...\n")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("[X] 打包失败")
        sys.exit(1)

    out_dir = os.path.join("dist", APP_NAME)
    # 再拷贝一遍，确保 exe 旁可直接找到二进制（兼容部分 PyInstaller 路径）
    for item in (
        "ffmpeg.exe",
        "ffprobe.exe",
        "realesrgan-ncnn-vulkan.exe",
        "models",
        "assets",
        "rife-ncnn-vulkan-20221029-windows",
        "realesrgan",
    ):
        src = item
        dst = os.path.join(out_dir, item)
        if not os.path.exists(src):
            continue
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print(f"[COPY] 已同步: {item}")

    print(f"\n[OK] 打包完成")
    print(f"📂 {out_dir}\\")
    print(f"🎯 {out_dir}\\{APP_NAME}.exe")


if __name__ == "__main__":
    check()
    clean()
    build()
