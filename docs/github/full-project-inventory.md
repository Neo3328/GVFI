# GVFI Full Project Inventory

> Phase 1–2 archive audit. **No files deleted. No commit. No push.**

## 0. Git snapshot

- **Root:** `d:\BaiduNetdiskDownload\GVFI`
- **Branch:** `docs/baidu-mirror-and-download-guide` (ahead of origin by 14)
- **Remote:** `origin` → `https://github.com/Neo3328/GVFI.git`
- **HEAD:** `d9152dd` — feat: add native backend production fallback
- **Tracked files (`git ls-files`):** 546
- **Git LFS:** `git-lfs/3.7.1 (GitHub; windows amd64; go 1.25.1; git b84b3384)`
- **Current LFS tracked files:** none listed

### Recent commits
```
d9152dd (HEAD -> docs/baidu-mirror-and-download-guide) feat: add native backend production fallback
d597712 feat: integrate native rife backend
39d7252 feat: add ncnn vulkan backend prototype
1b6a7b6 feat: add native backend c abi skeleton
8cc24a6 docs: analyze native interpolation backend feasibility
4205db1 refactor: introduce interpolator backend interface
308e19c perf: add rife scene worker scheduler
c9570fa perf: optimize rife cli pipeline scheduling
```

### Current `.gitignore` (summary of intent)
- Ignores: `node_modules`, `.next`, `dist-*`, `__pycache__`, `AI_Tools/`, RIFE models/binaries, ffmpeg, videos, native build, secrets patterns
- Full file: repository root `.gitignore`

## 1. Totals

| Metric | Value |
|---|---:|
| Total files (excl. `.git`) | 102,053 |
| Total directories (excl. `.git`) | 11,441 |
| Total size (excl. `.git`) | 14.82 GB (15,914,994,264 bytes) |
| Git tracked (on disk & in index) | 500 / 27.22 MB |
| Git untracked (visible / not ignored heuristic) | 88 / 897.45 KB |
| Git ignored (status + heuristic) | 101,465 / 14.79 GB |

## 2. Top-level sizes

| Path | Size | Share |
|---|---:|---:|
| `AI_Tools` | 7.00 GB | 47.2% |
| `web-ui` | 5.37 GB | 36.2% |
| `ECCV2022-RIFE` | 2.37 GB | 16.0% |
| `native` | 84.59 MB | 0.6% |
| `docs` | 529.48 KB | 0.0% |
| `scripts` | 65.52 KB | 0.0% |
| `PROJECT_AUDIT.md` | 26.22 KB | 0.0% |
| `tests` | 17.68 KB | 0.0% |
| `PRD.md` | 16.43 KB | 0.0% |
| `releases` | 16.31 KB | 0.0% |
| `DEVELOPMENT_PLAN.md` | 11.21 KB | 0.0% |
| `README.md` | 8.84 KB | 0.0% |
| `.github` | 6.06 KB | 0.0% |
| `CHANGELOG.md` | 5.17 KB | 0.0% |
| `.cursor` | 2.56 KB | 0.0% |
| `.gitignore` | 2.50 KB | 0.0% |
| `SECURITY.md` | 1.72 KB | 0.0% |
| `启动GVFI.cmd` | 697 B | 0.0% |
| `LICENSE` | 642 B | 0.0% |
| `GVFI.vbs` | 440 B | 0.0% |
| `创建桌面快捷方式.bat` | 323 B | 0.0% |
| `生成桌面软件.cmd` | 315 B | 0.0% |
| `index.html` | 232 B | 0.0% |
| `.gitattributes` | 68 B | 0.0% |

## 3. Large files by threshold

### > 1 GB
- Count: **1**
- Total size: **1.40 GB**

| Path | Size | Ext | Cache/temp? |
|---|---:|---|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll | no |

### > 500 MB
- Count: **3**
- Total size: **2.69 GB**

| Path | Size | Ext | Cache/temp? |
|---|---:|---|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll | no |

### > 100 MB
- Count: **32**
- Total size: **8.35 GB**

| Path | Size | Ext | Cache/temp? |
|---|---:|---|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | .dll | no |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001825.sst` | 248.57 MB | .sst | yes |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001714.sst` | 248.34 MB | .sst | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar` | 240.88 MB | .asar | yes |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar` | 240.88 MB | .asar | yes |
| `web-ui/dist-desktop/win-unpacked/resources/app.asar` | 239.01 MB | .asar | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | .dll | no |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001716.sst` | 221.41 MB | .sst | yes |
| `web-ui/dist-gvfi/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/node_modules/electron/dist/electron.exe` | 215.16 MB | .exe | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | .dll | no |
| `web-ui/dist-gvfi/GVFI-Setup-1.0.0-x64.exe` | 151.25 MB | .exe | yes |
| `web-ui/dist-gvfi/GVFI-Portable-1.0.0-x64.exe` | 151.03 MB | .exe | yes |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar` | 145.99 MB | .asar | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | .dll | no |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/_asar-extract/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/_asar-repack/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001827.sst` | 113.43 MB | .sst | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | .dll | no |

### > 50 MB
- Count: **52**
- Total size: **10.00 GB**

| Path | Size | Ext | Cache/temp? |
|---|---:|---|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | .dll | no |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001825.sst` | 248.57 MB | .sst | yes |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001714.sst` | 248.34 MB | .sst | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar` | 240.88 MB | .asar | yes |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar` | 240.88 MB | .asar | yes |
| `web-ui/dist-desktop/win-unpacked/resources/app.asar` | 239.01 MB | .asar | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | .dll | no |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001716.sst` | 221.41 MB | .sst | yes |
| `web-ui/dist-gvfi/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | 215.16 MB | .exe | yes |
| `web-ui/node_modules/electron/dist/electron.exe` | 215.16 MB | .exe | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | .dll | no |
| `web-ui/dist-gvfi/GVFI-Setup-1.0.0-x64.exe` | 151.25 MB | .exe | yes |
| `web-ui/dist-gvfi/GVFI-Portable-1.0.0-x64.exe` | 151.03 MB | .exe | yes |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar` | 145.99 MB | .asar | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | .dll | no |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/_asar-extract/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/_asar-repack/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node | yes |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001827.sst` | 113.43 MB | .sst | yes |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/resnet50-infer-5.uff` | 97.89 MB | .uff | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50.onnx` | 97.74 MB | .onnx | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50_fp32.caffemodel` | 97.72 MB | .caffemodel | no |
| `AI_Tools/FFmpeg/ffmpeg.exe` | 97.18 MB | .exe | no |
| `ECCV2022-RIFE/ffmpeg.exe` | 97.18 MB | .exe | no |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffmpeg.exe` | 97.18 MB | .exe | no |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffmpeg.exe` | 97.18 MB | .exe | no |
| `AI_Tools/FFmpeg/ffprobe.exe` | 96.98 MB | .exe | no |
| `ECCV2022-RIFE/ffprobe.exe` | 96.98 MB | .exe | no |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffprobe.exe` | 96.98 MB | .exe | no |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffprobe.exe` | 96.98 MB | .exe | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/ssd/sample_ssd_v2.uff` | 95.58 MB | .uff | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_train64_8.dll` | 90.88 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_train64_8.dll` | 78.15 MB | .dll | no |
| `native/tools/zig.zip` | 75.50 MB | .zip | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_builder_resource.dll` | 62.76 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio_ffmpeg/binaries/ffmpeg-win64-v4.1.exe` | 58.67 MB | .exe | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/cv2.cp36-win_amd64.pyd` | 58.38 MB | .pyd | no |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/curand64_10.dll` | 52.94 MB | .dll | no |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/googlenet/googlenet.caffemodel` | 51.05 MB | .caffemodel | no |

## 4. Special asset categories

### EXE
- Count: **49**
- Size: **2.04 GB**
| Path | Size | Ext |
|---|---:|---|
| `web-ui/dist-gvfi/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/node_modules/electron/dist/electron.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi/GVFI-Setup-1.0.0-x64.exe` | 151.25 MB | .exe |
| `web-ui/dist-gvfi/GVFI-Portable-1.0.0-x64.exe` | 151.03 MB | .exe |
| `AI_Tools/FFmpeg/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffmpeg.exe` | 97.18 MB | .exe |
| `AI_Tools/FFmpeg/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffprobe.exe` | 96.98 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio_ffmpeg/binaries/ffmpeg-win64-v4.1.exe` | 58.67 MB | .exe |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-ncnn-vulkan.exe` | 6.65 MB | .exe |
| `AI_Tools/RIFE_ncnn/rife-ncnn-vulkan.exe` | 6.65 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-ncnn-vulkan.exe` | 6.65 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-ncnn-vulkan.exe` | 6.65 MB | .exe |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-ncnn-vulkan.exe` | 6.65 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/realesrgan/realesrgan-ncnn-vulkan.exe` | 5.88 MB | .exe |
| `ECCV2022-RIFE/build/RIFE_Pro/RIFE_Pro.exe` | 3.12 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/RIFE_Pro.exe` | 3.12 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/bin/protoc.exe` | 2.69 MB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/Squirrel.exe` | 1.81 MB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/SyncReleases.exe` | 1.81 MB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/Squirrel-Mono.exe` | 1.77 MB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/nuget.exe` | 1.59 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/bin/trtexec.exe` | 793.25 KB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/7z-arm64.exe` | 476.50 KB | .exe |
| `web-ui/node_modules/@electron/windows-sign/vendor/signtool.exe` | 448.45 KB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/7z-x64.exe` | 436.50 KB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/7z.exe` | 436.50 KB | .exe |
| `web-ui/node_modules/electron-winstaller/vendor/StubExecutable.exe` | 282.00 KB | .exe |
| ... | ... | (+9 more) |

### DLL
- Count: **156**
- Size: **5.71 GB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_train64_8.dll` | 90.88 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_train64_8.dll` | 78.15 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_builder_resource.dll` | 62.76 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/curand64_10.dll` | 52.94 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cpp.dll` | 45.47 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_train64_8.dll` | 35.40 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/.libs/libopenblas.WCDJNK7YVMPZQ2ME2ZZHJJRJ3JIKNDB7.gfortran-win_amd64.dll` | 32.78 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_plugin.dll` | 30.15 MB | .dll |
| `web-ui/dist-gvfi/win-unpacked/dxcompiler.dll` | 24.43 MB | .dll |
| `web-ui/dist-gvfi-build/win-unpacked/dxcompiler.dll` | 24.43 MB | .dll |
| `web-ui/dist-gvfi-fresh/win-unpacked/dxcompiler.dll` | 24.43 MB | .dll |
| `web-ui/node_modules/electron/dist/dxcompiler.dll` | 24.43 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/caffe2_detectron_ops_gpu.dll` | 23.60 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/nvrtc64_111_0.dll` | 23.29 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/opencv_videoio_ffmpeg412_64.dll` | 21.03 MB | .dll |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/PyQt5/Qt5/bin/opengl32sw.dll` | 19.95 MB | .dll |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll` | 19.45 MB | .dll |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `web-ui/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `web-ui/_asar-extract/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `web-ui/_asar-repack/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | 18.23 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_python.dll` | 11.24 MB | .dll |
| `ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll` | 10.69 MB | .dll |
| `web-ui/dist-gvfi/win-unpacked/libGLESv2.dll` | 7.65 MB | .dll |
| `web-ui/dist-gvfi-build/win-unpacked/libGLESv2.dll` | 7.65 MB | .dll |
| `web-ui/dist-gvfi-fresh/win-unpacked/libGLESv2.dll` | 7.65 MB | .dll |
| `web-ui/node_modules/electron/dist/libGLESv2.dll` | 7.65 MB | .dll |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/PyQt5/Qt5/bin/Qt5Gui.dll` | 6.68 MB | .dll |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/PyQt5/Qt5/bin/Qt5Core.dll` | 5.74 MB | .dll |
| `web-ui/dist-gvfi/win-unpacked/vk_swiftshader.dll` | 5.25 MB | .dll |
| `web-ui/dist-gvfi-build/win-unpacked/vk_swiftshader.dll` | 5.25 MB | .dll |
| `web-ui/dist-gvfi-fresh/win-unpacked/vk_swiftshader.dll` | 5.25 MB | .dll |
| `web-ui/node_modules/electron/dist/vk_swiftshader.dll` | 5.25 MB | .dll |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/PyQt5/Qt5/bin/Qt5Widgets.dll` | 5.24 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/nvrtc-builtins64_111.dll` | 4.96 MB | .dll |
| `web-ui/dist-gvfi/win-unpacked/d3dcompiler_47.dll` | 4.52 MB | .dll |
| ... | ... | (+106 more) |

### LIB
- Count: **4**
- Size: **462.26 KB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.lib` | 451.16 KB | .lib |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvparsers.lib` | 4.59 KB | .lib |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_plugin.lib` | 4.39 KB | .lib |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvonnxparser.lib` | 2.12 KB | .lib |

### PDB
- Count: **5**
- Size: **13.53 MB**
| Path | Size | Ext |
|---|---:|---|
| `web-ui/node_modules/electron-winstaller/vendor/Setup.pdb` | 8.19 MB | .pdb |
| `web-ui/node_modules/electron-winstaller/vendor/WriteZipToSetup.pdb` | 5.24 MB | .pdb |
| `web-ui/node_modules/electron-winstaller/vendor/Squirrel.pdb` | 71.46 KB | .pdb |
| `web-ui/node_modules/electron-winstaller/vendor/Squirrel-Mono.pdb` | 20.83 KB | .pdb |
| `web-ui/node_modules/electron-winstaller/vendor/SyncReleases.pdb` | 13.82 KB | .pdb |

### Model weights (.bin/.param/.pth/.pt/.onnx/.weights/...)
- Count: **364**
- Size: **2.32 GB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50.onnx` | 97.74 MB | .onnx |
| `AI_Tools/RealCUGAN_ncnn/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/fusionnet.bin` | 22.59 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/fusionnet.bin` | 22.59 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v3.0/fusionnet.bin` | 22.59 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v3.1/fusionnet.bin` | 22.59 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | .bin |
| ... | ... | (+314 more) |

### Videos
- Count: **10**
- Size: **7.81 MB**
| Path | Size | Ext |
|---|---:|---|
| `ECCV2022-RIFE/user_data/p0_4_bench/enc_nvenc.mp4` | 2.25 MB | .mp4 |
| `ECCV2022-RIFE/user_data/p0_4_bench/enc_x265.mp4` | 1.71 MB | .mp4 |
| `ECCV2022-RIFE/user_data/uploads/6f252d77b4c64aaaaec44c493f5d4278_1d44baf45250a8efab2cee045c019d84.mp4` | 788.24 KB | .mp4 |
| `ECCV2022-RIFE/user_data/uploads/a433b60cc19a47ed8a87392eff946837_1d44baf45250a8efab2cee045c019d84.mp4` | 788.24 KB | .mp4 |
| `ECCV2022-RIFE/user_data/uploads/fcfe6a1ddc434c0685b6c61c34de9736_1d44baf45250a8efab2cee045c019d84.mp4` | 788.24 KB | .mp4 |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio/resources/images/cockatoo.mp4` | 711.67 KB | .mp4 |
| `ECCV2022-RIFE/user_data/p0_4_bench/src_1080p24.mp4` | 657.53 KB | .mp4 |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio/resources/images/realshort.mp4` | 94.55 KB | .mp4 |
| `ECCV2022-RIFE/user_data/color_pipeline_test/before_no_bt709.mp4` | 55.85 KB | .mp4 |
| `ECCV2022-RIFE/user_data/color_pipeline_test/after_bt709.mp4` | 55.38 KB | .mp4 |

### ncnn-related paths
- Count: **5,640**
- Size: **8.16 GB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/resnet50-infer-5.uff` | 97.89 MB | .uff |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50.onnx` | 97.74 MB | .onnx |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50_fp32.caffemodel` | 97.72 MB | .caffemodel |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/ssd/sample_ssd_v2.uff` | 95.58 MB | .uff |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_train64_8.dll` | 90.88 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_train64_8.dll` | 78.15 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_builder_resource.dll` | 62.76 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio_ffmpeg/binaries/ffmpeg-win64-v4.1.exe` | 58.67 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/cv2.cp36-win_amd64.pyd` | 58.38 MB | .pyd |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/curand64_10.dll` | 52.94 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/googlenet/googlenet.caffemodel` | 51.05 MB | .caffemodel |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/char-rnn/char-rnn.wts` | 48.81 MB | .wts |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/char-rnn/model/model-20080.data-00000-of-00001` | 48.81 MB | .data-00000-of-00001 |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cpp.dll` | 45.47 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_train64_8.dll` | 35.40 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/.libs/libopenblas.WCDJNK7YVMPZQ2ME2ZZHJJRJ3JIKNDB7.gfortran-win_amd64.dll` | 32.78 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_plugin.dll` | 30.15 MB | .dll |
| ... | ... | (+5610 more) |

### Vulkan-related paths
- Count: **264**
- Size: **1.80 GB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | .bin |
| ... | ... | (+234 more) |

### RIFE-related paths
- Count: **808**
- Size: **2.82 GB**
| Path | Size | Ext |
|---|---:|---|
| `ECCV2022-RIFE/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| ... | ... | (+778 more) |

### C6.x related
- Count: **9**
- Size: **136.78 KB**
| Path | Size | Ext |
|---|---:|---|
| `ECCV2022-RIFE/tests/test_c62_memory_io_poc.py` | 30.37 KB | .py |
| `ECCV2022-RIFE/tests/test_c64_gpu_batch.py` | 23.17 KB | .py |
| `ECCV2022-RIFE/tests/test_c61_profile.py` | 20.94 KB | .py |
| `ECCV2022-RIFE/tests/test_c65_steady_state_profile.py` | 20.72 KB | .py |
| `ECCV2022-RIFE/tests/test_c66_pipeline_overlap.py` | 16.44 KB | .py |
| `ECCV2022-RIFE/tests/test_c63_batch_poc.py` | 16.19 KB | .py |
| `docs/native/c66-pipeline-overlap-analysis.md` | 5.05 KB | .md |
| `docs/native/c65-steady-state-profile.md` | 2.31 KB | .md |
| `docs/native/c66-pipeline-overlap-report.md` | 1.59 KB | .md |

### C7.x related
- Count: **11**
- Size: **100.69 KB**
| Path | Size | Ext |
|---|---:|---|
| `ECCV2022-RIFE/tests/__pycache__/test_c71_final_regression.cpython-312.pyc` | 26.39 KB | .pyc |
| `ECCV2022-RIFE/tests/test_c72_cli_native_ab.py` | 23.87 KB | .py |
| `ECCV2022-RIFE/tests/test_c71_final_regression.py` | 19.14 KB | .py |
| `ECCV2022-RIFE/tests/__pycache__/test_c73_production_callchain_audit.cpython-312.pyc` | 8.06 KB | .pyc |
| `ECCV2022-RIFE/tests/__pycache__/test_c711_frame_mapping.cpython-312.pyc` | 6.42 KB | .pyc |
| `ECCV2022-RIFE/tests/test_c73_production_callchain_audit.py` | 4.34 KB | .py |
| `docs/native/c73-production-cleanup.md` | 4.24 KB | .md |
| `ECCV2022-RIFE/tests/test_c711_frame_mapping.py` | 3.76 KB | .py |
| `docs/native/c72-cli-native-ab.md` | 2.05 KB | .md |
| `docs/native/c71-final-regression.md` | 1.37 KB | .md |
| `docs/native/c711-frame-mapping-fix.md` | 1.05 KB | .md |

### C8.x related
- Count: **9**
- Size: **94.81 KB**
| Path | Size | Ext |
|---|---:|---|
| `docs/c8-svfi-vs-gvfi-audit.md` | 15.31 KB | .md |
| `docs/c81-algorithm-alignment-ab-design.md` | 13.76 KB | .md |
| `docs/c81-real-svfi-ab.md` | 11.67 KB | .md |
| `docs/c81-real-content-ab.md` | 11.64 KB | .md |
| `docs/c81-gmfss-legal-alternative-research.md` | 11.06 KB | .md |
| `docs/c81-gmfss-public-feasibility.md` | 10.80 KB | .md |
| `docs/c81-rife-alignment-ab.md` | 10.65 KB | .md |
| `docs/c81-visual-frame-review.md` | 6.85 KB | .md |
| `docs/c81-g0-rife-option-check.md` | 3.06 KB | .md |

### Benchmark / profile related
- Count: **205**
- Size: **2.05 MB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/data/haarcascade_profileface.xml` | 809.10 KB | .xml |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/valgrind_wrapper/valgrind.h` | 419.74 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/valgrind_wrapper/timer_interface.py` | 36.87 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/autograd/profiler_util.py` | 34.52 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/valgrind_wrapper/__pycache__/timer_interface.cpython-36.pyc` | 31.98 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/autograd/profiler.py` | 29.70 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/autograd/__pycache__/profiler_util.cpython-36.pyc` | 26.34 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/autograd/__pycache__/profiler.cpython-36.pyc` | 25.18 KB | .pyc |
| `ECCV2022-RIFE/tests/test_c61_profile.py` | 20.94 KB | .py |
| `ECCV2022-RIFE/tests/test_c65_steady_state_profile.py` | 20.72 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/timer.py` | 19.32 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/fuzzer.py` | 18.23 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/profiler/profiler.py` | 18.03 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/__pycache__/fuzzer.cpython-36.pyc` | 17.90 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/torch/csrc/autograd/profiler_legacy.h` | 17.12 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/__pycache__/timer.cpython-36.pyc` | 16.29 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/profiler/__pycache__/profiler.cpython-36.pyc` | 15.83 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/examples/end_to_end.py` | 14.73 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/examples/__pycache__/end_to_end.cpython-36.pyc` | 14.13 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/__pycache__/compare.cpython-36.pyc` | 13.76 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/common.py` | 13.62 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/__pycache__/common.cpython-36.pyc` | 12.70 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/compare.py` | 12.38 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/autograd/profiler_legacy.py` | 10.89 KB | .py |
| `web-ui/src/components/settings/api-profiles-panel.tsx` | 10.69 KB | .tsx |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/torch/csrc/autograd/profiler_kineto.h` | 9.26 KB | .h |
| `docs/native/native-performance-profile.md` | 8.46 KB | .md |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/distributed/rpc/server_process_global_profiler.py` | 8.13 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/distributed/rpc/__pycache__/server_process_global_profiler.cpython-36.pyc` | 7.69 KB | .pyc |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/examples/blas_compare.py` | 7.67 KB | .py |
| ... | ... | (+175 more) |

### Native tree (`native/`)
- Count: **60**
- Size: **84.59 MB**
| Path | Size | Ext |
|---|---:|---|
| `native/tools/zig.zip` | 75.50 MB | .zip |
| `native/tools/cmake.zip` | 8.77 MB | .zip |
| `native/third_party/rife/rife.cpp` | 169.03 KB | .cpp |
| `native/src/gvfi_native.cpp` | 11.85 KB | .cpp |
| `native/third_party/rife/process_v4_batch.cpp` | 11.02 KB | .cpp |
| `native/src/pipeline_rife_worker.cpp` | 9.05 KB | .cpp |
| `native/src/pipeline_poc_capi.cpp` | 8.35 KB | .cpp |
| `native/CMakeFiles/CMakeConfigureLog.yaml` | 7.45 KB | .yaml |
| `native/third_party/rife/rife_v4_flow_tta_avg.comp` | 6.91 KB | .comp |
| `native/src/ncnn_vulkan_backend.cpp` | 6.80 KB | .cpp |
| `native/src/batch_rife_worker.cpp` | 6.78 KB | .cpp |
| `native/third_party/rife/warp.cpp` | 5.53 KB | .cpp |
| `native/include/gvfi_native.h` | 4.91 KB | .h |
| `native/CMakeLists.txt` | 4.68 KB | .txt |
| `native/CMakeCache.txt` | 4.39 KB | .txt |
| `native/src/gvfi_capi.cpp` | 4.15 KB | .cpp |
| `native/src/work_loop.cpp` | 4.08 KB | .cpp |
| `native/third_party/rife/rife_flow_tta_avg.comp` | 3.16 KB | .comp |
| `native/third_party/rife/rife_preproc_tta.comp` | 3.00 KB | .comp |
| `native/include/gvfi/pipeline_rife_worker.hpp` | 2.97 KB | .hpp |
| `native/src/event_source.cpp` | 2.90 KB | .cpp |
| `native/third_party/rife/rife_v2_flow_tta_avg.comp` | 2.63 KB | .comp |
| `native/src/memory_pressure.cpp` | 2.62 KB | .cpp |
| `native/third_party/rife/rife_postproc_tta.comp` | 2.51 KB | .comp |
| `native/include/gvfi/event_source.hpp` | 2.29 KB | .hpp |
| `native/third_party/rife/warp_pack8.comp` | 2.18 KB | .comp |
| `native/src/zone_pool.cpp` | 2.13 KB | .cpp |
| `native/build_with_zig.cmd` | 2.13 KB | .cmd |
| `native/tests/test_work_loop.cpp` | 2.07 KB | .cpp |
| `native/third_party/rife/rife.h` | 2.05 KB | .h |
| ... | ... | (+30 more) |

### Frontend tree (`web-ui/`)
- Count: **95,746**
- Size: **5.37 GB**
| Path | Size | Ext |
|---|---:|---|
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001825.sst` | 248.57 MB | .sst |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001714.sst` | 248.34 MB | .sst |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar` | 240.88 MB | .asar |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar` | 240.88 MB | .asar |
| `web-ui/dist-desktop/win-unpacked/resources/app.asar` | 239.01 MB | .asar |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001716.sst` | 221.41 MB | .sst |
| `web-ui/dist-gvfi/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | 215.16 MB | .exe |
| `web-ui/node_modules/electron/dist/electron.exe` | 215.16 MB | .exe |
| `web-ui/dist-gvfi/GVFI-Setup-1.0.0-x64.exe` | 151.25 MB | .exe |
| `web-ui/dist-gvfi/GVFI-Portable-1.0.0-x64.exe` | 151.03 MB | .exe |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar` | 145.99 MB | .asar |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/_asar-extract/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/_asar-repack/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | .node |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001827.sst` | 113.43 MB | .sst |
| ... | ... | (+95726 more) |

### Python sources (non-cache)
- Count: **1,599**
- Size: **21.90 MB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/common_methods_invocations.py` | 476.43 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/_torch_docs.py` | 367.42 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio/plugins/_tifffile.py` | 358.79 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/distributed/distributed_test.py` | 340.58 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/tests/test_multiarray.py` | 320.64 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/hipify/cuda_to_hip_mappings.py` | 308.62 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/generated/annotated_fn_args.py` | 303.15 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/ma/core.py` | 265.83 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/common_nn.py` | 250.08 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/distributed/rpc/rpc_test.py` | 229.90 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/pkg_resources/_vendor/pyparsing.py` | 226.62 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/nn/functional.py` | 205.90 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/_add_newdocs.py` | 204.67 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/ma/tests/test_core.py` | 199.66 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/idna/uts46data.py` | 193.64 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/lib/function_base.py` | 156.33 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/onnx/symbolic_opset9.py` | 136.97 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/f2py/crackfortran.py` | 129.23 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/lib/tests/test_function_base.py` | 126.51 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/tests/test_numeric.py` | 124.40 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/distributed/distributed_c10d.py` | 122.81 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/tests/test_umath.py` | 121.75 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/fromnumeric.py` | 120.02 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/common_utils.py` | 119.01 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/_tensor_docs.py` | 115.63 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/tests/test_nditer.py` | 112.47 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/core/tests/test_datetime.py` | 107.98 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/testing/_internal/distributed/rpc/dist_autograd_test.py` | 107.84 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/distutils/system_info.py` | 105.79 KB | .py |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/pkg_resources/__init__.py` | 105.67 KB | .py |
| ... | ... | (+1569 more) |

### C/C++ sources (non-cache)
- Count: **1,784**
- Size: **17.69 MB**
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/Operators.h` | 1.65 MB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/RedispatchFunctions.h` | 1.08 MB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/Functions.h` | 839.62 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/RegistrationDeclarations.h` | 535.28 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/proto/caffe2.pb.h` | 466.61 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/benchmark/utils/valgrind_wrapper/valgrind.h` | 419.74 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/NativeFunctions.h` | 349.45 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/include/NvInfer.h` | 295.45 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/core/TensorBody.h` | 246.76 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/torch/csrc/autograd/generated/Functions.h` | 228.71 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/CUDAFunctions_inl.h` | 182.87 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/CPUFunctions_inl.h` | 169.38 KB | .h |
| `native/third_party/rife/rife.cpp` | 169.03 KB | .cpp |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/samples/common/half.h` | 154.44 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/CompositeImplicitAutogradFunctions_inl.h` | 139.84 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/proto/torch.pb.h` | 129.31 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/proto/metanet.pb.h` | 114.00 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/pybind11/pybind11.h` | 111.34 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/include/NvInferRuntime.h` | 106.20 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/c10/core/TensorImpl.h` | 96.45 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/c10/util/variant.h` | 95.88 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/pybind11/cast.h` | 95.53 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/native/Math.h` | 91.27 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/MetaFunctions_inl.h` | 82.76 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/proto/predictor_consts.pb.h` | 78.67 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/include/NvInferRuntimeCommon.h` | 77.90 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/proto/prof_dag.pb.h` | 77.48 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/ATen/core/jit_type.h` | 76.69 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/include/caffe2/serialize/crc_alt.h` | 74.84 KB | .h |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/samples/common/sampleOptions.cpp` | 72.23 KB | .cpp |
| ... | ... | (+1754 more) |

### Web sources TS/JS/CSS/HTML (non-cache, excl node_modules)
- Count: **241**
- Size: **877.34 KB**
| Path | Size | Ext |
|---|---:|---|
| `web-ui/src/lib/i18n/messages/en.ts` | 40.15 KB | .ts |
| `web-ui/src/lib/i18n/messages/zh-CN.ts` | 39.09 KB | .ts |
| `web-ui/public/liquid-glass/container.js` | 26.09 KB | .js |
| `web-ui/public/liquid-glass/button.js` | 25.12 KB | .js |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/model_dump/code.js` | 19.29 KB | .js |
| `web-ui/src/components/process/process-workspace-context.tsx` | 16.69 KB | .tsx |
| `web-ui/electron/main.js` | 15.55 KB | .js |
| `web-ui/src/components/settings/font-display-panel.tsx` | 14.98 KB | .tsx |
| `web-ui/src/components/ai-workspace/chat-pane.tsx` | 14.59 KB | .tsx |
| `web-ui/src/components/appearance-panel.tsx` | 13.86 KB | .tsx |
| `web-ui/src/design-tokens/glass-base.css` | 12.99 KB | .css |
| `web-ui/src/components/dashboard/gvfi-dashboard.tsx` | 12.44 KB | .tsx |
| `web-ui/src/components/settings/api-profiles-panel.tsx` | 10.69 KB | .tsx |
| `web-ui/.cursor/skills/brand/scripts/validate-asset.cjs` | 10.31 KB | .cjs |
| `web-ui/src/components/ai-workspace/control-panel.tsx` | 10.30 KB | .tsx |
| `web-ui/src/design-tokens/ios-liquid-button.css` | 10.00 KB | .css |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/utils/model_dump/preact.mjs` | 9.84 KB | .mjs |
| `web-ui/src/app/globals.css` | 9.83 KB | .css |
| `web-ui/.cursor/skills/brand/scripts/inject-brand-context.cjs` | 9.79 KB | .cjs |
| `web-ui/scripts/browser-acceptance.mjs` | 9.59 KB | .mjs |
| `web-ui/.cursor/skills/brand/scripts/sync-brand-to-tokens.cjs` | 9.56 KB | .cjs |
| `web-ui/.cursor/skills/brand/scripts/extract-colors.cjs` | 9.44 KB | .cjs |
| `web-ui/src/stores/appearance-store.ts` | 9.34 KB | .ts |
| `web-ui/src/components/render/render-center.tsx` | 8.27 KB | .tsx |
| `web-ui/src/components/ai-workspace/ai-fix-actions.tsx` | 7.94 KB | .tsx |
| `web-ui/src/components/workspace/video-workspace-page.tsx` | 7.75 KB | .tsx |
| `web-ui/scripts/e2e-acceptance.mjs` | 7.04 KB | .mjs |
| `web-ui/src/lib/image-file.ts` | 6.98 KB | .ts |
| `web-ui/src/components/process/analysis-report-panel.tsx` | 6.78 KB | .tsx |
| `web-ui/src/lib/liquid-glass/glass.css` | 6.72 KB | .css |
| ... | ... | (+211 more) |

### Docs
- Count: **3,422**
- Size: **29.71 MB**
| Path | Size | Ext |
|---|---:|---|
| `web-ui/node_modules/@base-ui/react/docs/react/components/combobox.md` | 331.49 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/combobox.md` | 331.49 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/combobox.md` | 331.49 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/autocomplete.md` | 288.98 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/autocomplete.md` | 288.98 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/autocomplete.md` | 288.98 KB | .md |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/ssd/sample_ssd_v2.uff.txt` | 286.48 KB | .txt |
| `web-ui/node_modules/@base-ui/react/docs/react/components/drawer.md` | 234.96 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/drawer.md` | 234.96 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/drawer.md` | 234.96 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/menu.md` | 232.66 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/menu.md` | 232.66 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/menu.md` | 232.66 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/toast.md` | 169.50 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/toast.md` | 169.50 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/toast.md` | 169.50 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/select.md` | 161.48 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/select.md` | 161.48 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/select.md` | 161.48 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/dialog.md` | 154.39 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/dialog.md` | 154.39 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/dialog.md` | 154.39 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/handbook/forms.md` | 153.00 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/handbook/forms.md` | 153.00 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/handbook/forms.md` | 153.00 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/navigation-menu.md` | 152.45 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/navigation-menu.md` | 152.45 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/navigation-menu.md` | 152.45 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/popover.md` | 135.74 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/popover.md` | 135.74 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/popover.md` | 135.74 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/tooltip.md` | 130.08 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/tooltip.md` | 130.08 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/tooltip.md` | 130.08 KB | .md |
| `web-ui/node_modules/systeminformation/README.md` | 126.33 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/context-menu.md` | 125.47 KB | .md |
| `web-ui/_asar-extract/node_modules/@base-ui/react/docs/react/components/context-menu.md` | 125.47 KB | .md |
| `web-ui/_asar-repack/node_modules/@base-ui/react/docs/react/components/context-menu.md` | 125.47 KB | .md |
| `web-ui/node_modules/node-gyp/CHANGELOG.md` | 120.61 KB | .md |
| `web-ui/node_modules/@base-ui/react/docs/react/components/preview-card.md` | 114.12 KB | .md |
| ... | ... | (+3382 more) |

## 5. Ignored but may be required for restore/runtime

These are currently excluded by `.gitignore` (or equivalent heuristic). **Not deleted.** For a full restore archive they need LFS / Release / external archive decisions:

- `AI_Tools/` — 完整本地工具链（RIFE/RealCUGAN/FFmpeg）；恢复运行常需要，但体积巨大且多为第三方
- `ECCV2022-RIFE/models/` — RIFE/超分模型权重；运行必需
- `ECCV2022-RIFE/**/*.bin|*.param|*.pt|*.pth|*.onnx` — ncnn/Torch 模型文件；运行必需
- `ECCV2022-RIFE/**/rife-ncnn-vulkan*/` — RIFE CLI 可执行与模型包；当前 production CLI 路径依赖
- `ECCV2022-RIFE/ffmpeg.exe / ffprobe.exe` — 音视频管线必需二进制
- `ECCV2022-RIFE/realesrgan*` — 超分可执行与模型
- `ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll` — Native 后端 DLL（若走 native）；文件本身可能被 *.dll 规则以外跟踪——需核对
- `native/tools/*.zip` — 本地构建工具包（如 zig）；可再下载
- `*.lib / *.pdb` — MSVC 链接/调试产物；通常可重建，但完整调试归档可能需要
- `web-ui/node_modules/` — 可 npm install 重建
- `web-ui/.next/ / dist-*` — 可重建前端产物
- `ECCV2022-RIFE/dist/ / build/` — PyInstaller 打包产物；可重建
- `*.mp4 等视频` — 测试/用户视频；实验复现可能需要部分样本

### Notable ignored runtime binaries/models currently on disk (sample)
| Path | Size | Ext |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50.onnx` | 97.74 MB | .onnx |
| `AI_Tools/FFmpeg/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffmpeg.exe` | 97.18 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffmpeg.exe` | 97.18 MB | .exe |
| `AI_Tools/FFmpeg/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffprobe.exe` | 96.98 MB | .exe |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffprobe.exe` | 96.98 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_train64_8.dll` | 90.88 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_train64_8.dll` | 78.15 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_builder_resource.dll` | 62.76 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio_ffmpeg/binaries/ffmpeg-win64-v4.1.exe` | 58.67 MB | .exe |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/curand64_10.dll` | 52.94 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cpp.dll` | 45.47 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_train64_8.dll` | 35.40 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/.libs/libopenblas.WCDJNK7YVMPZQ2ME2ZZHJJRJ3JIKNDB7.gfortran-win_amd64.dll` | 32.78 MB | .dll |
| `AI_Tools/RealCUGAN_ncnn/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `ECCV2022-RIFE/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | .bin |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_plugin.dll` | 30.15 MB | .dll |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | .bin |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | .bin |

## 6. Sensitive information scan

- `.env*` files found: **1**
  - `web-ui/.env.example` (455 B)
- Pattern hits (heuristic): **1**

| File | Line | Kind | Snippet |
|---|---:|---|---|
| `web-ui/src/components/ai-workspace/chat-pane.tsx` | 44 | api_key | `const hasApiKey = useAiModelConfigStore((s) => s.hasApiKey);` |

**Assessment:** The single hit is a **false positive** (identifier `hasApiKey`, not a secret value). `web-ui/.env.example` is a template only (no live credentials). No blocking secrets found in this scan.

**Note:** Heuristic scan can false-positive on docs/examples. Manual review still required before any commit.

## 7. Large files already in Git history (>50 MB blobs)

_No blobs >50 MB found in current object database scan._

## 8. Preliminary A/B/C classification

| Class | Count | Size | Meaning |
|---|---:|---:|---|
| A Regular Git | 4,571 | 312.37 MB | Source/docs/config/small assets |
| B LFS candidates | 439 | 9.08 GB | Models/binaries/large media (review license) |
| C Cache/temp | 97,043 | 5.44 GB | Regenerable; suggest ignore; **do not delete now** |

## 9. GitHub limit / storage routing (preliminary)

| Route | Count | Size | Guidance |
|---|---:|---:|---|
| Cannot use regular Git (>100 MB) | 32 | 8.35 GB | Must be LFS, Release, or external |
| Strong external-archive candidates (>1 GB or huge AI_Tools) | 3 | 2.69 GB | Prefer external disk/Netdisk + SHA256 in repo |

### Files that cannot enter regular GitHub Git (>100 MB)

| Path | Size | Suggested route |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | External archive + SHA256 (third-party toolchain) |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001825.sst` | 248.57 MB | Do not upload (cache/temp); rebuild |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001714.sst` | 248.34 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar` | 240.88 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar` | 240.88 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-desktop/win-unpacked/resources/app.asar` | 239.01 MB | Do not upload (cache/temp); rebuild |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | External archive + SHA256 (third-party toolchain) |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001716.sst` | 221.41 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi/win-unpacked/GVFI.exe` | 215.16 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-build/win-unpacked/GVFI.exe` | 215.16 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-fresh/win-unpacked/GVFI.exe` | 215.16 MB | Do not upload (cache/temp); rebuild |
| `web-ui/node_modules/electron/dist/electron.exe` | 215.16 MB | Do not upload (cache/temp); rebuild |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | External archive + SHA256 (third-party toolchain) |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | External archive + SHA256 (third-party toolchain) |
| `web-ui/dist-gvfi/GVFI-Setup-1.0.0-x64.exe` | 151.25 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi/GVFI-Portable-1.0.0-x64.exe` | 151.03 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar` | 145.99 MB | Do not upload (cache/temp); rebuild |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | External archive + SHA256 (third-party toolchain) |
| `web-ui/dist-gvfi/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-build/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/dist-gvfi-fresh/win-unpacked/resources/app.asar.unpacked/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/_asar-extract/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/_asar-repack/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 130.53 MB | Do not upload (cache/temp); rebuild |
| `web-ui/.next/dev/cache/turbopack/v16.2.12/00001827.sst` | 113.43 MB | Do not upload (cache/temp); rebuild |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | External archive + SHA256 (third-party toolchain) |

## 10. Important large-file SHA256 (for later restore verification)

Hashed **120** important large/runtime files:

| Path | Size | SHA256 |
|---|---:|---|
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cu.dll` | 1.40 GB | `5af93a088ccd8b6c0a0a9f99c39e90a58f4de1be20e23f759d8e6b25b3a9702d` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_infer64_8.dll` | 672.69 MB | `53e50b33ded0e7c56f4fb68a39f58a62b074541c4a637c8f438b230767e9e307` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolver64_11.dll` | 650.03 MB | `e55e82814b0ff695e426b6d04b50e2a01c357bf0bb53d8509c78f6c448c02159` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusolverMg64_11.dll` | 370.61 MB | `184c8b58bf3a85c190b0926880e2d88d2ebce2f6e5636b62737696e2fec6c260` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer.dll` | 360.39 MB | `430bbbf873ab09236a6f3e0b4ce015557fb3be8b062acf4129043ac6dc53efd3` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_infer64_8.dll` | 308.06 MB | `32751e46d849cbd64f72aa7e43efd805b7da73816c5b6a7cdaaaef4c38f2e858` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cufft64_10.dll` | 223.57 MB | `fbd614300e208bdb9eb557ac250ed4d78acf44ae40ac81c22b831051d6247fa3` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cusparse64_11.dll` | 222.74 MB | `4c37d8936a4ccdec5ae7326e3d0a7abb23c4c6cc655e75f6eb7796a7cf5bea74` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cpu.dll` | 208.62 MB | `71753eea7728fddf99093ba78322c38187a8a9a58323ab08e3197e8520f9c0a7` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublasLt64_11.dll` | 204.31 MB | `277a5d331438b36e5a3d1ef4a22dfaf1b08601545e9836f69ff803eed6d52605` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_infer64_8.dll` | 139.72 MB | `8472573254836962fa2c9905961380c821b4a9a1b5f3fe0f109445e966ac2be9` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cublas64_11.dll` | 108.08 MB | `9ccd2d4a718d08993692c1c3a17afed5aa327a8abda01cf88b36edb289b6f63c` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/resnet50-infer-5.uff` | 97.89 MB | `22a326741e65233f52f16cc7bb8e5275d08b4c78af5009fa038287ac86251b5a` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50.onnx` | 97.74 MB | `78eecdb9354e71364b9df6f3b5824ecc48710938d5b4ea23724b9a2e9edbc4a6` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/resnet50/ResNet50_fp32.caffemodel` | 97.72 MB | `44ee2b08816cede2b7aaa047888df07dcab52f73399aa1c8bef05a17bfdd4888` |
| `AI_Tools/FFmpeg/ffmpeg.exe` | 97.18 MB | `1326dde4c84ff1f96fe6b8916c5bed29e163e9b5dccf995f6f3db069d143ec5e` |
| `ECCV2022-RIFE/ffmpeg.exe` | 97.18 MB | `1326dde4c84ff1f96fe6b8916c5bed29e163e9b5dccf995f6f3db069d143ec5e` |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffmpeg.exe` | 97.18 MB | `1326dde4c84ff1f96fe6b8916c5bed29e163e9b5dccf995f6f3db069d143ec5e` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffmpeg.exe` | 97.18 MB | `1326dde4c84ff1f96fe6b8916c5bed29e163e9b5dccf995f6f3db069d143ec5e` |
| `AI_Tools/FFmpeg/ffprobe.exe` | 96.98 MB | `b49ccc7c6547b141ad5a2f6ec69cc04323d7133d7704d70b331b904c63eecb07` |
| `ECCV2022-RIFE/ffprobe.exe` | 96.98 MB | `b49ccc7c6547b141ad5a2f6ec69cc04323d7133d7704d70b331b904c63eecb07` |
| `ECCV2022-RIFE/dist/RIFE_Pro/ffprobe.exe` | 96.98 MB | `b49ccc7c6547b141ad5a2f6ec69cc04323d7133d7704d70b331b904c63eecb07` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/ffprobe.exe` | 96.98 MB | `b49ccc7c6547b141ad5a2f6ec69cc04323d7133d7704d70b331b904c63eecb07` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/ssd/sample_ssd_v2.uff` | 95.58 MB | `6f1d0bcb55fd9543ee8b9a83ebf14dc0ed682643ef9dd57f81220752e9e90121` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_adv_train64_8.dll` | 90.88 MB | `1e3474c607c7ec078384e4592ecc4b25a680d3aec9ae404da84279e12c0f4f23` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_cnn_train64_8.dll` | 78.15 MB | `639432ca0d54efdd699e59243e31ecc46042736d6a77b8e17b2d3a2160f44dfa` |
| `native/tools/zig.zip` | 75.50 MB | `d859994725ef9402381e557c60bb57497215682e355204d754ee3df75ee3c158` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_builder_resource.dll` | 62.76 MB | `7b68362689b0cf276150bb2f309d61868859992c6def138fb75cf067f923040e` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/imageio_ffmpeg/binaries/ffmpeg-win64-v4.1.exe` | 58.67 MB | `62b2b2c72d7b8cb23a57c750a1a4380c0e6104dd4a2f121bd5bf21281287f88f` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/cv2.cp36-win_amd64.pyd` | 58.38 MB | `41a9110bc39ec29893c28ae3a5be6f25d965f83f7e46d92d57bad0073bd9c242` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/curand64_10.dll` | 52.94 MB | `1626c5b7251952ec9daccf37969e497b9b6f2c51f1f265f069e5637e6d2f582a` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/data/googlenet/googlenet.caffemodel` | 51.05 MB | `6f7101e3a2183738a7125a0c5021ba82a1feb4228c5ca0924d991b6daf6f6fad` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_cuda_cpp.dll` | 45.47 MB | `3753b3c53763d635721aee60ecf14b1a492e08878126e2f373acb995dbd96c3e` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/cudnn_ops_train64_8.dll` | 35.40 MB | `c35ff595c36eeee6566d195290c9892684c83691eb3c23da5db86558e8a68a73` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/numpy/.libs/libopenblas.WCDJNK7YVMPZQ2ME2ZZHJJRJ3JIKNDB7.gfortran-win_amd64.dll` | 32.78 MB | `c9f888b72c1230214a871b7b414b90d5780d95cb3e5fb4a08f553040f78ff55d` |
| `AI_Tools/RealCUGAN_ncnn/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/dist/RIFE_Pro/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/dist/RIFE_Pro/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `ECCV2022-RIFE/realesrgan/models/realesrgan-x4plus.bin` | 31.88 MB | `713ee713b0353afaa27976f0563a64a5043bd70b9bd8936c2e26e25ebcdbcddf` |
| `AI_Tools/RealCUGAN_ncnn/TensorRT-8.2.5.1/lib/nvinfer_plugin.dll` | 30.15 MB | `42e2ddf424d97ee6e601e8e7e34653a8430bb8933aa3203cdef9473cbedfbeeb` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | `432c53b8d519f1a7c65813f38fc0e4cb66adc62b166bc6339040cd113c4f30fa` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | `0cd8d87cb86882d4ebb587d78ca276c1eeb3e7f3d093bed1b77c7d6ef7db6887` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | `924c5d5461099cde803f85953868bf8407f8a6b342861c75122f2876d96e55b1` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | `432c53b8d519f1a7c65813f38fc0e4cb66adc62b166bc6339040cd113c4f30fa` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | `0cd8d87cb86882d4ebb587d78ca276c1eeb3e7f3d093bed1b77c7d6ef7db6887` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | `924c5d5461099cde803f85953868bf8407f8a6b342861c75122f2876d96e55b1` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | `432c53b8d519f1a7c65813f38fc0e4cb66adc62b166bc6339040cd113c4f30fa` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | `0cd8d87cb86882d4ebb587d78ca276c1eeb3e7f3d093bed1b77c7d6ef7db6887` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | `924c5d5461099cde803f85953868bf8407f8a6b342861c75122f2876d96e55b1` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/flownet.bin` | 29.14 MB | `432c53b8d519f1a7c65813f38fc0e4cb66adc62b166bc6339040cd113c4f30fa` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/flownet.bin` | 29.14 MB | `0cd8d87cb86882d4ebb587d78ca276c1eeb3e7f3d093bed1b77c7d6ef7db6887` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/flownet.bin` | 29.14 MB | `924c5d5461099cde803f85953868bf8407f8a6b342861c75122f2876d96e55b1` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | `006cdedc84c20f30825ab65a44655ee6baf181573118ca039a344dc6adff7cd9` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | `f58e6f05440b735349a59973d14abd5e51662404aee070536e52c2f7cfdba440` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | `5c9428bb8b270b4da69ce213ca98e23d5cef8eda78ab8bae1599d559497176b8` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | `006cdedc84c20f30825ab65a44655ee6baf181573118ca039a344dc6adff7cd9` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | `f58e6f05440b735349a59973d14abd5e51662404aee070536e52c2f7cfdba440` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | `5c9428bb8b270b4da69ce213ca98e23d5cef8eda78ab8bae1599d559497176b8` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | `006cdedc84c20f30825ab65a44655ee6baf181573118ca039a344dc6adff7cd9` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | `f58e6f05440b735349a59973d14abd5e51662404aee070536e52c2f7cfdba440` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | `5c9428bb8b270b4da69ce213ca98e23d5cef8eda78ab8bae1599d559497176b8` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/fusionnet.bin` | 28.57 MB | `006cdedc84c20f30825ab65a44655ee6baf181573118ca039a344dc6adff7cd9` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/fusionnet.bin` | 28.57 MB | `f58e6f05440b735349a59973d14abd5e51662404aee070536e52c2f7cfdba440` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-UHD/fusionnet.bin` | 28.57 MB | `5c9428bb8b270b4da69ce213ca98e23d5cef8eda78ab8bae1599d559497176b8` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | `ab459482f6c20294c40e94c802d09be34f5dc246576499acfd2d49c03b6cea9a` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | `bcad0fdd5dcc3ba07c60359d1460b0fef6856f888eabd57dc721cc466c59ae30` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | `7faa0572aebab154817e9c5a0beb584dedae87b93603782f4bda23d999f1dd09` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | `ab459482f6c20294c40e94c802d09be34f5dc246576499acfd2d49c03b6cea9a` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | `bcad0fdd5dcc3ba07c60359d1460b0fef6856f888eabd57dc721cc466c59ae30` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | `7faa0572aebab154817e9c5a0beb584dedae87b93603782f4bda23d999f1dd09` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | `ab459482f6c20294c40e94c802d09be34f5dc246576499acfd2d49c03b6cea9a` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | `bcad0fdd5dcc3ba07c60359d1460b0fef6856f888eabd57dc721cc466c59ae30` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | `7faa0572aebab154817e9c5a0beb584dedae87b93603782f4bda23d999f1dd09` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-anime/flownet.bin` | 25.64 MB | `ab459482f6c20294c40e94c802d09be34f5dc246576499acfd2d49c03b6cea9a` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-HD/flownet.bin` | 25.64 MB | `bcad0fdd5dcc3ba07c60359d1460b0fef6856f888eabd57dc721cc466c59ae30` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-UHD/flownet.bin` | 25.64 MB | `7faa0572aebab154817e9c5a0beb584dedae87b93603782f4bda23d999f1dd09` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/caffe2_detectron_ops_gpu.dll` | 23.60 MB | `c2c108966ac033505f0fd584ed448bc2c0c20c3d079346689c4e0587da3f84da` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/nvrtc64_111_0.dll` | 23.29 MB | `606f90a943c142945bce43a9f9c231dedc996c8b42920f98e7180cbc3ac9875d` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | `10e7a372cef1285fe08421857c0ad3b70e39de98c0573adb2185f0877fdd9cdb` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.3/fusionnet.bin` | 22.59 MB | `30fdc1ffdcace52688871645b20b93a5104054e8ece7f7187ed3573e9fa54f5b` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v2.4/fusionnet.bin` | 22.59 MB | `26a8188b8b6fc087d03d7729ccfc92fb1ba8f40d2b237aee13436a40477d1840` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v3.0/fusionnet.bin` | 22.59 MB | `bd48e83dfed5b923d299addc483ce90a6a5c2d408012d6408c65a89a71f3bfae` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v3.1/fusionnet.bin` | 22.59 MB | `e8e78171d1a8dc7a406d37098c7d3130dbc1e1ca0801d84ad1cc23d8ca781271` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | `10e7a372cef1285fe08421857c0ad3b70e39de98c0573adb2185f0877fdd9cdb` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.3/fusionnet.bin` | 22.59 MB | `30fdc1ffdcace52688871645b20b93a5104054e8ece7f7187ed3573e9fa54f5b` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v2.4/fusionnet.bin` | 22.59 MB | `26a8188b8b6fc087d03d7729ccfc92fb1ba8f40d2b237aee13436a40477d1840` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v3.0/fusionnet.bin` | 22.59 MB | `bd48e83dfed5b923d299addc483ce90a6a5c2d408012d6408c65a89a71f3bfae` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v3.1/fusionnet.bin` | 22.59 MB | `e8e78171d1a8dc7a406d37098c7d3130dbc1e1ca0801d84ad1cc23d8ca781271` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | `10e7a372cef1285fe08421857c0ad3b70e39de98c0573adb2185f0877fdd9cdb` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.3/fusionnet.bin` | 22.59 MB | `30fdc1ffdcace52688871645b20b93a5104054e8ece7f7187ed3573e9fa54f5b` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v2.4/fusionnet.bin` | 22.59 MB | `26a8188b8b6fc087d03d7729ccfc92fb1ba8f40d2b237aee13436a40477d1840` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v3.0/fusionnet.bin` | 22.59 MB | `bd48e83dfed5b923d299addc483ce90a6a5c2d408012d6408c65a89a71f3bfae` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v3.1/fusionnet.bin` | 22.59 MB | `e8e78171d1a8dc7a406d37098c7d3130dbc1e1ca0801d84ad1cc23d8ca781271` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2/fusionnet.bin` | 22.59 MB | `10e7a372cef1285fe08421857c0ad3b70e39de98c0573adb2185f0877fdd9cdb` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.3/fusionnet.bin` | 22.59 MB | `30fdc1ffdcace52688871645b20b93a5104054e8ece7f7187ed3573e9fa54f5b` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v2.4/fusionnet.bin` | 22.59 MB | `26a8188b8b6fc087d03d7729ccfc92fb1ba8f40d2b237aee13436a40477d1840` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v3.0/fusionnet.bin` | 22.59 MB | `bd48e83dfed5b923d299addc483ce90a6a5c2d408012d6408c65a89a71f3bfae` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v3.1/fusionnet.bin` | 22.59 MB | `e8e78171d1a8dc7a406d37098c7d3130dbc1e1ca0801d84ad1cc23d8ca781271` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/cv2/opencv_videoio_ffmpeg412_64.dll` | 21.03 MB | `da64038314295b631c3ede7cb4055c96faa88cd15aa7a054a2faf5c685fe90ea` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/PyQt5/Qt5/bin/opengl32sw.dll` | 19.95 MB | `963641a718f9cae2705d5299eae9b7444e84e72ab3bef96a691510dd05fa1da4` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll` | 19.45 MB | `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife/flownet.bin` | 12.09 MB | `b0c901adbbe5851a1e033a25b02ea81c3be5129ce7436c59d3b3f236abc45119` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife/flownet.bin` | 12.09 MB | `b0c901adbbe5851a1e033a25b02ea81c3be5129ce7436c59d3b3f236abc45119` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife/flownet.bin` | 12.09 MB | `b0c901adbbe5851a1e033a25b02ea81c3be5129ce7436c59d3b3f236abc45119` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife/flownet.bin` | 12.09 MB | `b0c901adbbe5851a1e033a25b02ea81c3be5129ce7436c59d3b3f236abc45119` |
| `ECCV2022-RIFE/train_log/flownet.pkl` | 11.62 MB | `fe854fc8996547c953f732aaa3b78cae76cc0a12833ae856ea0749c4c570d7d8` |
| `AI_Tools/RealCUGAN_ncnn/RealCUGAN_for_win10_torch1.10.0cu111_20220227/RealCUGAN_for_win10_torch1.10.0cu111_20220227/runtime/torch/lib/torch_python.dll` | 11.24 MB | `b17a44e66b522acac7ebc58f6988771fc84e63fd521679152d84280b11a4a495` |
| `ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll` | 10.69 MB | `103018353aac8629359bada83c4b2ad3b83a7c3a95ab57e0f47f72879a6291a7` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v4.6/flownet.bin` | 10.12 MB | `f334ed2260149ce0188a6dcf049844e8b0cdd912e01cbcfb63553157d2508958` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v4.6/flownet.bin` | 10.12 MB | `f334ed2260149ce0188a6dcf049844e8b0cdd912e01cbcfb63553157d2508958` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v4.6/flownet.bin` | 10.12 MB | `f334ed2260149ce0188a6dcf049844e8b0cdd912e01cbcfb63553157d2508958` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v4.6/flownet.bin` | 10.12 MB | `f334ed2260149ce0188a6dcf049844e8b0cdd912e01cbcfb63553157d2508958` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v4/flownet.bin` | 9.86 MB | `f307230e32bffeaef5d27a1ea48ec4a67371f99e363ffde1f0f62016a1f725b4` |
| `ECCV2022-RIFE/dist/RIFE_Pro/rife-ncnn-vulkan-20221029-windows/rife-v4/flownet.bin` | 9.86 MB | `f307230e32bffeaef5d27a1ea48ec4a67371f99e363ffde1f0f62016a1f725b4` |
| `ECCV2022-RIFE/dist/RIFE_Pro/_internal/rife-ncnn-vulkan-20221029-windows/rife-v4/flownet.bin` | 9.86 MB | `f307230e32bffeaef5d27a1ea48ec4a67371f99e363ffde1f0f62016a1f725b4` |
| `ECCV2022-RIFE/rife-ncnn-vulkan-20221029-windows/rife-v4/flownet.bin` | 9.86 MB | `f307230e32bffeaef5d27a1ea48ec4a67371f99e363ffde1f0f62016a1f725b4` |
| `AI_Tools/rife-ncnn-vulkan-20221029-windows/rife-v3.0/flownet.bin` | 8.69 MB | `1df40d94d731f6c53e3cb8a8c818118202788d05a1b21ca921d840459f87b2a2` |

## 11. Extension statistics (top by size)

| Ext | Count | Size |
|---|---:|---:|
| `.dll` | 156 | 5.71 GB |
| `.exe` | 49 | 2.04 GB |
| `.bin` | 159 | 2.03 GB |
| `.sst` | 285 | 896.77 MB |
| `.asar` | 6 | 866.96 MB |
| `.node` | 28 | 808.16 MB |
| `.js` | 40,155 | 501.93 MB |
| `.map` | 19,439 | 365.54 MB |
| `.pak` | 232 | 215.06 MB |
| `.uff` | 4 | 196.76 MB |
| `.pth` | 38 | 189.51 MB |
| `.caffemodel` | 4 | 152.06 MB |
| `.onnx` | 2 | 97.77 MB |
| `.zip` | 7 | 88.29 MB |
| `.pyd` | 69 | 88.06 MB |
| `.html` | 136 | 81.18 MB |
| `.wts` | 3 | 63.47 MB |
| `.batch` | 50 | 51.50 MB |
| `.ts` | 9,492 | 51.20 MB |
| `.data-00000-of-00001` | 1 | 48.81 MB |
| `.json` | 4,233 | 45.07 MB |
| `.png` | 153 | 42.66 MB |
| `.dat` | 4 | 41.49 MB |
| `.md` | 3,245 | 28.89 MB |
| `.py` | 1,658 | 23.34 MB |
| `.pyc` | 1,506 | 17.68 MB |
| `.h` | 1,694 | 16.61 MB |
| `.mts` | 2,683 | 16.55 MB |
| `.mjs` | 9,119 | 14.09 MB |
| `.meta` | 387 | 14.08 MB |
| `.woff2` | 348 | 14.05 MB |
| `.pdb` | 5 | 13.53 MB |
| `.pkl` | 2 | 11.62 MB |
| `.gz` | 3 | 11.03 MB |
| `.cjs` | 1,054 | 10.68 MB |
| `.xml` | 21 | 9.32 MB |
| `.mp4` | 10 | 7.81 MB |
| `.pdf` | 6 | 4.99 MB |
| `.qm` | 75 | 4.90 MB |
| `(noext)` | 2,342 | 4.38 MB |

## 12. Phase-1 conclusions

1. Working tree is large (~15 GB excl. `.git`); majority is `AI_Tools` + regenerable `web-ui` build/deps + RIFE toolchain/models.
2. Current `.gitignore` keeps the GitHub repo lean but **omits runtime-critical models/binaries** needed for full restore.
3. Git LFS **is installed** locally (`git-lfs/3.7.1`) but **not yet configured** with meaningful track rules in `.gitattributes` (no LFS files listed).
4. **No deletion performed.** Next steps (after your confirmation): finalize A/B/C, configure LFS track patterns, write `archive-manifest.txt`, then prepare `git add` — still no push until you approve.

5. Sensitive-scan: only `web-ui/.env.example` + one false-positive `hasApiKey` identifier — **no live secrets blocking archive** (see §6).

---

**Stopped after inventory generation. Awaiting confirmation before commit/LFS config/push.**

