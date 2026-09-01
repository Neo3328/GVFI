# Task Artifacts and Output Safety

## Output collision protection

VideoWorker no longer passes `-y` an existing final path. If
`video_enhanced.mp4` already exists, the worker selects
`video_enhanced_001.mp4`, then `_002`, and so on. Existing files are never
overwritten. The actual path is exposed through `worker.completed_outputs` and
the API job record uses that value instead of guessing a filename.

## Disk capacity gate

Before PNG extraction, FFprobe supplies frame count or duration/FPS fallback.
The worker estimates the raw, RIFE, and optional scaled SR workspaces, adds a 25%
margin, compares them with the temporary volume free space, and fails before large
disk writes when capacity is insufficient.

The estimate is deliberately conservative. It is not a promise of exact PNG size.

## Output validation

After encoding, FFprobe fully counts decodable frames and verifies:

- a non-empty video stream exists;
- decoded frame count matches the generated frame sequence;
- output dimensions match source/SR geometry plus the odd-dimension pad policy;
- output FPS matches the requested FPS;
- an audio stream exists when audio extraction succeeded.

Only validated files are appended to `completed_outputs`.
If validation fails after FFmpeg produced a file, it is atomically renamed with an
`.invalid` suffix. Diagnostic evidence is retained without presenting it as a usable
video.

## Persistent task report

Every task, including initialization failures, writes an atomic JSON report named
`gvfi-task-<task_id>.json` in the output directory. It contains:

- immutable runtime configuration;
- lifecycle and fallback state;
- input and actual output paths;
- disk estimates;
- output validation results;
- failure diagnostics.

The Web/API job record exposes `report_path`. API error logs continue to retain the
existing detailed failure stream.

## Existing application features retained

- cooperative task cancellation: Phase D2;
- queued API jobs: existing API queue;
- Native-to-CLI fallback: explicit and recorded;
- disk mode remains the production default.

## Deferred

Checkpoint/resume is not implemented. Correct resume requires durable stage manifests,
frame hashes, parameter compatibility checks, and atomic output promotion; filename
reuse alone would not be a safe resume mechanism.
