# ncnn Vulkan Backend Prototype

## Scope

Phase C3 adds an optional ncnn Vulkan prototype behind `gvfi_native.dll`. It is
not a production RIFE implementation and is disabled by default:

```cmake
ENABLE_NCNN_BACKEND=OFF
```

The default DLL remains dependency-free. `RifeCLIBackend`, the PNG pipeline,
models, GUI, and production backend selection are unchanged.

## Architecture

```text
NativeInterpolatorBackend
  -> NativeLibraryLoader
  -> gvfi_native C ABI
  -> NativeInstance
  -> NcnnVulkanBackend              only when ENABLE_NCNN_BACKEND=ON
     -> ncnn::create_gpu_instance
     -> ncnn Vulkan device
     -> ncnn::Net
     -> load_param / load_model
     -> create_extractor
```

`NcnnVulkanBackend` uses a private implementation so ncnn types do not cross the
C ABI. It owns initialization state, selected device metadata, one `ncnn::Net`,
model-loaded state, and release. No ncnn or Vulkan headers are visible to Python.

## CMake integration

When enabled, CMake requires both packages and fails configuration if either is
missing:

```cmake
find_package(Vulkan REQUIRED)
find_package(ncnn CONFIG REQUIRED)
```

Only the enabled target compiles `src/ncnn_vulkan_backend.cpp`, defines
`GVFI_ENABLE_NCNN_BACKEND`, and links `ncnn` plus `Vulkan::Vulkan`. Dependencies
are not vendored; `native/third_party/README.md` documents the external package
contract. The existing Zig fallback intentionally builds the OFF configuration.

## Initialization and model flow

With ncnn enabled, `gvfi_initialize()`:

1. creates the process ncnn GPU instance;
2. checks that at least one Vulkan compute device exists;
3. selects device 0 for this prototype;
4. enables Vulkan compute on the `ncnn::Net`;
5. records GPU name, Vulkan API version, device index, and ncnn version when the
   build exposes it.

The new `gvfi_load_model(handle, param, bin)` loads an independent ncnn param/bin
pair and calls `Net::create_extractor()` once to validate the model-side object
chain. It does not accept a RIFE model directory, infer blob names, upload input,
or run extraction.

No simple standalone ncnn test model is present in this repository, and C3 is
forbidden from connecting the production RIFE assets. Consequently the current
machine can validate only the disabled ABI behavior. A later environment-enabled
verification must supply a small, redistributable test model with known input and
output blobs before claiming GPU inference.

## C ABI status reporting

The DLL ABI version is `gvfi_native/0.3.0`. `gvfi_backend_info_t` is size-tagged
and reports:

- backend-info ABI version;
- whether ncnn was compiled in;
- initialization and model-loaded flags;
- selected device index;
- packed Vulkan API version;
- GPU name and ncnn version strings.

`gvfi_get_backend_info()` is available in both builds. In the default OFF build,
it returns `ncnn_enabled=0`; `gvfi_load_model()` returns
`GVFI_NOT_IMPLEMENTED`. Python exposes these values via
`NativeLibraryLoader.backend_info()` and maps the disabled model path to
`BackendNotImplementedError`.

`gvfi_process()` remains `GVFI_NOT_IMPLEMENTED` in both configurations. This is
intentional: no frame inference, RIFE graph logic, or output ownership change is
part of C3.

## Verification status

Verified on the audited Windows machine:

- dependency-free DLL build and load;
- create, initialize, backend-info query, disabled model-load status, process
  status, and destroy;
- existing WorkLoop/memory native ABI compatibility;
- CLI backend command-contract and full Python runtime tests;
- runtime Vulkan device visibility through `vulkaninfo`.

Not verified because the development dependencies and standalone test model are
absent:

- compilation of the ON target;
- ncnn-reported GPU/Vulkan/ncnn metadata;
- param/bin loading and extractor creation at runtime;
- a Vulkan GPU inference dispatch.

The precise environment evidence and unblock steps are recorded in
`docs/native/ncnn-environment.md`.

## Current limitations and next proof

This prototype uses ncnn global GPU instance functions. The first enabled test
must use one serialized backend instance and verify repeated initialize/release
cycles before any multi-worker design. It deliberately has no batching, zero
copy, allocator tuning, shader changes, or memory optimization.

The next proof must stop after a single deterministic model inference:

1. provide the missing compiler, Vulkan SDK, and Vulkan-enabled ncnn package;
2. add a tiny licensed ncnn test model, not a RIFE model;
3. configure and build with `ENABLE_NCNN_BACKEND=ON`;
4. assert ncnn device metadata through the C ABI;
5. feed one known tensor, run one extractor call, and compare expected output;
6. release and confirm no device or process failure;
7. keep the CLI path untouched.
