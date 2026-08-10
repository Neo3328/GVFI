# Frame Pipeline Architecture

## Current disk pipeline

The stable pipeline remains unchanged and is selected by `pipeline_mode=disk`:

```text
FFmpeg decode -> PNG files -> Python/SVFI preprocessing -> RIFE -> PNG files
              -> optional Real-ESRGAN -> PNG files -> FFmpeg encode
```

This path is still the default. Phase B1 does not change RIFE, models, encoding,
or GUI behavior.

## Memory pipeline foundation

Phase B1 introduces a `Frame` value and two bounded, thread-safe `FrameQueue`
instances:

```text
FFmpeg rawvideo decoder
        |
        v
Input FrameQueue -> pass-through Processor worker(s) -> Output FrameQueue
                                                        |
                                                        v
                                                   release sink
```

`Frame` owns in-memory `frame_data` plus width, height, pixel format, frame index,
and timestamp metadata. It never represents a PNG path. Both queues support
blocking producers/consumers, size limits, and cooperative shutdown. Closing a
queue rejects new writes while allowing already queued frames to be drained.

The experimental `pipeline_mode=memory` currently decodes FFmpeg `rgb24`
rawvideo, passes frames through both queues, consumes them, and releases the last
reference. It intentionally does not call RIFE or encode an output video.

## Motivation

PNG intermediates add disk I/O, PNG encode/decode CPU cost, and gaps between GPU
batches. Passing owned frame buffers through bounded queues provides backpressure
and prepares decoder, processing, and encoder stages to overlap without unbounded
memory growth.

## Migration plan

1. B1: validate queue behavior and memory-only decode/consume lifecycle.
2. Add pixel-format conversion and explicit buffer ownership/pooling.
3. Connect a RIFE adapter to input/output `Frame` values while retaining disk fallback.
4. Connect the existing encoder to output frames and validate audio/timestamps.
5. Compare quality, color, cancellation, memory, and throughput against disk mode.
6. Change defaults only after parity and rollback criteria are satisfied.

## Configuration and logging

Internal job settings accept `pipeline_mode` (`disk` or `memory`), `queue_size`,
and `worker_count`. Invalid modes fall back to `disk`. Job startup logs include:

```text
PIPELINE CONFIG:
mode=disk
queue_size=32
worker_count=1
```
