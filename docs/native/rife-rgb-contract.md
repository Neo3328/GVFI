# RIFE RGB8 Contract Validation

Validation date: 2026-08-11

This is an independent Phase C4.7 test. No GVFI production source, GUI,
RifeCLIBackend, NativeInterpolatorBackend, ncnn source, or model file was
modified. The test harness is outside the repository at
`D:\GVFI-deps\rife-rgb-test`.

## Compared implementations

| Item | Production CLI | Native PoC |
| --- | --- | --- |
| Executable | `...\rife-ncnn-vulkan-20221029-windows\rife-ncnn-vulkan.exe` | `D:\GVFI-deps\rife-rgb-test\build\rife_rgb_contract.exe` |
| RIFE application source | official commit `a7532fc3f9f8f008cd6eecd6f2ffe2a9698e0cf7` | same source, verified Git blob-for-blob for `rife.cpp`, `rife.h`, `rife_ops.h`, `warp.cpp`, and all used shaders |
| RIFE model | `rife-v4.6` | same files, read-only |
| ncnn | original bundled ncnn commit `b4ba207c18d3103d6df890c0e3a97b469b196b26` | 20250503, commit `305837fd4a722ebc47c5d72e72d8ec9ae970e932` |
| Vulkan | GPU compute, GPU 0 | GPU compute, GPU 0 |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU | NVIDIA GeForce RTX 5060 Laptop GPU |

The model files were unchanged:

- `flownet.param`: SHA-256 `28DF14D57A225725EE5386F52EBA422488450D37C9F40800ED4F62E8BA846692`
- `flownet.bin`: SHA-256 `F334ED2260149CE0188A6DCF049844E8B0CDD912E01CBCFB63553157D2508958`

## Production input/output contract

For the RGB8 inputs tested here, the official Windows path uses WIC to decode
24bpp BGR and passes an interleaved 3-byte `ncnn::Mat` to `RIFE::process`. The
PNG encoder consumes the same BGR interleaved representation.

For the v4.6 Vulkan path, the official source sets:

- `use_vulkan_compute = true`
- `use_fp16_packed = true`
- `use_fp16_storage = true`
- `use_fp16_arithmetic = false`
- `use_int8_storage = true`
- Windows preprocessor specialization `bgr = 1`

`rife_preproc.comp` reads the BGR bytes in reverse channel order into planar
model tensors and multiplies by `1/255`. There is no resize. Width and height
are padded independently to the next multiple of 32; pixels outside the source
rectangle are zero. The graph inputs are `in0`, `in1`, and `in2`; the output is
`out0`.

`rife_postproc.comp` writes only the original width and height. It multiplies
the model value by 255, adds 0.5 before conversion, floors, clamps to
`[0, 255]`, and writes interleaved BGR bytes. Thus odd dimensions are padded
internally and cropped back to their original dimensions.

At the image boundary, both input and output are pack-1 RGB pixels represented
as interleaved BGR8 bytes on Windows. The preprocessor produces three logical
planar channels in FP16 storage. Packing converters inside ncnn select pack-1,
pack-4, or pack-8 for compatible graph tensors; the official Warp layer
provides Vulkan shaders for all three pack widths. No wrapper-side packing is
forced, and `use_fp16_arithmetic=false` means FP16 storage/packing does not
enable general FP16 arithmetic.

## Deterministic inputs

The harness generates two RGB8 PNGs for every size. They contain fixed black,
white, red, green, blue, gray, horizontal/vertical gradients, and a 2-pixel
high-frequency checker/stripe pattern. No random values are used. The native
wrapper receives the exact corresponding BGR byte stream.

The production-source WIC probe confirmed that decoding the generated PNG is
byte-identical to the generated BGR stream (`256x256` check):

`FE62236CF530A1E89D6CF3B67096E5D7B4D1DC91B8DB3F80651E76EB6F42A7CA`

The WIC encode/decode round trip also had zero differing RGB pixels.

| Size | Input A PNG SHA-256 | Input B PNG SHA-256 |
| --- | --- | --- |
| 64x64 | `81288BB2B3D577052A38918EFB7F138BBD0FEA91D87F27A14CA15AEC1DCD4902` | `D56DB33657C1D5FE83E107C53AD30D4A3B8D9970FAAA7C1324AD12FFAA33BE00` |
| 65x65 | `5E8B2934A447165021155812FB23879DF4699C0367BABDED82FC023C7EA77B2A` | `826FB7E84F901E3E654D8DBC33E51DB5E55964DE10713851349A9E2C36C66638` |
| 128x128 | `04C6A6A9CC116A43EEBA5F55E38655F441AF094ACC88DBD3E7275011397F90EF` | `6D2464F9A969A14653C35EAAA9A83E1E8EFBF4DB7DB7868F6B4D4D50EA8B60F7` |
| 256x256 | `E47B9F30DBC11162C8C05B19594064AA150CF7D65ED30B548DDD5FDB46CFCB44` | `F7184144D2D3827FC1A133A389A08E5A67F57A0C27F75BD359B2B79BAFA5947C` |
| 1920x1080 | `6DC5710781D4B629556871A957741C1DB8E3D27A95D2CBEBF1BA6BE1C3730ED0` | `C98E33140898203E81B3E385A5C971CAACD8AB68AF8F430AA607052A98C7C32D` |

## CLI versus Native results

Each row used the same A/B pair and `timestep=0.5`. SHA-256 values below are
pixel-buffer hashes after decoding the output PNGs to RGB8; PNG file hashes
were also recorded in `D:\GVFI-deps\rife-rgb-test\contract-results.json`.

| Size | Native runs | MAE | MSE | PSNR (dB) | Max diff | CLI pixel SHA-256 | Native pixel SHA-256 |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 64x64 | 1 | 1.692627 | 14.511800 | 36.514 | 43 | `1C1F544329ACAA37CF7B46C8D8CEDA203DFC65C57A1AAB79DB0ACB01B09DB364` | `503EB2A7797C8056DF50B21D38DE3A9BBF3CB38535FFAE87874DCCA1B1EF8350` |
| 65x65 | 1 | 3.059882 | 62.874162 | 30.146 | 99 | `F4784D69F6BE8018BD7729C38B429F99D02D09AE3FC57645AC08C790BFA58085` | `38F1804EA80F23B189DC0204BDAC3B4771A8F854F0E3364759212C90F4B0C355` |
| 128x128 | 1 | 4.718709 | 98.913574 | 28.178 | 128 | `019B42259398DDCE3527D7B49B663363E419D8545F4F6504F86A36D5D39093B7` | `7E5C29E8A536496680D2050C2A02C4A8CB7357528B8E288225B8C4E6CEDC8ABF` |
| 256x256 | 20 | 7.594920 | 470.985433 | 21.401 | 254 | `8A1BAC5B29C7D96DF14CFCF60B3CDF25CC0DF63CEB2153F366CA5521720DF43F` | `FD680885DCDEC3934ACFC3D3976B3C2D926DAB2E06A7B8FED33FB899E2150E6E` |
| 1920x1080 | 20 | 1.537985 | 22.913614 | 34.530 | 229 | `B743A9C716747B46673BE79FA4F6FBE7211A489F81ED3824F2F5E11A01CB2B36` | `DA897495992AC7944CF4BFC7DF61B313BBC910956AE9F5515C2D7BB69C37774C` |

All Native outputs had shape `height x width x 3`, dtype `uint8`, range
`0..255`, and no non-finite values are possible after the specified uint8
postprocessing. The 65x65 output remained exactly 65x65, confirming the
32-alignment/pad-and-crop behavior.

The two implementations are deterministic independently: repeating the CLI
run produced identical pixels, and repeating the Native run produced identical
pixels. They are not bit-exact across implementations. This is expected and
explainable: application-level RIFE source, custom Warp source/shaders, model
bytes, input bytes, channel order, normalization, padding, crop, clamp, and
rounding are the same; the controlled remaining difference is the ncnn Vulkan
backend (`b4ba207c...` in the production executable versus ncnn 20250503 in
the PoC). The measured error is therefore a backend numerical compatibility
difference, not PNG or RGB/BGR conversion. This test does not claim that the
two ncnn versions are numerically identical or that the production executable
can be replaced without a compatibility policy.

## Native steady-state performance

The model is initialized once per process. The first call is reported
separately; it is excluded from the steady-state statistics.

| Size | First (ms) | Runs | Average (ms) | P50 (ms) | P95 (ms) | Fastest (ms) | Slowest (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 256x256 | 8.119 | 19 | 1.867 | 1.843 | 1.985 | 1.796 | 2.013 |
| 1920x1080 | 42.049 | 19 | 28.678 | 28.748 | 29.030 | 28.194 | 29.091 |

## Result

| Contract check | Result |
| --- | --- |
| Deterministic RGB8 inputs | PASS |
| Production WIC BGR decode reproduced | PASS |
| Native preprocessing and Vulkan RIFE v4.6 forward | PASS |
| Native RGB8 output shape/range | PASS |
| 64x64, 65x65, 128x128, 256x256, 1920x1080 | PASS |
| CLI comparison and metrics | PASS; non-bit-exact, backend difference explained above |
| 20-run steady-state measurement | PASS |

No production integration or Git commit was performed in this phase.
