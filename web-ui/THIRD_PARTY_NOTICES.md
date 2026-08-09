# GVFI Third-Party Notices

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

This product includes or redistributes components that are subject to their own licenses. Source attribution below is informational; full license texts are available from the upstream projects.

## Application stack (web-ui)

| Component | License (typical) | Notes |
|-----------|-------------------|--------|
| Next.js | MIT | UI framework |
| React / React DOM | MIT | UI runtime |
| Electron | MIT | Desktop shell |
| Zustand | MIT | Client state |
| Lucide React | ISC | Icons |
| Tailwind CSS | MIT | Styling |
| Base UI | MIT | Primitives |
| html2canvas | MIT | Capture utility |
| react-markdown / remark-gfm | MIT | Report preview |

## Video / AI runtime (bundled or adjacent)

| Component | License (typical) | Notes |
|-----------|-------------------|--------|
| RIFE / ECCV2022-RIFE lineage | Academic / project license | Frame interpolation models & code |
| rife-ncnn-vulkan | MIT (ncnn ecosystem) | Local inference binary |
| FFmpeg | LGPL / GPL (build-dependent) | Media mux/demux |
| Real-ESRGAN / RealCUGAN (if present) | BSD / project license | Super-resolution models |
| OpenAI / DeepSeek / Moonshot APIs | Vendor ToS | Optional cloud LLM — keys never shipped |

## Native packaging notes

See also `native/NOTICE.txt` for native packaging acknowledgements when present.

Users must comply with each third-party license when redistributing binaries that include those components.
