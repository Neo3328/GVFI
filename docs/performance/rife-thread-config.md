# Perf: Tune rife-ncnn-vulkan thread configuration (P0-4)

## 1. Reason

`VideoWorker._run_rife` invoked `rife-ncnn-vulkan.exe` **without** `-j load:proc:save`.

Default ncnn load/proc/save threading left the GPU underfed (CPU-side pipeline starvation), so Vulkan inference throughput and GPU utilization stayed low.

Call site (only production path):

```
rife-ncnn-vulkan.exe
  -i <frames>
  -o <out>
  -n <target_frames>
  -m <model_dir>
  -f %08d.png
  [-g <gpu>]
  # before: no -j
```

## 2. Change

| Item | Detail |
|------|--------|
| Config key | `rife_thread_config` (API settings → worker params) |
| Default (≤1080p / typical HD) | `2:4:4` |
| Auto-lower (≥2160p / width≥3840) | `1:2:2` if configured profile is heavier |
| CLI | always pass `-j <resolved>` |
| Helpers | `normalize_rife_thread_config` / `resolve_rife_thread_config` in `tool_resolver.py` |

Not hard-wired only: callers may set `rife_thread_config`; invalid values fall back to the safe default, then UHD clamp still applies.

Job-start log:

```
RIFE CONFIG:
model=rife-v4.6
gpu=0
thread_config=2:4:4
```

### Files

- `ECCV2022-RIFE/tool_resolver.py`
- `ECCV2022-RIFE/main.py` (`_run_rife`, size probe, logs)
- `ECCV2022-RIFE/gvfi_api.py` (pass-through + log block)
- `docs/performance/rife-thread-config.md`

No RIFE model / inference algorithm / FFmpeg encode / GUI changes.

## 3. Parameter choice

| Profile | `-j` | When |
|---------|------|------|
| Default | `2:4:4` | Safe starting point for RTX-class GPUs on ~1080p |
| UHD guard | `1:2:2` | 2160p+ to avoid VRAM spikes from wider pipeline concurrency |

Explicit lighter configs (e.g. `1:1:1`) are kept even on UHD; only **heavier** profiles are auto-lowered.

## 4. Test results

Hardware: NVIDIA GeForce RTX 5060 Laptop GPU (8 GB).  
Clip: synthetic **1080p 24fps**, 1.0s → 24 PNG inputs → RIFE target **48** frames, model `rife-v4.6`, `-g 0`.  
Warmup run discarded; then before/after measured with `nvidia-smi` sampling (~200 ms).

| Metric | Before (no `-j`) | After (`-j 2:4:4`) |
|--------|------------------|--------------------|
| Wall time | **2.772 s** | **1.820 s** (~34% faster) |
| Peak GPU util | 57% | **97%** |
| Avg GPU util (sampled) | ~26% | ~43% |
| Peak VRAM | 4078 MiB | 4459 MiB (+~381 MiB) |
| Output frames | 48 | 48 |
| Mid-frame SHA256 | identical | identical |

Conclusions:

1. Output consistent (frame count + mid-frame hash match).
2. RIFE stage faster; GPU utilization higher during inference.
3. VRAM rose modestly; no abnormal explosion on 1080p with `2:4:4`.
