# GVFI Native C ABI Skeleton

## Purpose and scope

Phase C2 validates the smallest complete native-backend path:

```text
NativeInterpolatorBackend
  -> NativeLibraryLoader (ctypes)
  -> stable C ABI
  -> gvfi_native.dll lifecycle instance
```

The DLL does not load RIFE models, ncnn, Vulkan, CUDA, or TensorRT. Its process
entry point deliberately returns `NOT_IMPLEMENTED`. The existing CLI backend and
default `backend_mode=cli` path are unchanged.

## Project layout

The repository already contained a dependency-free `native/` runtime with
WorkLoop, memory-pressure, and allocation APIs. The interpolation skeleton is
added to the same `gvfi_native` shared-library target so there is one DLL and no
duplicate `gvfi_version` symbol:

```text
native/
  CMakeLists.txt
  include/
    gvfi_native.h
    gvfi/                 existing runtime headers
  src/
    gvfi_native.cpp
    gvfi_capi.cpp         existing runtime ABI
  tests/
    test_native_cabi.cpp
```

`add_library(gvfi_native SHARED ...)` generates `gvfi_native.dll` and the linker
import library on Windows. There are no third-party link dependencies. The
existing Zig fallback build also emits `build/gvfi_native.lib` explicitly.

## Stable C ABI

The public header exports C symbols under `extern "C"`; it does not expose C++
classes, STL types, exceptions, ncnn objects, or Vulkan handles.

| Function | Contract in C2 |
| --- | --- |
| `gvfi_version()` | Returns the static ASCII version `gvfi_native/0.2.0`. |
| `gvfi_create(out_handle)` | Allocates an opaque instance and writes its handle. |
| `gvfi_initialize(handle)` | Marks the instance initialized; repeated calls succeed. |
| `gvfi_process(handle, frame0, frame1, timestamp, output)` | Validates arguments and returns `NOT_IMPLEMENTED` after initialization. |
| `gvfi_destroy(handle)` | Destroys the opaque instance. |

All operational functions return one of these stable numeric results:

| C value | Numeric value | Meaning |
| --- | ---: | --- |
| `GVFI_SUCCESS` | 0 | Operation completed. |
| `GVFI_FAILED` | 1 | Valid request could not be completed. |
| `GVFI_NOT_IMPLEMENTED` | 2 | ABI exists but inference is intentionally absent. |
| `GVFI_INVALID_ARGUMENT` | 3 | A required pointer, frame field, or timestamp is invalid. |

`gvfi_frame_t` reserves the CPU-memory boundary needed by a later PoC: data
pointer, byte size, width, height, row stride, pixel format, frame index, and
timestamp. The output descriptor is caller-owned. C2 never writes output data.

## Python loading flow

`gvfi_runtime.native_library.NativeLibraryLoader` owns DLL binding and one opaque
handle. It:

1. resolves an explicit DLL or the packaged/source build candidates;
2. binds every argument and return type with `ctypes`;
3. calls `gvfi_version()` and rejects an unexpected version family;
4. calls create, initialize, process, and destroy with status checking;
5. converts supported packed `Frame` buffers to temporary C descriptors.

`NativeInterpolatorBackend.initialize()` now loads the library and creates and
initializes its handle. `process_frames()` calls the C skeleton and maps
`GVFI_NOT_IMPLEMENTED` to `BackendNotImplementedError`. `release()` destroys the
handle and is idempotent at the Python ownership layer.

The loader currently supports packed `rgb24`, `bgr24`, `rgba/rgba32`, and
`bgra/bgra32` CPU frames. It makes a temporary copy to establish clear ownership;
zero-copy and GPU memory are intentionally deferred.

## Build

With a standard Windows C++ toolchain:

```powershell
cmake -S native -B native/build -A x64
cmake --build native/build --config Release
ctest --test-dir native/build -C Release --output-on-failure
```

The existing `native/build.cmd` selects Ninja, MinGW, or Visual Studio. On the C1
audit machine, MSVC is absent but the already-installed Zig toolchain can verify
the same DLL sources without installing anything:

```powershell
native\build_with_zig.cmd
```

Build products under `native/build/`, including the import library, are ignored.
The verified runtime DLL is copied to
`ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll`. The PyInstaller build
includes this DLL conditionally when present.

## C2 verification

The Windows Zig C++ build completed with no third-party inference dependencies.
It produced both `gvfi_native.dll` and `gvfi_native.lib` and passed:

- four native tests: WorkLoop, zone pool, memory pressure, and interpolation C ABI;
- the legacy Python native-bridge tests;
- direct Python loader lifecycle and invalid-argument tests;
- the full GVFI runtime test suite.

The C ABI test verifies version, create, initialization, pre-initialize failure,
`NOT_IMPLEMENTED`, invalid arguments, and destroy. The backend test verifies DLL
handle creation, error mapping, and normal/idempotent Python release.

## Later ncnn Vulkan integration

A later phase may replace only the body behind this ABI:

1. extend instance state with a persistent ncnn/Vulkan context;
2. add an explicit model-loading C function without changing existing symbols;
3. upload the described CPU frames and preserve scene boundaries;
4. write into caller-owned output storage with a documented size negotiation;
5. add ABI-size/version fields before extending public structs;
6. validate pixels, color order, resource release, cancellation, and device loss;
7. keep `RifeCLIBackend` as fallback until native parity is proven.

C2 does none of these inference tasks.
