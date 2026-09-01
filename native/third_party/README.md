# Optional native dependencies

No third-party source or binary is vendored in this directory.

The experimental backend is enabled explicitly with
`-DENABLE_NCNN_BACKEND=ON`. Configure CMake with:

- `VULKAN_SDK` pointing to a LunarG Vulkan SDK installation;
- `ncnn_DIR` pointing to a Vulkan-enabled ncnn package containing
  `ncnnConfig.cmake`.

Keep dependency build trees outside the GVFI source tree. The default build is
dependency-free and uses `ENABLE_NCNN_BACKEND=OFF`.
