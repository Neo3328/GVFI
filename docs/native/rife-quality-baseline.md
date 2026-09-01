# RIFE Native Quality Baseline

Validation date: 2026-08-11

This Phase C4.8 baseline compares the production `rife-ncnn-vulkan.exe`
against the independent Native RIFE Vulkan PoC. No GVFI production source,
backend, GUI, ncnn source, RIFE model, or CLI file was modified. Test inputs,
outputs, logs, histograms, and visual differences are stored outside the
repository at `D:\GVFI-deps\rife-quality-benchmark`.

## Compared implementations

| Item | Production CLI | Native PoC |
| --- | --- | --- |
| Executable | `ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-ncnn-vulkan.exe` | `D:\GVFI-deps\rife-rgb-test\build\rife_rgb_contract.exe` |
| Executable SHA-256 | `4B970319DB2814C82B15FCEED8193151560A676A9EB63F20D4877BE77B98F44F` | Recorded by the external C4.7/C4.8 harness |
| RIFE application source | Official commit `a7532fc3f9f8f008cd6eecd6f2ffe2a9698e0cf7` | Same RIFE/Warp source and shaders |
| ncnn | Commit `b4ba207c18d3103d6df890c0e3a97b469b196b26` | 20250503, commit `305837fd4a722ebc47c5d72e72d8ec9ae970e932` |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU | NVIDIA GeForce RTX 5060 Laptop GPU |
| Vulkan device API | Vulkan compute | 1.4.341 |

The unchanged production model was used by both implementations:

- `flownet.param`: SHA-256 `28DF14D57A225725EE5386F52EBA422488450D37C9F40800ED4F62E8BA846692`
- `flownet.bin`: SHA-256 `F334ED2260149CE0188A6DCF049844E8B0CDD912E01CBCFB63553157D2508958`

Both paths used GPU 0, timestep 0.5, the C4.7 RGB8/BGR contract, 1/255
normalization, FP16 storage and packing, 32-pixel padding, original-size crop,
and RGB8 output conversion.

## Fixed input set

Five local sources were selected without downloading material. Each pair is
made from adjacent source frames, exported deterministically to lossless PNG,
and scaled to 640 pixels wide with Lanczos filtering. The fixed PNGs and their
full hashes are retained in `inputs/<case>`; source and output hashes are in
`benchmark-results.json`.

| Case | Coverage | Source frames | Output shape | Input A SHA-256 | Input B SHA-256 |
| --- | --- | ---: | --- | --- | --- |
| `anime_people` | animated faces, hair, hands, instruments, crowd motion | 300/301 | 640x400 RGB8 | `F85DA07C036EA5528369FA426D5EB8ECB3800E39E4BBBDF36C945ECCAAD68771` | `33242613EFA1D44F9FB671CF5B191A13AB7C719AFFD6A6E07FF521780B850126` |
| `fast_person` | live person, fast arms/hands, face, text watermark | 80/81 | 640x922 RGB8 | `AAB074075358A0B1F4A74EB37AF5CD0D06DC4A97F46DD6DCC69A4F7E3B16A5DB` | `C5BF055AEBEAA7CB1D0940125A5049348CFB5189997799F839428353F5B44DA1` |
| `feather_texture` | fine feather texture and high-contrast edges | 120/121 | 640x360 RGB8 | `9044A467F6F55073A0C6041FDE2C2E1FE94479089F6EE0694EEB473C978C5D59` | `3D207BAE861EA1401295435E77A4CFC9146999E46B141E3E2AEAE4BF15807A93` |
| `ordinary_room` | ordinary handheld indoor footage, foliage and paper edges | 12/13 | 640x480 RGB8 | `2B16FAE20D6611066F72C4E9E4109987FC20ECADBCD64A70CA7D8A5889233752` | `DA7D340F195D8D0CD240E6F3C79C44B66ECD54EFCBA87BFA14F765199B66CB82` |
| `text_contrast` | desktop capture, fine text, icons and high-contrast lines | 1000/1001 | 640x348 RGB8 | `27962CB5996F975C65A36C75285FFA53B82DD1C4C7497FA56A95FB33F1FB614A` | `1E53E1F8A121FE4930F8DC5A48B8B4456243087CC6BD34128D31D254B9927014` |

The source-file SHA-256 values, in the same order, are
`D4E33923EAA1F0A975C4F96C9FD457606F7C81A4E9CB52F4CE97BB8088310B2D`,
`9C5232D8927EA8E13CD652B43B0D617A752A07C7A18C48B6BBAACF96DCDF7878`,
`5FDE35F5A288CA86E216D2DC28188AB64B4560D3021F273FAEFDF0DE80F38AA5`,
`A8B35C2C2130453B9EA1172AD4AF68AC027BC2483EF0545769684722127BFE18`,
and `EF96027301645267EAFC4479E29A7CC9F7F21DB5B05A900A7FB07EC69F7ED6EB`.

## Numerical comparison

Metrics compare decoded RGB8 output pixels. SSIM uses an 11x11 Gaussian
window with sigma 1.5 and constants K1=0.01, K2=0.03. Histograms contain 256
bins per RGB channel; the table reports each channel's L1 histogram distance
normalized by pixel count. Full histograms are preserved in the external JSON.

| Case | MAE | MSE | PSNR (dB) | SSIM | Max abs diff | Histogram L1 R/G/B |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `anime_people` | 0.007714 | 0.007721 | 69.254 | 0.99995897 | 2 | 0.00299 / 0.00267 / 0.00266 |
| `fast_person` | 0.011317 | 0.011318 | 67.593 | 0.99988716 | 2 | 0.00213 / 0.00229 / 0.00192 |
| `feather_texture` | 0.025302 | 0.025302 | 64.099 | 0.99977755 | 1 | 0.00519 / 0.00562 / 0.00518 |
| `ordinary_room` | 0.020528 | 0.020528 | 65.007 | 0.99983288 | 1 | 0.00445 / 0.00392 / 0.00415 |
| `text_contrast` | 0.004632 | 0.004632 | 71.473 | 0.99999777 | 1 | 0.00235 / 0.00223 / 0.00227 |

Mean color and Rec.709 luminance are also nearly unchanged:

| Case | CLI mean RGB | Native mean RGB | CLI luminance | Native luminance |
| --- | --- | --- | ---: | ---: |
| `anime_people` | 98.5887 / 94.5873 / 88.0546 | 98.5897 / 94.5876 / 88.0547 | 94.96636 | 94.96679 |
| `fast_person` | 47.2363 / 43.5177 / 38.4464 | 47.2365 / 43.5180 / 38.4468 | 43.94214 | 43.94240 |
| `feather_texture` | 103.1090 / 101.6692 / 101.0908 | 103.1080 / 101.6689 / 101.0903 | 101.93356 | 101.93310 |
| `ordinary_room` | 151.8938 / 157.2219 / 153.7015 | 151.8934 / 157.2223 / 153.7018 | 155.83498 | 155.83523 |
| `text_contrast` | 101.6968 / 103.0386 / 115.6039 | 101.6969 / 103.0387 / 115.6041 | 103.66054 | 103.66068 |

Every output remained RGB8 with legal channel range. CLI and Native per-channel
minimum/maximum values matched for all five cases.

## Visual inspection

For every case the harness saved `cli.png`, `native.png`, the raw absolute
difference (`difference_abs.png`), an 8x amplified difference
(`difference_x8.png`), and a labeled three-panel `comparison.png`.

Inspection covered faces, hair, hands, fast-moving arms and body contours,
feather detail, foliage, paper edges, thin text, icons, and high-contrast lines.
No additional ghosting, double images, tearing, local blur, edge defect, or
color anomaly was visible in Native output relative to CLI. Even at 8x
amplification, differences are sparse 1-code-value changes, with isolated
2-code-value changes in the animated and fast-person cases.

Classification: **B - slight numerical differences, visually consistent**.

The outputs are not bit-exact. C4.7 already controlled the input reader,
RGB/BGR order, normalization, packing, padding, Warp source/shaders, model,
clamp, rounding, and output conversion. The controlled remaining difference is
the ncnn Vulkan implementation version: production commit `b4ba207c...` versus
Native ncnn 20250503 commit `305837fd...`. This baseline found no evidence of a
preprocessing, postprocessing, model, or application-level Warp regression.

## Native 1080p stability

The existing fixed 1920x1080 input pair was processed 100 times in one process
with one initialized model. The first call is reported separately and excluded
from steady-state percentiles.

| Measurement | Result |
| --- | ---: |
| Successful forwards | 100 |
| Failed forwards | 0 |
| Crashes | 0 |
| First forward | 86.972 ms |
| Steady-state samples | 99 |
| Average | 28.836 ms |
| P50 | 28.792 ms |
| P95 | 29.408 ms |
| P99 | 29.579 ms |
| Minimum | 27.935 ms |
| Maximum | 30.203 ms |
| Final RGB8 output range | 0..255 |
| NaN / Inf in RGB8 output | 0 / 0 |

The process completed normal model and Vulkan release. GPU utilization was not
recorded because no reliable synchronized utilization sampler was available;
no value was inferred or fabricated.

## Result

| Check | Result |
| --- | --- |
| Five fixed representative input pairs and SHA-256 records | PASS |
| Production CLI output | PASS |
| Native ncnn Vulkan output | PASS |
| MAE, MSE, PSNR and windowed SSIM | PASS |
| RGB histograms, means, luminance and ranges | PASS |
| Raw and amplified difference images | PASS |
| Visual artifact inspection | PASS; no Native regression observed |
| 100-run 1080p stability | PASS |

The external machine-readable record is
`D:\GVFI-deps\rife-quality-benchmark\benchmark-results.json`. No integration,
performance optimization, or Git commit was performed in this phase.
