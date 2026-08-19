# C8.1 补充 — 视觉抽帧评审（已有产物，不对齐重跑）

**Phase:** C8.1 visual review only  
**Date:** 2026-08-12  
**Constraint:** 不重跑 GVFI / Steam SVFI；不改生产代码；不进入 C8.2。

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Sources（只读已有 MP4）

| Side | Path |
|------|------|
| GVFI | `D:\GVFI-deps\native-video-worker-ab\c81_ab\gvfi_cli\p0_src_1080p24_audio_enhanced.mp4` |
| SVFI | `D:\GVFI-deps\native-video-worker-ab\c81_ab\svfi_out\p0_src_1080p24_audio-48.000fps.GmfSs_pg_104.D3.DBG.000004.mp4` |

解码与抽帧产物：`D:\GVFI-deps\native-video-worker-ab\c81_ab\visual_review\`  
对齐方式：**相同 output frame index**（1…48）并排；另用片内烧录时间码/帧号做 timing 交叉核对。

内容类型：合成测试图案（色条 + 斜线 + 棋盘 + 点阵 + OSD 时间码）。**无人脸/人体。**

---

## 1. 抽帧位置

| 类别 | Output indices | 依据 |
|------|----------------|------|
| 起始附近 | 1, 2, 3 | 端点 / 首插值 |
| 中段 | 12, 24, 25, 26 | 中间合成 |
| 最差 PSNR | 26, 30, 31, 36, 38 | `c81_frame_metrics.json` |
| 最好 PSNR | 1, 3, 45, 47, 48 | 同上 |
| 高运动（帧间 MAE top5） | 30, 34, 38, 40, 42 | `frame_pick.json` |
| 末尾 | 45, 46, 47, 48 | 收尾 |

共审并排：`1,2,3,12,24,25,26,30,31,34,36,38,40,42,45,46,47,48`。

---

## 2. 各位置视觉观察（GVFI 左 | SVFI 右）

规则：仅记录可见现象；像素差 ≠ “更好”；无法判断写 [UNKNOWN]。

| Out# | 烧录 OSD（可见） | 几何/伪影观察 | 标签 |
|------|------------------|---------------|------|
| 1 | 两侧均约 `00:00:00.000` / `0` | 色条、斜线、棋盘位置一致；无可见 ghost/warp | 内容 [SAME]；timing [SAME] |
| 2 | 两侧帧号约 `1`；时间 `0.040` vs `0.042` | GVFI 时间码末位可见叠影；SVFI 更干净；大几何近似一致 | timing 微 [DIFF]；OSD ghost [DIFF]（GVFI 更明显） |
| 3 | （与端点族一致，近起点） | 接近端点，整体接近 | 近似 [SAME] |
| 12 | 两侧帧号均约 `6`；时间 `0.250` vs `0.200` | **同 out index 但绿条水平位置不同**（相位不同） | **frame timing [DIFF]** |
| 24 | GVFI `0.500`/`12`；SVFI `0.458`/`11` | 绿条相位不同；本裁切锐利边缘，未见明显 ghost | **timing [DIFF]**；本裁切伪影 [UNKNOWN]/无明显 |
| 25–26 | Out#26：GVFI 约 `13`（时间码叠影）；SVFI `0.583`/`11` | 棋盘/斜线区域 absdiff 高；zoom：GVFI 侧棋盘与斜线扭曲更重，SVFI 侧结构更稳但斜线可有软晕 | **timing [DIFF]**；warp/HF [DIFF]（形态不同）；**不可直接写“SVFI 更好”**（相位未对齐） |
| 30 | GVFI `0.625`/`15`；SVFI `0.583`/`14` | zoom：GVFI 斜线过棋盘扭曲；SVFI 斜线更直但边缘更软/晕 | **timing [DIFF]**；warp vs soft-edge [DIFF] |
| 31, 34, 36 | 中高运动族 | 与 30/38 同类：结构差 + 相位可疑 | [DIFF]（存在可见差）；优劣需相位对齐后再判 |
| 38 | OSD 两侧不一致（约 `18` vs `19` 一类错位） | zoom：GVFI 棋盘波浪扭曲；SVFI 网格更稳 | **timing [DIFF]**；warp [DIFF] |
| 40, 42 | Out#42：两侧均约帧 `20`；`0.835` vs `0.833` | **两侧时间码均可见叠影/重影**；大色块边缘仍锐 | timing 微 [DIFF]；text ghost **两侧均有** [SAME 现象 / 程度未定量] |
| 45–47 | 近尾 | 差异收敛 | 趋近 [SAME] |
| 48 | 两侧烧录一致（约 `0.958`/`23`） | 全帧几何/色条视觉不可分 | 内容 [SAME]；timing [SAME] |

补充：

- **连续全同帧：** GVFI=0，SVFI=0 → 重复帧/卡顿感 [SAME]（本 clip 无线索）。
- **人脸/人体结构：** 素材无此类内容 → [UNKNOWN]。
- **场景切换：** 1s 合成片无切镜 → [UNKNOWN]。
- **插值“自然程度”（真人语义）：** 合成几何无法代表 → [UNKNOWN]。

---

## 3. 哪些原 UNKNOWN 已有视觉证据

| 原 UNKNOWN 项 | 更新 | 证据 |
|---------------|------|------|
| Frame mapping / timing | **[DIFF]** | 同 out index 烧录时间码/帧号多处不一致（如 12/24/26/30/38）；端点 1、48 对齐 |
| Ghosting | **[DIFF]**（现象存在） | OSD 数字叠影：中段 GVFI 更常见；高运动处两侧均可出现 |
| Warping / 运动边缘 / 细线 / HF 纹理 | **[DIFF]**（形态不同） | 26/30/38 zoom：GVFI 更易棋盘/斜线几何扭曲；SVFI 更易软边/晕 |
| Duplicate / 卡顿 | **[SAME]** | 无连续全同帧 |
| Color（本合成色条） | 端点 **[SAME]**；全局细微色差 | 端点不可分；未做校准测量 → 细微仍 [UNKNOWN] |

---

## 4. 仍为 UNKNOWN

| 项 | 原因 |
|----|------|
| 人脸 / 人体 | 测试片无此类内容 |
| 真实场景切镜处理 | 无 scene cut |
| “SVFI 主观更好”的净效果 | 同 index 常相位错位；未做按烧录时间对齐的二次比较 |
| Scene / Dedupe 策略是否驱动观感 | 本短片无法证明 |
| SR / 后处理贡献 | 本 A/B SR 关；未见可归因后处理 |
| 编码单独造成的观感 | 未做同像素再编码隔离 |

**硬约束：** 在 timing [DIFF] 未消除前，**禁止**把同 index 的 warp/ghost 差直接写成“模型质量结论”或“SVFI 更好”。

---

## 5. 对 C8.1 证据排序是否需要更新

**需要小幅更新（不推翻 P0 算法族结论）：**

| 优先级 | 原 C8.1 | 视觉补充后 |
|--------|---------|------------|
| P0 | 公开算法族 GmfSs vs RIFE | **保持 P0**（ini/日志已证；视觉也不否定） |
| P0/P1 | Frame mapping 多为容器级 [SAME] | **升为强 P1（接近 P0）**：**烧录时间轴映射 [DIFF]** 已目视证实 |
| P1 | Color / encode | 端点色条 [SAME]；体积差仍在；**未升为视觉主因** |
| P1 | SR / 后处理 | 仍无证据支持 |
| P2 | Encode | 保持 P2 |

“看起来更好”若来自真人片观感，本合成片**不能证实**；本片能证实的是：**(1) 算法公开名不同；(2) 同 out index 时间相位常不同；(3) 错位比较下伪影形态不同。**

---

## 6. 是否足够支持下一轮“算法对齐 A/B”

**足够启动下一轮受控 A/B 的设计依据（本阶段仍停止，不进入 C8.2）：**

建议下一轮必须同时控制：

1. **算法对齐：** 若 Steam SVFI 公开可选 RIFE，用与 GVFI 同名公开模型做黑盒对照（仍禁止逆向）。
2. **时间对齐：** 除 out index 外，按烧录时间码/源帧号配对后再比伪影。
3. **素材：** 另加含人脸/细字/真实运动的短片（本合成片无法覆盖人脸 UNKNOWN）。

在未做以上控制前，**没有足够证据**把质量差单一归因于 “GVFI 的 RIFE 实现差”。

---

## Artifacts

| Item | Path |
|------|------|
| Side-by-side | `...\visual_review\side\` |
| Timestamp/zoom crops | `...\visual_review\crops\` |
| Absdiff | `...\visual_review\diff\` |
| Pick / motion JSON | `...\visual_review\frame_pick.json` |
| Timing MAE helper | `...\visual_review\timing_check.json` |
