# GVFI Third-Party Notices

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

This product includes or redistributes components that are subject to their own licenses. Source attribution below is informational; full license texts are available from the upstream projects.

## Application stack (web-ui)

| Component | License (typical) | Repository | Notes |
|-----------|-------------------|------------|-------|
| Next.js | MIT | https://github.com/vercel/next.js | UI framework |
| React / React DOM | MIT | https://github.com/facebook/react | UI runtime |
| Electron | MIT | https://github.com/electron/electron | Desktop shell |
| electron-builder | MIT | https://github.com/electron-userland/electron-builder | Windows packaging |
| Zustand | MIT | https://github.com/pmndrs/zustand | Client state |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss | Styling |
| shadcn/ui | MIT | https://github.com/shadcn-ui/ui | Component primitives |
| Base UI | MIT | https://github.com/mui/base-ui | Accessible primitives |
| Lucide | ISC | https://github.com/lucide-icons/lucide | Icons |
| react-markdown / remark-gfm | MIT | https://github.com/remarkjs/react-markdown | Report preview |
| html2canvas | MIT | https://github.com/niklasvh/html2canvas | Capture utility |

## Video / AI runtime (bundled or adjacent)

| Component | License (typical) | Repository | Notes |
|-----------|-------------------|------------|-------|
| RIFE (ECCV2022) | Academic / project license | https://github.com/hzwer/ECCV2022-RIFE | Frame interpolation models & code |
| rife-ncnn-vulkan | MIT (ncnn ecosystem) | https://github.com/nihui/rife-ncnn-vulkan | Local inference binary |
| Real-ESRGAN | BSD | https://github.com/xinntao/Real-ESRGAN | Super-resolution models |
| RealCUGAN | Project license | https://github.com/bilibili/ailab | Super-resolution |
| ncnn | BSD-3-Clause | https://github.com/Tencent/ncnn | Inference framework |
| FFmpeg | LGPL / GPL (build-dependent) | https://github.com/FFmpeg/FFmpeg | Media mux/demux |
| OpenAI / DeepSeek / Moonshot APIs | Vendor ToS | — | Optional cloud LLM — keys never shipped |

## Native packaging notes

See also `native/NOTICE.txt` for native packaging acknowledgements when present.

Users must comply with each third-party license when redistributing binaries that include those components.
