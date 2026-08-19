"""C5.4 - Direct VideoWorker test"""
import sys, os
os.environ['PYTHONUTF8'] = '1'
sys.path.insert(0, '.')

from PyQt5.QtCore import QCoreApplication
app = QCoreApplication.instance() or QCoreApplication(sys.argv)

from main import VideoWorker
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

logs = []

def on_log(msg):
    logs.append(msg)
    if 'RIFE' in msg or 'BACKEND' in msg:
        print(msg[:100], flush=True)

print('Creating worker...')
worker = VideoWorker(
    file_list=[TEST_VIDEO],
    params=params,
    out_path=os.path.join(OUT_DIR, 'test1'),
    same_as_src=False,
    clean_cache=True,
)
worker.log_output.connect(on_log)
print('Starting worker...')
worker.start()
print('Waiting for worker (300s timeout)...')
result = worker.wait(300000)
print(f'Worker finished: result={result}')
print(f'Worker isFinished: {worker.isFinished()}')

# Check output
out_files = [f for f in os.listdir(os.path.join(OUT_DIR, 'test1')) if f.endswith(('.mp4', '.mkv', '.avi'))]
print(f'Output files: {out_files}')
