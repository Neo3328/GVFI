# RIFE Defect Checklist — Real Dance Clip (cli / rife-v4.6)

**Date:** 2026-08-12  
**Scope:** Defect inventory only · **RIFE only** · no IFRNet · no FILM · no GVFI code / `backend_mode` change  

**Production preserved:** `backend_mode=cli` · **`rife-v4.6`**

**Source:** `D:\GVFI-deps\native-video-worker-ab\c81_real_content\input\L1L2_douyin_t3s.mp4`  
(720×1038 · 30fps · 3s · night outdoor dance · Douyin watermark)

**RIFE output used:** existing GVFI CLI product path  
`...\c81_real_content\gvfi_cli\L1L2_douyin_t3s_enhanced.mp4` → decoded 144 frames @48fps  
Work: `D:\GVFI-deps\rife-defect-audit\` (motion rank + review stills)

**Method:** Rank consecutive-frame MAE → inspect top-motion outs (#39, #36, #25, #21, #26, #22, #130, #12) + sheets.  
Tags: severity **高 / 中 / 低**. Note: source is low-light and already soft; defects below emphasize **interpolation-typical** patterns (layered ghost, translucent limb over torso), not native camera blur alone.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Defect summary table

| 场景 | RIFE表现 | 严重程度 | 代表帧 (out#) |
|------|----------|----------|----------------|
| 快速挥臂 / 抬手 | **双影**（半透明多层手臂）+ 形状糊成一团 | **高** | 12, 21, 25, 36, 39, 130 |
| 手臂横穿躯干（交叉遮挡） | 肢体与衣服 **像素融合 / 半透明叠层**；肘腕解剖丢失 | **高** | 25, 26, 36, 39 |
| 快速手臂边缘 | **拖影 / smear**；背景透过手臂可见 | **高** | 26, 36 |
| 快速腿部 / 脚步 | 脚与地面边缘 **软糊、轻微拖尾**；偶见地标线被“拉” | **中** | 39, 12 |
| 快速转身 / 躯干扭转 | 轮廓软化；未见整段肢体断裂，但肩臂边界糊 | **中** | 21, 130 |
| Warp（运动边界） | 运动臂与背景/躯干交界 **拉丝、晕边**；地标白线近腿处轻微畸变 | **中** | 25, 39 |
| 人脸快速运动 | 低光下整体软；局部下颌/发际轻微不稳；**未见夸张脸崩** | **低～中** | 12, 21, 130 |
| 高频背景（楼窗网格、路面） | 静态区大体稳定；主体晕边处有光晕；细节受源片噪声限制 | **低** | 全片抽样 |
| 重复帧 | 本段 144 帧 **精确逐像素连续重复 = 0** | **低**（未见） | — |
| 肢体断裂（完全断开） | **未观察到**干净“断肢”；主要表现为双影/糊融而非硬断裂 | **低**（本素材） | — |

---

## Checklist detail

### 1. 双影？
**有 · 高。** 高运动帧上挥臂呈多层半透明轮廓（经典 layered ghost），非单一自然运动模糊。

### 2. 拖影？
**有 · 高（臂）/ 中（腿）。** 手臂呈扇形 smear；腿与地面有拖尾感。

### 3. 肢体断裂？
**本素材基本无硬断裂 · 低。** 结构问题以双影+融合为主，而非臂从躯干撕开。

### 4. Warp？
**有 · 中。** 运动边界晕边/拉丝；地标线近身体处轻微扭曲。

### 5. 脸变形？
**轻微 · 低～中。** 脸可辨但软；未见严重“融化脸”。低光+运动共同贡献，不宜全部归咎于 RIFE。

### 6. 高频细节丢失？
**局部 · 低～中。** 手部高频完全丢失（高）；远处楼窗/路面在静态区尚可辨，运动晕边处变糊。

### 7. 重复帧？
**无（本输出）。** `exact_dups = []` on 144 CLI frames.

---

## Scenario coverage (素材是否覆盖)

| 目标场景 | 本片是否覆盖 |
|----------|----------------|
| 快速挥手/抬手 | **是**（主缺陷区） |
| 快速腿部运动 | **部分**（有脚步，幅度弱于手臂） |
| 人体交叉遮挡 | **是**（臂过胸） |
| 快速转身 | **部分**（有扭转，非剧烈 180°） |
| 人脸快速运动 | **部分**（有运动，低光限制） |
| 背景高频+同时运动 | **弱**（楼窗网格偏静；主体运动为主） |

---

## Priority for next algorithm hunt

1. **P0 — 快速肢体双影 / 半透明叠层**（挥臂、臂过胸）  
2. **P1 — 运动边界 warp / 晕边**  
3. **P2 — 腿脚与地面交界拖尾**  
4. **P3 — 脸**（本片未构成主矛盾）  
5. **P3 — 重复帧**（本 CLI 输出未复现）

这与 C8 GmfSs↔RIFE 观察一致：差距集中在 **fast limb morphology**，而非全局纹理或人脸。

---

## Notes

- 未改 GVFI；未跑 IFRNet/FILM。  
- 审查图：`D:\GVFI-deps\rife-defect-audit\sheets\`  
- 运动排序：`...\logs\motion_rank.json`
