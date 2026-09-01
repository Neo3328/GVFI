"""C5.4 simple test - CLI backend only"""
import sys, os
os.environ['PYTHONUTF8'] = '1'
sys.path.insert(0, '.')

from PyQt5.QtCore import QCoreApplication
app = QCoreApplication.instance() or QCoreApplication(sys.argv)

from main import VideoWorker
import threading
import time
import shutil

TEST_VIDEO = r'D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4'
MODEL = r'D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6'
OUT_DIR = r'D:\GVFI-deps\native-video-worker-ab\c54_simple'

# Clean output
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

finished_event = threading.Event()
success = [False]
error_msg = ['']
logs = []

def on_finished(ok, msg):
    print(f'Finished: ok={ok}')
    success[0] = ok
    error_msg[0] = msg
    finished_event.set()

def on_log(msg):
    if 'RIFE' in msg or 'ERROR' in msg or 'BACKEND' in msg or '完成' in msg:
        print(f'LOG: {msg[:120]}')

print('Creating worker...')
worker = VideoWorker(
    file_list=[TEST_VIDEO],
    params=params,
    out_path=os.path.join(OUT_DIR, 'test1'),
    same_as_src=False,
    clean_cache=True,
)
worker.task_finished.connect(on_finished)
worker.log_output.connect(on_log)
print('Starting worker...')
worker.start()
print('Waiting for worker (timeout 300s)...')
result = worker.wait(300000)
print(f'Worker completed: result={result}')
print(f'Success: {success[0]}, Error: {error_msg[0][:100] if error_msg[0] else "none"}')

# Check output
out_files = [f for f in os.listdir(os.path.join(OUT_DIR, 'test1')) if f.endswith(('.mp4', '.mkv', '.avi'))]
print(f'Output files: {out_files}')
