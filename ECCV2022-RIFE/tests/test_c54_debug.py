"""C5.4 debug test"""
import sys, os
os.environ['PYTHONUTF8'] = '1'
sys.path.insert(0, '.')

print('Step 1: Import PyQt5')
from PyQt5.QtCore import QCoreApplication
app = QCoreApplication.instance() or QCoreApplication(sys.argv)
print('Step 1 OK')

print('Step 2: Import VideoWorker')
try:
    from main import VideoWorker
    print('Step 2 OK')
except Exception as e:
    print(f'Step 2 FAILED: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('Step 3: Check tool resolution')
try:
    from tool_resolver import resolve_runtime_tools
    tools = resolve_runtime_tools()
    print(f'Tools: ffmpeg={tools.get("ffmpeg")}')
    print(f'  rife_exe={tools.get("rife_exe")}')
    print(f'  rife_model={tools.get("rife_model")}')
    print('Step 3 OK')
except Exception as e:
    print(f'Step 3 FAILED: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('Step 4: Create worker')
try:
    TEST_VIDEO = r'D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4'
    MODEL = tools.get('rife_model') or r'D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6'
    print(f'Using model: {MODEL}')

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

    worker = VideoWorker(
        file_list=[TEST_VIDEO],
        params=params,
        out_path=r'D:\GVFI-deps\native-video-worker-ab\c54_simple',
        same_as_src=False,
        clean_cache=True,
    )
    print('Step 4 OK - worker created')
    print(f'  Backend: {worker._interpolator_backend.name}')
except Exception as e:
    print(f'Step 4 FAILED: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('\nAll steps passed')
