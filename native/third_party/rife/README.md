# RIFE compatibility sources

These files are the minimal RIFE v4.6 runtime and custom `rife.Warp` layer
copied from the official `nihui/rife-ncnn-vulkan` project at commit
`a7532fc3f9f8f008cd6eecd6f2ffe2a9698e0cf7` (2022-10-29 release).

They are compiled only when `ENABLE_NCNN_BACKEND=ON`. The default native DLL
build remains dependency-free. The accompanying `LICENSE` is the upstream MIT
license. The model files are not vendored here.
