# Phase D0 — 工作区与依赖清理:只读分类清单

> 日期:2026-08-19
> 状态:只读分析完成,未删除、未提交、未改任何文件
> 分支:`docs/baidu-mirror-and-download-guide` @ `363ee76`
> 总计:159 项变化 = 98 未跟踪 + 43 已删除 + 18 已修改

---

## 一、已修改文件(18 个)— 未提交

### 类别 A:Native 生产代码(8 个)— 应保留并提交

| 文件 | 性质 | 建议 |
|------|------|------|
| `ECCV2022-RIFE/gvfi_runtime/native_bin/gvfi_native.dll` | Native DLL(11MB 二进制) | 保留,随生产提交 |
| `ECCV2022-RIFE/gvfi_runtime/native_library.py` | ctypes 绑定 | 保留,随生产提交 |
| `native/CMakeLists.txt` | 构建配置 | 保留 |
| `native/include/gvfi/ncnn_vulkan_backend.hpp` | 后端头 | 保留 |
| `native/include/gvfi_native.h` | C ABI 头 | 保留 |
| `native/src/gvfi_native.cpp` | 核心实现 | 保留 |
| `native/src/ncnn_vulkan_backend.cpp` | Vulkan 后端 | 保留 |
| `native/third_party/rife/rife.h` | RIFE 头 | 保留 |

### 类别 B:Web UI 用户改动(10 个)— 用户改动,保留但**单独提交**

| 文件 | 性质 |
|------|------|
| `web-ui/electron/main.js` (+87) | Electron 主进程 |
| `web-ui/electron/preload.js` (+4) | 预加载 |
| `web-ui/src/components/ai-workspace/chat-pane.tsx` (+166) | AI 对话面板 |
| `web-ui/src/components/workspace/settings-hub-page.tsx` (+2) | 设置中心 |
| `web-ui/src/hooks/use-job-polling.ts` (+111) | 任务轮询 |
| `web-ui/src/lib/desktop.ts` (+15) | 桌面桥接 |
| `web-ui/src/lib/i18n/messages/en.ts` (+51) | 英文文案 |
| `web-ui/src/lib/i18n/messages/zh-CN.ts` (+47) | 中文文案 |
| `web-ui/src/stores/ai-session-store.ts` (+9) | AI 会话状态 |
| `web-ui/src/stores/job-store.ts` (+19) | 任务状态 |

### 类别 C:.cursor/skills 删除(43 个)— 已被 git 跟踪,现删除

全部位于 `web-ui/.cursor/skills/{banner-design,design,slides}/`,是 Cursor 编辑器技能文件,已从磁盘删除。建议**作为一次独立提交**(删除无用技能),或确认后 `git rm`。

## 二、未跟踪文件(98 个)— 未提交

### 类别 D:测试脚本(18 个)— 建议保留,归档到 tests/

| 文件 | 阶段 |
|------|------|
| `ECCV2022-RIFE/tests/test_c54_{cli_only,debug,direct,exec,fallback,final_validation,simple}.py` | C5.4 系列(7 个) |
| `ECCV2022-RIFE/tests/test_c61_profile.py` | C6.1 |
| `ECCV2022-RIFE/tests/test_c62_memory_io_poc.py` | C6.2 |
| `ECCV2022-RIFE/tests/test_c63_batch_poc.py` | C6.3 |
| `ECCV2022-RIFE/tests/test_c64_gpu_batch.py` | C6.4 |
| `ECCV2022-RIFE/tests/test_c65_steady_state_profile.py` | C6.5 |
| `ECCV2022-RIFE/tests/test_c66_pipeline_overlap.py` | C6.6 |
| `ECCV2022-RIFE/tests/test_c711_frame_mapping.py` | C7.1.1 |
| `ECCV2022-RIFE/tests/test_c71_final_regression.py` | C7.1 |
| `ECCV2022-RIFE/tests/test_c72_cli_native_ab.py` | C7.2 |
| `ECCV2022-RIFE/tests/test_c73_production_callchain_audit.py` | C7.3 |
| `ECCV2022-RIFE/tests/test_video_worker_ab.py` | C5.2(核心 A/B) |

> 注:`tests/test_c6_{batch_boundary,ab_bench,stability}.py` 已随 `363ee76` 提交,不在清单内。

### 类别 E:Native 构建/PoC 源码(9 个)— 建议保留(生产/实验混合,需甄别)

| 文件 | 性质 |
|------|------|
| `native/include/gvfi/batch_profile.hpp` | 批量 profile(实验→已用于生产批量) |
| `native/include/gvfi/batch_rife_worker.hpp` | 批量 worker(实验) |
| `native/include/gvfi/pipeline_rife_worker.hpp` | pipeline worker(实验) |
| `native/src/batch_profile.cpp` | 批量 profile(实验→已用于生产批量) |
| `native/src/batch_rife_worker.cpp` | 批量 worker(实验) |
| `native/src/pipeline_poc_capi.cpp` | pipeline PoC(实验) |
| `native/src/pipeline_rife_worker.cpp` | pipeline worker(实验) |
| `native/third_party/rife/process_v4_batch.cpp` | **生产批量实现**(D3 依赖) |
| `native/CMakeCache.txt` + `native/CMakeFiles/` | **构建缓存 — 可删除/ignore**(18K) |

### 类别 F:文档(约 60 个)— 建议保留归档 docs/

| 分组 | 文件 |
|------|------|
| 根级审计 | `PROJECT_AUDIT.md`、`docs/project-archive-inventory.md`、`docs/rife-defect-checklist.md` |
| C8–C9 调研 | `docs/c8-svfi-vs-gvfi-audit.md`、`docs/c9-*.md`(6 个) |
| C10 系列 | `docs/c10-*.md`(4 个) |
| C11 系列 | `docs/c11-*.md`(6 个) |
| C12 系列 | `docs/c12-*.md`(5 个) |
| C13 系列 | `docs/c13-*.md`(4 个) |
| C81 系列 | `docs/c81-*.md`(8 个) |
| C91–C93 | `docs/c91-*.md`(2)、`c92-*.md`(3)、`c93-*.md`(1) |
| native 文档 | `docs/native/*.md`(18 个,C5/C6/C7 实验记录) |
| github | `docs/github/full-project-inventory.md`(110KB) |

### 类别 G:临时脚本与测试产物(6 个)— 需甄别

| 文件 | 性质 | 建议 |
|------|------|------|
| `repair.bat` | MP4 修复工具(用户脚本) | 用户文件,保留不提交 |
| `scripts/_archive_inventory_scan.py` | 归档清单扫描脚本 | 保留(工具)或归档 |
| `scripts/_full_project_inventory_audit.py` | 全量清单审计脚本 | 保留(工具)或归档 |
| `tests/`(含 `native_backend/test_native_backend.py`) | 测试(含 pycache) | 保留 py,删除 pycache |
| `tests/native_backend/__pycache__/` | Python 缓存 | **删除**(构建产物) |

### 类别 H:Web UI 新增(6 个)— 用户改动,保留

| 文件 | 性质 |
|------|------|
| `web-ui/src/components/ai-workspace/ai-fix-actions.tsx` | AI 修复动作 |
| `web-ui/src/components/settings/api-quick-connect.tsx` | API 快速连接 |
| `web-ui/src/lib/ai-file-copy.ts` | AI 文件复制 |
| `web-ui/src/lib/ai-fix-protocol.ts` | AI 修复协议 |
| `web-ui/src/lib/ai-text-attach.ts` | AI 文本附件 |
| `web-ui/src/lib/svfi-progress-line.ts` | SVFI 进度线 |

## 三、汇总统计

| 类别 | 数量 | 处置建议 |
|------|------|---------|
| A. Native 生产代码(已修改) | 8 | 提交(生产) |
| B. Web UI 用户改动(已修改) | 10 | 提交(单独,用户改动) |
| C. .cursor/skills 删除 | 43 | 独立提交(git rm) |
| D. 测试脚本 | 18 | 提交(测试归档) |
| E. Native 构建/PoC | 9 | 甄别:生产 1 + 实验 7 + 缓存删除 2 |
| F. 文档 | ~60 | 提交(文档归档) |
| G. 临时脚本/产物 | 6 | 甄别:工具 3 + pycache 删 2 + 用户 1 |
| H. Web UI 新增 | 6 | 提交(与 B 一起,用户改动) |

## 四、明确可删除(构建产物/缓存,无价值)

1. `native/CMakeCache.txt`(8K)
2. `native/CMakeFiles/`(10K)
3. `tests/native_backend/__pycache__/`(pyc 缓存)
4. `native/build/`(0 字节,空目录,git 不跟踪)

## 五、需用户确认的处置

- [ ] A 类 Native 生产代码 → 提交?(建议是)
- [ ] B+H 类 Web UI 用户改动 → 单独提交?(建议是,用户改动不混入)
- [ ] C 类 .cursor 删除 → 确认删除?(建议是,编辑器技能)
- [ ] D 类测试脚本 → 归档提交或保留工作区?
- [ ] E 类实验源码(batch_rife_worker/pipeline_*)→ 归档 or 保留?
- [ ] F 类实验文档 → 归档提交 or 保留?
- [ ] G 类脚本/产物 → 保留/删除?
- [ ] 构建缓存(四) → 直接删除?(建议是)

## 六、建议执行顺序(确认后)

1. 删除构建缓存(类别四)—— 无风险
2. 提交 A 类(Native 生产代码)+ E 类中 `process_v4_batch.cpp`
3. 提交 C 类(.cursor 删除)
4. 提交 B+H 类(Web UI 用户改动)
5. 提交 D+F 类(测试 + 文档归档)
6. 甄别 E 类实验源码与 G 类脚本 → 归档目录或删除
