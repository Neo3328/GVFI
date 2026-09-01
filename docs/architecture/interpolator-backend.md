# Interpolator Backend Architecture

## Current CLI architecture

GVFI production interpolation uses `rife-ncnn-vulkan.exe` and the selected ncnn
model directory, normally `rife-v4.6`. The scene scheduler passes isolated PNG
directories to the executable and collects its PNG output:

```text
VideoWorker -> SceneTaskQueue -> RIFE CLI command -> PNG output
```

The executable owns Vulkan initialization, model loading, image decoding, and
image encoding for each process. It has no persistent server or memory-buffer
API. The PNG path remains the production fallback and is not removed in C0.

## Backend abstraction

`InterpolatorBackend` defines the backend-neutral lifecycle:

```text
initialize()
load_model(model_path)
process_frames(Frame, Frame, timestamp) -> Frame
release()
```

The core contract uses the existing in-memory `Frame` type. It does not contain
PNG paths, CLI commands, or ncnn-specific values. This keeps decoder, scheduler,
and future encoder integration independent of the inference implementation.

`RifeCLIBackend` implements the same lifecycle and provides a compatibility-only
`process_directory()` extension. That extension owns construction of the current
`rife-ncnn-vulkan.exe` command. Calling its memory `process_frames()` method raises
a capability error rather than silently writing temporary PNG files.

The production call chain is now:

```text
VideoWorker
  -> InterpolatorBackend lifecycle
  -> RifeCLIBackend.process_directory()
  -> rife-ncnn-vulkan.exe
```

The command arguments, model, GPU selection, thread configuration, scene
boundaries, monitoring, and output validation remain unchanged.

## Configuration

The internal `backend_mode` setting supports:

- `cli`: default and current production implementation;
- `native`: lifecycle placeholder for Phase C, with no inference implementation.

Invalid API values normalize to `cli`. Task startup logs include:

```text
BACKEND CONFIG:
backend=cli
model=rife-v4.6
```

Native mode can be constructed, initialized, assigned a model identifier, and
released. Any attempt to process frames fails explicitly. It is not a production
fallback and does not pretend to execute native inference.

## C0 verification

The Phase C0 verification used the existing `rife-v4.6` CLI executable and a
fixed 1080p, 24 fps, 24-frame input sequence. The direct legacy command and the
`RifeCLIBackend` command each produced 48 frames, and every corresponding output
file had the same SHA-256 digest. The measured CLI execution times were 1.881 s
for the direct path and 1.642 s through the backend wrapper; this small difference
is normal process/cache variance and confirms that the wrapper adds no new image
processing stage.

The runtime test suite passes 21 tests, including four backend-specific tests for
the exact CLI command contract, explicit memory-frame capability failure, native
lifecycle initialization, and invalid-mode rejection. A `VideoWorker` integration
check also completed the same 24-to-48-frame CLI task through the backend.

## Native backend plan

The future native implementation should replace the backend consumer without
changing `Frame`, `SceneTask`, compatibility grouping, or CLI fallback:

1. implement a stable native C ABI around a persistent RIFE/ncnn runtime;
2. load one model per `(model, gpu, resolution capability)` worker group;
3. convert `Frame.frame_data` and pixel format at the backend boundary;
4. process each scene independently and return ordered `Frame` objects;
5. validate frame hashes/color/timestamps against CLI output;
6. retain `RifeCLIBackend` until parity, cancellation, and resource-release tests pass.

C0 does not add a C++ build system, modify ncnn, change models, or modify GUI and
encoding behavior.
