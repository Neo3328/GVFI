# RIFE Scene Worker Manager

## Current problem

Scene detection produces two parallel lists in `VideoWorker`:

```text
segments = [(start_frame, end_frame), ...]
out_counts = [target_frame_count, ...]
```

B2-R executed each pair synchronously: stage the scene PNGs, start
`rife-ncnn-vulkan.exe`, wait, collect the output, then stage the next scene.
Each interpolated scene therefore starts a new process, initializes Vulkan, loads
the same model, processes one isolated directory, and exits.

Scene isolation is required. Putting adjacent scenes into one RIFE input sequence
would interpolate across the hard cut and create a boundary frame that does not
belong to either scene.

## Scheduler design

B3 converts each segment into an immutable `SceneTask` containing:

- ordered input frame paths;
- scene input, temporary output, and final output paths;
- final output start index and target frame count;
- model path, GPU index, and `(width, height)` resolution;
- whether the scene requires inference or is a pass-through scene.

`SceneTaskQueue` is a bounded FIFO queue. A staging producer prepares upcoming
scene directories while one consumer processes and collects the current task.
Queue size is two, limiting prepared work and temporary-file pressure. Output
indices are assigned before execution, and the consumer remains strictly FIFO,
so scheduling cannot reorder scenes or interpolate across boundaries.
The manager exposes a thread-safe state snapshot with `queued`, `staging`,
`staged`, `processing`, `completed`, and `failed` states for each scene index.

`RifeWorkerManager` groups consecutive tasks by this compatibility key:

```text
(model, gpu, resolution)
```

A compatibility change starts a new logical worker group. Compatible tasks share
one manager lifecycle and ordered queue today. This is the exact boundary where a
future persistent backend can reuse one loaded model without changing scene
detection, task construction, ordering, or output collection.

## Current CLI boundary

The bundled `rife-ncnn-vulkan.exe` has no persistent worker/server protocol. Its
inputs and outputs are image paths, and every invocation owns its Vulkan and model
lifecycle. B3 does not modify that executable, ncnn, or model files. Therefore:

- `worker_start` counts compatible manager worker groups;
- `scene_process_count` counts completed scene tasks, including pass-throughs;
- `model_reload_count` counts actual RIFE CLI invocations;
- `worker_idle_time` measures consumer time waiting for staged tasks;
- `scheduling_time` covers the complete manager run.

For compatible scenes, B3 can reduce logical manager starts and overlap staging,
but it cannot reduce actual CLI model reloads. Claiming otherwise would require a
persistent inference API, which belongs to Phase C.

Example log:

```text
RIFE WORKER:
worker_start=1
scene_count=3
model_reload_count=3
scene_process_count=3
compatibility_switch_count=0
worker_idle_time=0.001s
scheduling_time=3.700s
```

The existing `RIFE PIPELINE` block still reports subprocess and GPU metrics.

## Test result

Hardware: NVIDIA GeForce RTX 5060 Laptop GPU, 8 GB. Test clip: synthetic
1920x1080, 24fps, one second, three eight-frame hard-cut scenes. Both paths used
`rife-v4.6`, GPU 0, `-j 2:4:4`, targeted 48 PNG frames, and did not encode video.

| Metric | Before: serial B2-R | After: B3 manager |
| --- | ---: | ---: |
| Logical worker starts | 3 | 1 |
| RIFE CLI/model reloads | 3 | 3 |
| Output frames | 48 | 48 |
| Scheduler wall time | 3.654s | 3.700s |
| Average sampled GPU utilization | 22.9% | 32.6% |
| Peak sampled GPU utilization | 100% | 100% |
| All output SHA-256 values | baseline | identical |

The short test verifies order, boundaries, output identity, and the continuous
manager lifecycle. Wall time did not improve; the 46ms difference is noise at
this duration because hard-link staging is already much shorter than one model
load. The GPU average is also sampling-sensitive and is not treated as a proven
throughput gain.

## Upgrade direction

Phase C can replace only the task consumer with a persistent native inference
worker. It can keep the same queue and compatibility key, load once per worker
group, execute each scene independently, and reduce `model_reload_count` from the
number of interpolated scenes to the number of compatibility groups. The PNG CLI
consumer remains available as fallback until output parity is established.
