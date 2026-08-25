# Phase D — GVFI 全工程查漏补缺、稳定性治理与功能应用优化

> 状态:已定义(2026-08-19)
> 目标:把工程从"功能已经很多"推进到"可维护、可验证、可发布"
> 原则:不堆新功能;先治理,后增强;Native 默认启用前必须过发布门槛

---

## 0. 与既有阶段的关系

| 既有阶段 | Phase D 归属 | 说明 |
|----------|-------------|------|
| Phase B1–B3 | 已完结(历史) | FrameQueue 基础、CLI Pipeline 优化、Scene Scheduler |
| Phase C0–C5.2 | 已完结(历史) | Native Backend 从 PoC 到 VideoWorker A/B 验证通过 |
| **Phase C6(进行中)** | **= D3** | Native 批量调用边界优化(已改 `interpolator_backend.py`,未提交) |

**当前最优先三个问题(解决前不新增 AI 模型 / 复杂 GUI):**
1. Native 逐帧调用导致性能落后 2–3 倍 → **D3**
2. Native fallback 与错误状态未产品化 → **D2**（D1 统一错误契约已完成）
3. 工作区大量未分类实验文件与未提交改动 → **D0**

---

## 一、事实基线(D0)

1. 固定当前主分支与已验证提交。
2. 未提交文件按类别分组:生产代码 / Native Backend / 测试代码 / 文档 / Web UI / 临时脚本与实验产物。
3. 删除或归档失效实验代码,不直接删除用户改动。
4. 建立完整测试矩阵:
   - CLI+disk / Native+disk / CLI+memory / Native+memory
   - 有音频 / 无音频;单场景 / 多场景;偶数尺寸 / 奇数尺寸
   - 1080p / 4K;CPU / Vulkan GPU
5. 每组测试固定:输入 SHA-256、参数、输出元数据、日志。

## 二、架构问题解决(D1–D2)

> D1 状态：已完成。已引入不可变 `RuntimeConfig`、稳定错误码、任务 ID 与规范化配置日志；默认 CLI/disk 行为不变。

1. **统一参数配置**:`backend_mode`、`pipeline_mode`、模型、GPU、编码器、超分、场景检测集中到一个不可变配置对象;禁止在 VideoWorker / GUI / CLI / Native 重复解释同一参数。
2. **Backend 生命周期统一**:`initialize → load_model → process → release`,要求:
   - initialize 失败可观察;model load 失败可观察;process 失败不静默;release 可重复调用;
   - 任务结束后 GPU 资源释放;CLI 与 Native 实现同一接口契约。
3. **CLI fallback 明确化**:
   - 输出 `NATIVE BACKEND FAILED` → `FALLBACK TO CLI`;
   - 记录失败阶段、错误码、原始异常、fallback 是否成功、最终任务状态;
   - 禁止"任务成功"但实际走了未知后端。

> D2 状态：已完成。VideoWorker 已接入线程安全生命周期状态、协作式取消、受保护的 Backend 释放、结构化 fallback 记录和最终 `TASK RESULT` 日志；完整 fallback 集成测试 10/10 通过。

## 三、Native Backend 优化(D3 — 原 Phase C6)

1. 减少 Python↔DLL 逐帧调用,增加批量 Frame 接口。
2. 一个场景内模型常驻;禁止跨场景传递输入帧;保留 CLI fallback。
3. 统计:`batch_count` / `frame_count` / `native_call_count` / `model_load_count`(真实值,不再假设=process_count)/ Vulkan init time / inference time / PNG IO time。
4. 优化前后对比:输出帧数、帧顺序、MAE、PSNR、内存、稳定性。

## 四、内存/磁盘管线遗留问题(D4)

> D4 状态：已完成基础治理。FrameQueue 已具备哨兵关闭、异常传播、超时退出和完整统计；memory 模式仍为明确的 decode/queue/consume 验证路径，尚未接 RIFE 或编码器。

1. disk 模式保留为稳定 fallback;memory 模式先只在 Native Backend 使用。
2. FrameQueue 增加:有界容量、超时、sentinel、shutdown、producer/consumer 异常传播;禁止消费者异常后生产者永久阻塞。
3. 处理:空视频、单帧视频、损坏 PNG、解码中断、编码失败、磁盘空间不足。
4. 记录队列:当前长度、峰值长度、等待时间、丢弃数量、关闭原因。

## 五、场景调度检查(D5)

> D5 状态：已完成。场景任务在执行前验证顺序与输出区间，失败任务不会污染后续场景，Native/CLI 模型加载统计已分离；媒体契约覆盖 H.264/H.265/AV1、音轨、VFR、旋转、位深、HDR、alpha 与奇数尺寸策略。

1. 场景边界不插帧;场景之间不串帧;输出编号连续;场景数量与实际输出一致。
2. 单场景与多场景都测;失败场景不污染后续场景;取消时所有 worker 退出。
3. 不再用 "process_count == model_load_count" 假设,分别记录真实值。

## 六、格式兼容性(D5)

覆盖:H.264 / H.265 / AV1;无音频 / AAC / 多音轨;VFR / CFR;旋转元数据;HDR;10-bit;透明通道;奇数分辨率。
明确颜色格式:RGB/BGR、BT.601/BT.709、limited/full range、8/10-bit、alpha 保留策略。

## 七、错误处理与可观测性(D1–D2)

统一错误分类:`CONFIG_ERROR` / `INPUT_ERROR` / `DECODE_ERROR` / `MODEL_ERROR` / `VULKAN_ERROR` / `BACKEND_ERROR` / `ENCODE_ERROR` / `CANCELLED` / `UNKNOWN_ERROR`。
每任务生成唯一 `task_id`,记录:输入文件、参数快照、backend、model hash、GPU、各阶段耗时、输出文件、错误信息、fallback 状态。

## 八、功能应用层(D7,不重写 GUI)

1. 任务取消;2. 断点恢复;3. 批量文件队列;4. 输出目录冲突保护;
5. 自动保留失败任务日志;6. 输出视频完整性检查;7. 任务完成自动生成报告;
8. 预估磁盘空间;9. GPU 不可用明确提示;10. CLI/Native/CPU 后端状态可视化。

## 九、测试体系升级(D6)

> D6 状态：短时基线已完成。单实例 Native 1080p forward 100/100、完整 Native VideoWorker 10/10，0 fallback/崩溃/NaN/Inf；资源采样已建立。多小时 soak 尚未执行，因此内存泄漏风险未正式关闭。

四层测试:
1. 单元:Frame、FrameQueue、参数校验、时间戳、错误码;
2. Backend:CLI、Native、fallback、release、model hash;
3. VideoWorker:单场景、多场景、音频、取消、失败恢复;
4. 长稳:100 次 Native forward、10 次完整任务、多小时运行、内存与 GPU 资源变化。

## 十、发布前门槛(Native 默认启用条件)

- [ ] CLI fallback 完整可用
- [ ] Native 连续任务成功率 100%
- [ ] 无 Vulkan 崩溃
- [ ] 无帧丢失或重排
- [ ] 输出质量达既定 PSNR/SSIM 阈值
- [ ] Native 性能不明显劣于 CLI
- [ ] 内存增长可解释
- [ ] 所有关键测试可重复
- [ ] 文档与版本信息完整

## 推荐执行顺序

```
D0 工作区与依赖清理
D1 参数与错误模型统一
D2 VideoWorker 生命周期与取消机制
D3 Native 批量调用边界(原 C6,进行中)
D4 FrameQueue memory pipeline
D5 格式兼容性与场景调度
D6 长稳与压力测试
D7 功能应用完善
D8 发布候选版本
```
