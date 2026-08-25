# Frame Pipeline Governance

## Scope

Phase D4 hardens the existing bounded in-memory pipeline foundation. Disk mode
remains the production default and is unchanged. Memory mode remains an explicit
decode/queue/consume validation mode; it does not claim to produce an encoded video.

## Queue contract

`FrameQueue` provides:

- bounded capacity and blocking `put` / `get`;
- timeout support;
- cooperative close with a sentinel wake-up;
- graceful drain or explicit discard;
- close reason and originating exception;
- safe wake-up for blocked producers and consumers.

Queue statistics include capacity, current and peak size, put/get counts, cumulative
wait time, timeout count, dropped frames, close reason, and error text.

## Failure propagation

The decoder, processors, and sink share one failure boundary. The first worker
failure stops both queues, terminates FFmpeg, wakes blocked threads, and raises a
`FramePipelineError` containing queue snapshots. Thread joins and FFmpeg shutdown
have bounded timeouts.

## Cancellation

An external stop event closes and drains the pipeline without deadlock. VideoWorker
checks cancellation again immediately after memory decode, so cancellation cannot be
reported as a successful validation task.

## Current limitation

The memory path currently validates:

`FFmpeg rawvideo -> input queue -> processor queue -> sink`

RIFE inference and FFmpeg encoding are intentionally not connected in this phase.
The completion message explicitly says that no output video was generated. Disk mode
remains the supported rendering fallback.
