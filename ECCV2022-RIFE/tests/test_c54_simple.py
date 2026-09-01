"""
C5.4 - Simple validation test
"""
import sys
import os
import gc

os.environ["PYTHONUTF8"] = "1"

# Paths
ENGINE_ROOT = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE"
sys.path.insert(0, ENGINE_ROOT)

import time
import shutil
import math
import json
import subprocess
from pathlib import Path

TEST_VIDEO = r"D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4"
RESULTS_DIR = r"D:\GVFI-deps\native-video-worker-ab\c54_simple"
INTERP_FPS = 48
EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
MODEL = r"D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6"

# Cleanup
shutil.rmtree(RESULTS_DIR, ignore_errors=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

print("=" * 60)
print("C5.4 - Simple Validation Test")
print("=" * 60)

# Initialize PyQt5
from PyQt5.QtCore import QCoreApplication
app = QCoreApplication.instance()
if app is None:
    app = QCoreApplication(sys.argv)

from main import VideoWorker

logs = []
def on_log(msg):
    logs.append(msg)
    print(f"  {msg[:100]}", flush=True)

results = []

# Test 1: CLI baseline
print("\n--- Test 1: CLI baseline ---")
out_dir1 = os.path.join(RESULTS_DIR, "test1_cli")
os.makedirs(out_dir1, exist_ok=True)

params1 = {
    "backend_mode": "cli",
    "rife_model": MODEL,
    "fps": INTERP_FPS,
    "scale": "原始",
    "gpu": 0,
    "rife_thread_config": "2:4:4",
    "pipeline_mode": "disk",
    "enable_dedup": True,
    "enable_scdet": True,
    "dedup_threshold": 1.5,
    "scdet_threshold": 12.0,
    "superResolution": False,
}

worker1 = VideoWorker(
    file_list=[TEST_VIDEO],
    params=params1,
    out_path=out_dir1,
    same_as_src=False,
    clean_cache=True,
)
worker1.log_output.connect(on_log)
worker1.start()

success1 = worker1.wait(300000)
files1 = [f for f in os.listdir(out_dir1) if f.endswith(('.mp4', '.mkv', '.avi'))]
print(f"  CLI Result: success={success1}, files={files1}")

# Probe output
if files1:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,nb_frames,codec_name",
         "-of", "json", os.path.join(out_dir1, files1[0])],
        capture_output=True, text=True
    )
    probe_data = json.loads(probe.stdout)
    stream = probe_data.get("streams", [{}])[0]
    print(f"  Output: {stream.get('width')}x{stream.get('height')} {stream.get('nb_frames')} frames")

results.append({"test": "CLI", "success": bool(files1)})

gc.collect()

# Test 2: Native backend
print("\n--- Test 2: Native backend ---")
out_dir2 = os.path.join(RESULTS_DIR, "test2_native")
os.makedirs(out_dir2, exist_ok=True)
logs.clear()

params2 = dict(params1)
params2["backend_mode"] = "native"

worker2 = VideoWorker(
    file_list=[TEST_VIDEO],
    params=params2,
    out_path=out_dir2,
    same_as_src=False,
    clean_cache=True,
)
worker2.log_output.connect(on_log)
worker2.start()

success2 = worker2.wait(300000)
files2 = [f for f in os.listdir(out_dir2) if f.endswith(('.mp4', '.mkv', '.avi'))]
print(f"  Native Result: success={success2}, files={files2}")

# Check backend log
backend_log = [l for l in logs if "BACKEND" in l or "backend" in l.lower()]
print(f"  Backend logs:")
for l in backend_log[-5:]:
    print(f"    {l[:120]}")

if files2:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,nb_frames,codec_name",
         "-of", "json", os.path.join(out_dir2, files2[0])],
        capture_output=True, text=True
    )
    probe_data = json.loads(probe.stdout)
    stream = probe_data.get("streams", [{}])[0]
    print(f"  Output: {stream.get('width')}x{stream.get('height')} {stream.get('nb_frames')} frames")

results.append({"test": "Native", "success": bool(files2)})

gc.collect()

# Test 3: Check default backend
print("\n--- Test 3: Default backend check ---")
from gvfi_runtime.interpolator_backend import create_interpolator_backend
import inspect

src = inspect.getsource(create_interpolator_backend)
has_cli_default = "'cli'" in src or '"cli"' in src
print(f"  Factory has CLI default: {has_cli_default}")

results.append({"test": "Default CLI", "success": has_cli_default})

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
for r in results:
    print(f"  {r['test']}: {'PASS' if r['success'] else 'FAIL'}")

all_pass = all(r['success'] for r in results)
print(f"\nOverall: {'ALL PASS' if all_pass else 'SOME FAILED'}")

# Save logs
with open(os.path.join(RESULTS_DIR, "test_logs.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(logs))

print(f"\nResults dir: {RESULTS_DIR}")
