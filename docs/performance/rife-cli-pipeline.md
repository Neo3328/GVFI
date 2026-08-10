# RIFE CLI Pipeline Scheduling

## Why B2 uses CLI scheduling

GVFI production interpolation uses the bundled `rife-ncnn-vulkan.exe` with the
`rife-v4.6` ncnn model. The executable accepts jpg/png/webp file paths or image
directories; it has no stdin, raw-frame, shared-memory, or reusable server API.
It is statically packaged and does not expose `RIFE::process` as a DLL function.

The repository's `train_log/flownet.pkl` is a different PyTorch checkpoint and
cannot replace the production ncnn `flownet.param/bin`. A true memory adapter
would require a separately built ncnn/Vulkan bridge with the upstream custom
`rife.Warp` layer. That is deliberately outside B2-R: no model, ncnn, Vulkan SDK,
or RIFE executable changes are made here.

## Previous scheduling

Without scene cuts, one video invokes RIFE once. With scene detection enabled,
every multi-frame scene that needs interpolation invokes RIFE independently:

```text
copy scene PNGs -> start RIFE/load model -> write scene PNGs
                -> copy outputs into final frame directory
```

Consequently, process count and model load count are both one for an unsegmented
clip, or one per interpolated scene for a segmented clip. Merging hard-cut scenes
into a single directory would reduce starts, but RIFE would interpolate across
scene boundaries and change output. B2-R keeps those correctness boundaries.

## Optimized scheduling

The scene scheduler now:

1. stages scene inputs with same-volume hard links instead of copying PNG bytes;
2. falls back to `copy2` if hard links are unavailable;
3. moves RIFE outputs into the final numbered sequence instead of copying them;
4. uses hard links for deduplicated input frames where possible;
5. enumerates the active PNG sequence once instead of rescanning it per scene;
6. runs an unsegmented clip in one RIFE process as before;
7. retains one process per interpolated scene when hard-cut isolation is required.

The PNG and RIFE CLI fallback remain intact. No encoder path is changed.

## Metrics

Each RIFE invocation logs input/target frame counts, time until the first output
PNG, and time from first output until process completion. The stage summary is:

```text
RIFE PIPELINE:
process_count=3
model_load_count=3
total_frames=48
average_frames_per_process=16.00
startup_time=...
inference_time=...
io_time=...
gpu_usage=...%
```

`startup_time` is an observable CLI cold-start proxy: process launch until the
first output PNG appears. `inference_time` is the remaining process lifetime.
The executable does not expose internal decode/inference/encode timers, so these
two values are not pure model timings. `io_time` covers GVFI-side dedup, staging,
and output collection; PNG I/O internal to the CLI is included in process time.
GPU usage is the arithmetic mean of available `nvidia-smi` samples and reports
`0.0%` when NVIDIA sampling is unavailable.

## Fixed 1080p/24fps comparison

Hardware: NVIDIA GeForce RTX 5060 Laptop GPU, 8 GB. Test clip: synthetic
1920x1080, 24fps, 1 second, three hard-cut scenes of eight frames each. Both
runs used `rife-v4.6`, GPU 0, `-j 2:4:4`, three scene-isolated CLI processes,
and a target of 48 PNG frames. Encoding was not run.

| Metric | Before: copy/copy | After: link/move |
| --- | ---: | ---: |
| RIFE process/model loads | 3 | 3 |
| Output frames | 48 | 48 |
| Scheduler wall time | 4.494s | 3.962s |
| RIFE subprocess time | 4.453s | 3.934s |
| GVFI staging/collection I/O | 0.040s | 0.027s |
| Average sampled GPU utilization | 25.4% | 24.2% |
| Peak sampled GPU utilization | 94% | 99% |
| All output SHA-256 values | baseline | identical |

This short test shows lower filesystem scheduling overhead and identical output.
Average GPU utilization is effectively inconclusive because process cold starts
dominate a one-second, three-scene clip. Process count cannot safely fall below
the number of interpolated scenes until RIFE gains an API that represents scene
boundaries inside one persistent process.
