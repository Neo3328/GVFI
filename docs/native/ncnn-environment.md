# ncnn Vulkan Environment Audit

## C3 dependency gate

Phase C3 requires a native C++ compiler, CMake, a Vulkan development SDK, and a
Vulkan-enabled ncnn development package. A Vulkan display/compute driver alone
is sufficient to run `rife-ncnn-vulkan.exe`, but it does not provide headers,
import libraries, shader tools, or ncnn CMake targets needed to build the native
prototype.

No dependency was installed or downloaded during this phase. No ncnn source or
binary is committed under `native/third_party/`.

## Read-only audit result

The environment was checked on 2026-08-10:

| Requirement | Result |
| --- | --- |
| CMake | 4.4.2 |
| Git | 2.55.0.windows.3 |
| Ninja | Present on `PATH` |
| MSVC `cl.exe` / Visual Studio Build Tools | Not detected |
| CMake-recognized C++ compiler | Not detected |
| Vulkan runtime | 1.4.341 |
| `vulkaninfo` | Present |
| Vulkan SDK / `VULKAN_SDK` | Not detected |
| `glslc` | Not detected |
| ncnn source or `ncnnConfig.cmake` | Not detected |
| CUDA Toolkit / `nvcc` | Not detected; not required |

Runtime device discovery reported:

| Device | Vulkan API | Driver |
| --- | --- | --- |
| NVIDIA GeForce RTX 5060 Laptop GPU | 1.4.341 | NVIDIA 610.88 |
| Secondary Vulkan device | 1.4.303 | Present in `vulkaninfo` output |

This proves the Vulkan loader and GPU driver are functional. It does not prove
that ncnn can be built, initialized, or dispatched from `gvfi_native.dll`.

## Required setup for the enabled prototype

The optional build expects externally managed dependencies:

1. install Visual Studio Build Tools with Desktop development with C++ and a
   compatible Windows SDK;
2. install the LunarG Vulkan SDK and verify `VULKAN_SDK`, `glslc`, headers, and
   loader import libraries;
3. build or install ncnn with `NCNN_VULKAN=ON` for the same x64 compiler/runtime;
4. set `ncnn_DIR` to the directory containing `ncnnConfig.cmake`;
5. configure GVFI with `-DENABLE_NCNN_BACKEND=ON`.

Example configuration after those prerequisites exist:

```powershell
cmake -S native -B native/build-ncnn -A x64 `
  -DENABLE_NCNN_BACKEND=ON `
  -Dncnn_DIR=C:\path\to\ncnn\lib\cmake\ncnn
cmake --build native/build-ncnn --config Release
```

## Gate outcome

The dependency-free `ENABLE_NCNN_BACKEND=OFF` build compiles and passes all C++
and Python tests. An ON configuration was attempted, but CMake stopped at the
missing supported C++ compiler before it could evaluate `find_package(Vulkan)`
or `find_package(ncnn)`. Independent filesystem and command checks also confirm
that the Vulkan SDK, `glslc`, and ncnn development package are absent.

Therefore the following C3 claims are **not verified on this machine**:

- ncnn library initialization;
- Vulkan device discovery through ncnn;
- ncnn model loading;
- extractor creation in a built ncnn target;
- GPU command dispatch and inference;
- runtime ncnn version and GPU name returned through the new ABI.

These remain explicit prerequisites for the next verification run. The checked-in
prototype is compile-gated and cannot silently report ncnn availability when it
was built without ncnn.
