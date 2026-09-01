# Scene Scheduling and Media Format Contract

## Scene safety

Scene tasks are validated before staging begins. The scheduler rejects:

- duplicate or out-of-order scene indices;
- empty input scenes;
- invalid target counts or resolutions;
- input/output directory reuse;
- overlapping or gapped output ranges targeting the same final directory.

Each scene retains an isolated input and output directory. Collection ranges are
contiguous, so no frame pair can cross a scene boundary. A processing failure marks
the active scene `failed` and every unfinished scene `cancelled`.

Model statistics now distinguish actual behavior:

- CLI: one model load for each RIFE process;
- Native: persistent model loading is counted when the DLL actually loads it;
- Native scene processing no longer increments `model_reload_count` per scene.

## Media inspection

VideoWorker logs a `MEDIA CONTRACT` JSON block before processing. It records codec,
dimensions, average/nominal FPS, VFR indication, pixel format, bit depth, color
metadata, rotation, audio stream count, alpha, and HDR indication.

## Tested matrix

| Input property | Result | Current policy |
|---|---|---|
| H.264 8-bit | PASS | Decoded through FFmpeg |
| H.265 10-bit | PASS detection | RGB8 PNG intermediate does not preserve 10-bit/HDR |
| AV1 | PASS | Decoded through FFmpeg |
| No audio | PASS | Silent output |
| Multiple audio streams | PASS detection | First audio stream only |
| Rotation metadata | PASS | FFmpeg autorotation during extraction |
| Odd 65x65 dimensions | PASS | Output padded to 66x66 for encoder compatibility |
| Alpha input | PASS detection | Alpha is not preserved |
| VFR | Contract test PASS | Normalized to configured constant output FPS |
| HDR transfer/primaries | Contract test PASS | Explicit warning; not preserved by RGB8 path |

## Output geometry

The encode filter always applies an even-dimension pad expression. It is a no-op for
normal even-sized input and adds at most one pixel to odd width or height. Existing
BT.709 full-RGB to limited-YUV conversion remains unchanged for SDR output. A final
`setparams` stage prevents PNG sRGB transfer metadata from overriding the intended
BT.709 frame metadata before encoding.

## Limits

This phase does not claim an HDR, 10-bit, alpha-preserving, VFR-preserving, or
multi-audio production pipeline. Those inputs are now detected and their lossy policy
is observable instead of silent.
