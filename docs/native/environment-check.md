# Native Backend Environment Check

Check date: 2026-08-10

| Item | Status | Version | Path |
| --- | --- | --- | --- |
| MSVC | Ready | Compiler 19.51.36252; Linker 14.51.36252.0; Build Tools 18.8.2 | `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools` |
| Windows SDK | Ready | 10.0.26100.0 (10.0.22621.0 also installed) | `C:\Program Files (x86)\Windows Kits\10` |
| CMake | Ready | 4.4.2 | `C:\Users\33286\AppData\Local\Programs\Python\Python312\Scripts\cmake.exe` |
| Ninja | Ready | 1.13.0.git.kitware.jobserver-pipe-1 | `C:\Users\33286\AppData\Local\Programs\Python\Python312\Scripts\ninja.exe` |
| Vulkan SDK | Ready | 1.4.357.0 | `D:\VulkanSDK\1.4.357.0` |
| glslc | Ready | shaderc 2026.3 | `D:\VulkanSDK\1.4.357.0\Bin\glslc.exe` |
| Vulkan GPU | Ready | Vulkan API 1.4.341; NVIDIA driver 610.88 | `NVIDIA GeForce RTX 5060 Laptop GPU` |

## Verified Files

- `cl.exe`: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.51.36231\bin\Hostx64\x64\cl.exe`
- `link.exe`: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.51.36231\bin\Hostx64\x64\link.exe`
- `MSBuild.exe`: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\amd64\MSBuild.exe` (18.8.2.30814)
- `vswhere.exe`: `C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe`
- Windows SDK include: `C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0`
- Windows SDK library: `C:\Program Files (x86)\Windows Kits\10\Lib\10.0.26100.0`
- Vulkan header: `D:\VulkanSDK\1.4.357.0\Include\vulkan\vulkan.h`
- Vulkan import library: `D:\VulkanSDK\1.4.357.0\Lib\vulkan-1.lib`

## Runtime Validation

`vulkaninfo --summary` created a Vulkan 1.4.357 instance and enumerated the NVIDIA GeForce RTX 5060 Laptop GPU as a discrete Vulkan device. The GPU exposes Vulkan API 1.4.341.

The Vulkan SDK is registered in the machine-level `VULKAN_SDK` environment variable. Shells opened before SDK installation must be restarted to inherit `VULKAN_SDK` and the SDK `Bin` path.
