# RIFE Warp Analysis

Validation date: 2026-08-11

## Scope

This is a read-only analysis for Phase C4.5. No GVFI source, ncnn source,
model file, native backend, or production command was changed or rebuilt.

## Production binary and model

GVFI's runtime resolver uses `ECCV2022-RIFE` as its application base directory,
selects the `rife-ncnn-vulkan-20221029-windows` bundle, and prefers the model
directory named `rife-v4.6`.

| Item | Value |
| --- | --- |
| Executable | `D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-ncnn-vulkan.exe` |
| EXE size | 6,974,464 bytes |
| EXE SHA-256 | `4B970319DB2814C82B15FCEED8193151560A676A9EB63F20D4877BE77B98F44F` |
| File/Product version resource | Not present |
| Model directory | `D:\BaiduNetdiskDownload\GVFI\ECCV2022-RIFE\rife-ncnn-vulkan-20221029-windows\rife-v4.6` |
| `flownet.param` | 16,749 bytes; SHA-256 `28DF14D57A225725EE5386F52EBA422488450D37C9F40800ED4F62E8BA846692` |
| `flownet.bin` | 10,614,320 bytes; SHA-256 `F334ED2260149CE0188A6DCF049844E8B0CDD912E01CBCFB63553157D2508958` |

The same param/bin hashes were found in the other packaged copies, including
`AI_Tools` and the `dist` bundles. The bundle README is the official
`nihui/rife-ncnn-vulkan` README and links to the `20221029` release. The local
EXE directory also contains the release's `LICENSE`, `README.md`, model
directories, and `vcomp140.dll`.

Official release evidence:

- [20221029 release](https://github.com/nihui/rife-ncnn-vulkan/releases/tag/20221029)
- [Windows release asset](https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-windows.zip)

The local executable has no embedded file/product version metadata, so its
identity is established by the bundle layout, README, timestamp, and matching
release naming rather than an internal version resource.

## Source evidence for `rife.Warp`

The corresponding official source tag is `20221029`, commit
`a7532fc3f9f8f008cd6eecd6f2ffe2a9698e0cf7`.

- [Source tag](https://github.com/nihui/rife-ncnn-vulkan/tree/20221029)
- [RIFE implementation](https://github.com/nihui/rife-ncnn-vulkan/blob/20221029/src/rife.cpp)
- [Warp implementation](https://github.com/nihui/rife-ncnn-vulkan/blob/20221029/src/warp.cpp)
- [Warp declaration](https://github.com/nihui/rife-ncnn-vulkan/blob/20221029/src/rife_ops.h)

The source provides:

1. `class Warp : public ncnn::Layer` in `src/rife_ops.h`.
2. CPU `forward(const std::vector<ncnn::Mat>&, ...)` using clamped bilinear
   sampling of an image tensor by a two-channel flow tensor.
3. Vulkan `forward(const std::vector<ncnn::VkMat>&, ...)` using an ncnn
   `VkCompute` command and a pack-1/pack-4/pack-8 pipeline.
4. `create_pipeline()` and `destroy_pipeline()` that own those Vulkan pipelines.
5. `DEFINE_LAYER_CREATOR(Warp)` in `src/rife.cpp`.
6. Registration of the creator under the exact string `rife.Warp` for the
   flownet, contextnet, and fusionnet objects before loading their param files.

The model contains 8 `rife.Warp` declarations. This explains the C4.4 error:
plain `ncnn::Net` has no creator for that name, while the production program
registers one before calling `load_param()`.

## Shader and build mechanism

The upstream CMake file includes `warp.comp`, `warp_pack4.comp`, and
`warp_pack8.comp` in the shader generation target and compiles `warp.cpp` into
the executable. The generator strips the leading comment and stores the GLSL
source as a byte array header. `Warp::create_pipeline()` then calls ncnn's
`compile_spirv_module()` and creates Vulkan `Pipeline` objects at runtime.

Thus `rife.Warp` is both:

- an ncnn custom layer registered at the application level; and
- a custom Vulkan compute implementation, with a CPU fallback.

It is not a built-in ncnn layer, a model-side alias, or a separate DLL.

## ncnn comparison

| Aspect | Production release | GVFI dependency |
| --- | --- | --- |
| ncnn source pin | Submodule `src/ncnn` at `b4ba207c18d3103d6df890c0e3a97b469b196b26` (2022-07-28) | `305837fd4a722ebc47c5d72e72d8ec9ae970e932` (2025-05-03) |
| Vulkan | Enabled in the release build | `NCNN_VULKAN=ON`, validated on RTX 5060 Laptop GPU |
| Built-in layer registry | Does not contain `rife.Warp` | Does not contain `rife.Warp` |
| Custom registry | `register_custom_layer("rife.Warp", Warp_layer_creator)` | Available API, but no Warp creator registered |
| Warp CPU path | `ncnn::Layer` CPU forward | Absent |
| Warp Vulkan path | Three custom GLSL compute shaders and ncnn pipelines | Absent |
| Build structure | RIFE sources and ncnn submodule built together | Standalone ncnn package only |

The public ncnn API signatures needed by this layer (`register_custom_layer`,
`Layer::create_pipeline`, Vulkan `Layer::forward`, and
`compile_spirv_module`) are present in both source pins. That is an API
compatibility indication, not proof of binary or numerical compatibility.
The production executable cannot be relinked against the 2025 library without
a controlled source build and parity tests.

## What can and cannot be reused

Reusable source concepts, subject to license retention and porting:

- `Warp` declaration and CPU/Vulkan forward code;
- the three warp shader sources and their generated-header build step;
- the registration call before `load_param()`;
- the RIFE v4 pipeline's input/output blob contract in `rife.cpp`.

Not directly reusable as-is:

- the prebuilt executable as an in-process backend;
- its old ncnn submodule objects or ABI with ncnn 20250503;
- generated shader byte arrays without checking the target ncnn shader/compiler
  configuration and device capabilities;
- the model alone, because it still references the application-registered
  custom layer.

## Technical conclusion

`rife-ncnn-vulkan.exe` loads the model because it is a complete RIFE application
that registers and implements `rife.Warp` before parsing the graph. The failure
of a standalone ncnn 20250503 `Net` is therefore expected and is caused by a
missing custom-layer creator, not by a Vulkan initialization failure or a
corrupt RIFE model.

## Minimal next step (not executed)

The lowest-risk C4.6 PoC is an external compatibility target, outside GVFI,
that uses the pinned 2025 ncnn package, ports only the official `Warp` layer and
three shaders, registers `rife.Warp`, and then tests `flownet.param/bin`.
Only after that isolated target passes load and forward parity should any
Native Backend integration be considered. No such target was created in C4.5.
