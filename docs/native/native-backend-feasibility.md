# Native Interpolation Backend Feasibility

## Scope and conclusion

Phase C1 evaluates whether GVFI can eventually replace the per-task
`rife-ncnn-vulkan.exe` process with a resident backend. It does not implement
inference or change the production CLI path.

The replacement is technically feasible, but it is not a wrapper around the
existing executable. It requires building and owning an in-process RIFE/ncnn
runtime, its Vulkan resources, model lifetime, frame conversion, and a stable
foreign-function boundary. The recommended proof of concept is a small Windows
DLL with a C ABI. `RifeCLIBackend` must remain the production fallback until
pixel parity, lifecycle, cancellation, and resource tests pass.

## Evidence reviewed

The project ships the official `rife-ncnn-vulkan-20221029-windows` portable
release, not its C++ source tree. Its bundled README identifies:

- `nihui/rife-ncnn-vulkan` as the upstream project;
- Tencent ncnn as the neural-network inference framework;
- Vulkan SDK, Git submodules, and CMake as source-build requirements;
- image paths or image directories as the public CLI input/output contract;
- load, process, and save threads as image decode, inference, and image encode;
- ncnn, WebP, stb, and dirent as upstream components.

The local `rife-v4.6` model contains `flownet.param` and `flownet.bin`. The param
file is an ncnn graph with three inputs and operators such as convolution,
interpolation, concatenation, and binary operations. No model conversion or
model-file modification is needed for a compatible ncnn implementation.

An online source checkout was attempted on 2026-08-10 but GitHub was unreachable
from this environment. Therefore this document does not claim an unverified
upstream commit or exact source-file inventory. Before a PoC, the source and all
submodules must be pinned, license notices retained, and its build reproduced
unchanged once in a network-enabled environment.

## Current CLI limits

The executable owns image decoding, Vulkan instance/device and command resources,
ncnn network loading, inference, and image encoding. Python can configure only
paths and command-line options. A process exit releases all model and GPU state.
Consequently GVFI cannot reuse Vulkan/model state between launches or pass a
`Frame` buffer directly, and it pays PNG and process startup costs.

The C0 abstraction preserves this behavior:

```text
VideoWorker -> InterpolatorBackend -> RifeCLIBackend
            -> rife-ncnn-vulkan.exe -> PNG directory
```

## Native alternatives

| Option | Lifetime and frame path | Assessment |
| --- | --- | --- |
| Windows DLL with C ABI | In-process resident context; pointer/stride input | Recommended PoC. Stable ABI and explicit ownership, but crashes affect GVFI. |
| Python extension (for example pybind11) | In-process resident context; buffer protocol | Convenient binding, but coupled to Python/PyInstaller ABI and packaging. |
| Resident helper process with IPC/shared memory | Persistent model; shared-memory frames | Better fault isolation, but it remains a process protocol and adds synchronization. |
| Keep invoking the CLI | Process and PNG directory per invocation | Proven fallback; cannot provide resident inference. |

The PoC should expose only lifecycle and CPU-memory frame transfer first. Direct
cross-runtime Vulkan-memory sharing is a later optimization and should not be a
C1/C2 prerequisite.

## Required native components

1. **ncnn:** network graph/weight loading, Vulkan compute pipelines, allocators,
   tensor packing, and command submission.
2. **Vulkan runtime and SDK:** the GPU driver is enough to run the current binary;
   headers, loader import libraries, validation tools, and shader compiler are
   additionally needed to build and diagnose a native backend.
3. **Shader build path:** upstream/custom compute shaders and ncnn-generated
   shaders must be compiled and packaged exactly as the pinned source expects.
   Shader sources and generated headers must be treated as code, not model data.
4. **Model loader:** load the existing ncnn `.param` and `.bin` files, validate
   expected blobs/operators, and keep the loaded network resident.
5. **RIFE pipeline:** input normalization and packing, padding/alignment, timestep
   handling, flow/warp execution, output conversion, and synchronization.
6. **C++ API boundary:** opaque context handle, explicit error codes, immutable
   model/device configuration, frame pointer/size/stride/format metadata, and an
   idempotent release operation.

CUDA and TensorRT are not dependencies of the current ncnn Vulkan architecture.
They should not be introduced merely because an NVIDIA GPU is present.

## Proposed PoC boundary

The future DLL ABI should be versioned and avoid exposing C++ STL or ncnn/Vulkan
types. A conceptual boundary is:

```text
create(device_id) -> opaque context
load_model(context, model_directory)
process(context, frame0, frame1, timestep, output)
release(context)
```

`process` must receive width, height, pixel format, byte size, and row stride for
every buffer. The first PoC may copy CPU buffers into ncnn Vulkan allocators. This
still removes PNG and CLI startup while keeping memory ownership testable.

Target data flow:

```text
Frame (CPU bytes + metadata)
  -> NativeInterpolatorBackend
  -> C ABI / resident native context
  -> ncnn Vulkan upload and GPU tensors
  -> RIFE inference
  -> GPU readback
  -> output Frame
```

No frame pair may cross a scene boundary. The scheduler remains responsible for
ordering and scene isolation; the backend owns only inference and resources.

## Windows build requirements

The minimum reproducible build environment should contain:

- Visual Studio Build Tools with Desktop development with C++ and a supported
  Windows SDK;
- CMake and either MSBuild or Ninja;
- LunarG Vulkan SDK, including headers, loader libraries, `glslc`, and validation
  layers;
- Git with recursive submodule support;
- a pinned ncnn/upstream source tree and the current model assets;
- a 64-bit Release build matching the Python application architecture.

Static versus dynamic CRT, OpenMP, Vulkan loader, and ncnn linkage must be chosen
explicitly. The current portable release contains `vcomp140.dll`, which is useful
packaging evidence but is not itself a complete build environment.

## Local environment audit

Read-only checks on 2026-08-10 produced:

| Component | Detected state |
| --- | --- |
| OS shell | 64-bit Windows / PowerShell environment |
| Git | 2.55.0.windows.3 |
| CMake | 4.4.2 |
| Ninja | Present on `PATH` |
| Visual Studio Build Tools / `cl.exe` | Not detected; `vswhere` absent |
| Vulkan runtime | 1.4.341; `vulkaninfo` present |
| GPU / driver | NVIDIA GeForce RTX 5060 Laptop GPU / 610.88 |
| Vulkan SDK / `glslc` | Not detected |
| ncnn development tree/package | Not detected |
| CUDA Toolkit / `nvcc` | Not detected |
| TensorRT | Not detected |

Visual Studio Tools for Applications 2019 is installed, but it is not the MSVC
C++ Build Tools toolchain. The machine can run Vulkan workloads but cannot yet
build the proposed backend. C1 installs nothing.

## Interface readiness

`NativeInterpolatorBackend` already implements the complete abstract lifecycle:

```text
initialize() -> load_model() -> process_frames() -> release()
```

It can initialize, remember a model identifier, and release idempotently.
`process_frames()` deliberately raises `BackendNotImplementedError`, which is
both a backend capability error and a standard `NotImplementedError`. It performs
no image conversion, disk I/O, CLI launch, model loading, or inference.

## Risks and decision gates

- **Numerical and color parity:** RGB/BGR order, normalization, padding, fp16,
  tensor packing, and output quantization can change hashes or visible output.
- **Model/version coupling:** `rife-v4.6` graph names and pipeline logic may not
  match other bundled model generations.
- **GPU lifetime:** allocator reuse, command completion, device loss, cancellation,
  and release order must be correct during repeated jobs.
- **Thread safety:** a native context should initially serialize inference; shared
  contexts across worker threads require explicit proof.
- **ABI and packaging:** compiler runtime, architecture, PyInstaller discovery,
  DLL dependencies, and licenses must be reproducible on a clean machine.
- **Crash containment:** an in-process access violation terminates the application;
  a helper-process design remains the fallback if stability is inadequate.
- **Upstream maintenance:** pin source/submodules and record local patches so the
  binary is auditable and rebuildable.

Proceed beyond feasibility only after these gates pass: reproduce the official
CLI from pinned source, load `rife-v4.6` once in a minimal native harness, process
one fixed frame pair from memory, release cleanly under repeated runs, and compare
dimensions, format, pixels, GPU memory, and timing against `RifeCLIBackend`.

## C1 verification plan

- Run the full existing runtime suite to ensure CLI behavior is unchanged.
- Verify the CLI command contract test remains byte-for-byte equivalent.
- Verify native initialize/load-model/not-implemented/release state transitions.
- Confirm no production caller, GUI file, model, executable, or C++ build system
  is changed by the C1 commit.
