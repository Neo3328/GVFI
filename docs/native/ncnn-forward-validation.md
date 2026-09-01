# ncnn Vulkan Forward Validation

Validation date: 2026-08-11

## Runtime

| Item | Result |
| --- | --- |
| ncnn version | 20250503 |
| ncnn commit | `305837fd4a722ebc47c5d72e72d8ec9ae970e932` |
| Vulkan SDK | 1.4.357.0 (`D:\VulkanSDK\1.4.357.0`) |
| Vulkan device API | 1.4.341 |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU |
| Vulkan backend | ON, device index 0 |
| Installed package | `D:\GVFI-deps\ncnn-install` |
| Test project | `D:\GVFI-deps\ncnn-forward-test` |

## Model

The validation uses the official SqueezeNet v1.1 model bundled with the ncnn
20250503 full-source release. No model conversion or external model download was
performed.

| File | SHA-256 |
| --- | --- |
| `examples\squeezenet_v1.1.param` | `B72172FF40969198C0FB8170D9E3249461A2D70132AE3CC5E1D9EAA3EE54DF3D` |
| `examples\squeezenet_v1.1.bin` | `D0F7370AB3C163778C449A93B76799EA770E629B1B3C7AFDB3981C1CD1E20243` |

Input blob: `data`

Output blob: `prob`

Input shape: `227 x 227 x 3`

Output shape: `dims=1, w=1000, h=1, c=1` (1000 elements)

## Forward Results

The test creates an `ncnn::Net`, enables `use_vulkan_compute`, binds device 0,
loads the official param/bin pair, and performs ten extractor runs with the same
deterministic input tensor. Every output was non-empty, finite, and identical to
the first output.

| Measurement | Result |
| --- | ---: |
| Forward count | 10 |
| First forward | 103.240 ms |
| Average | 10.927 ms |
| Fastest | 0.599 ms |
| Slowest | 103.240 ms |

The first measurement includes initial Vulkan pipeline creation and shader
setup. Later runs reuse the initialized net and pipelines.

## Status

| Check | Result |
| --- | --- |
| ncnn initialization | PASS |
| Vulkan initialization | PASS |
| Model loading | PASS |
| Extractor input | PASS |
| GPU forward | PASS |
| Output validation | PASS |
| Repeated forward | PASS |
| Resource release | PASS |
| Process exit | PASS (code 0) |

Reliable GPU utilization telemetry was not collected. No utilization value is
reported.

This validation does not load RIFE, modify the GVFI native backend, or exercise
the video pipeline.
