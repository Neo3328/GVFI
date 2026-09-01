"""C5.4 debug test with exec loop"""
import sys, os
os.environ['PYTHONUTF8'] = '1'
sys.path.insert(0, '.')

print('Step 1: Import PyQt5')
from PyQt5.QtCore import QCoreApplication
app = QCoreApplication.instance() or QCoreApplication(sys.argv)
print('Step 1 OK')

print('Step 2: Import VideoWorker')
from main import VideoWorker
print('Step 2 OK')

import shutil

TEST_VIDEO = r'D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4'
MODEL = r'D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6'
OUT_DIR = r'D:\GVFI-deps\native-video-worker-ab\c54_simple'

shutil.rmtree(OUT_DIR, ignore_errors=True)
os.makedirs(OUT_DIR, exist_ok=True)

params = {
    'backend_mode': 'cli',
    'rife_model': MODEL,
    'fps': 48,
    'scale': '原始',
    'gpu': 0,
    'rife_thread_config': '2:4:4',
    'pipeline_mode': 'disk',
    'enable_dedup': True,
    'enable_scdet': True,
    'dedup_threshold': 1.5,
    'scdet_threshold': 12.0,
    'superResolution': False,
}

success_ref = [None]
error_ref = [None]

def on_finished(ok, msg):
    print(f'Finished: ok={ok}, msg_len={len(msg) if msg else 0}')
    success_ref[0] = ok
    error_ref[0] = msg
    app.quit()

def on_log(msg):
    if 'RIFE' in msg or 'ERROR' in msg or 'BACKEND' in msg or '完成' in msg:
        print(f'LOG: {msg[:120]}')

print('Step 3: Create worker')
worker = VideoWorker(
    file_list=[TEST_VIDEO],
    params=params,
    out_path=os.path.join(OUT_DIR, 'test1'),
    same_as_src=False,
    clean_cache=True,
)
print('Step 3 OK')

print('Step 4: Connect signals')
worker.task_finished.connect(on_finished)
worker.log_output.connect(on_log)
print('Step 4 OK')

print('Step 5: Start worker')
worker.start()
print('Step 5 OK - worker started')

print('Step 6: Run event loop')
import time
start_time = time.time()
timeout = 300  # 5 minutes
quit_requested = [False]

def on_about_to_quit():
    quit_requested[0] = True
    app.quit()

app.aboutToQuit.connect(on_about_to_quit)

while not quit_requested[0] and (time.time() - start_time) < timeout:
    app.processEvents()
    if success_ref[0] is not None:
        print(f'Worker finished! Success={success_ref[0]}')
        break
    time.sleep(0.1)

elapsed = time.time() - start_time
print(f'Step 6 OK - event loop finished after {elapsed:.1f}s')
print(f'Success: {success_ref[0]}')
print(f'Error: {error_ref[0][:100] if error_ref[0] else "none"}')

# Check output
out_subdir = os.path.join(OUT_DIR, 'test1')
if os.path.exists(out_subdir):
    out_files = [f for f in os.listdir(out_subdir) if f.endswith(('.mp4', '.mkv', '.avi'))]
    print(f'Output files: {out_files}')
else:
    print('Output directory not found')
