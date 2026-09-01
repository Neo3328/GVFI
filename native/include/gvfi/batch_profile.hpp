/**
 * GVFI — C6.5 batch GPU profile storage (PoC instrumentation only)
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#pragma once

namespace gvfi {

struct BatchGpuProfile {
  int batch_size{0};
  int vk_submit_count{0};
  double total_ms{0.0};
  double record_ms{0.0};
  double submit_ms{0.0};
  double postprocess_ms{0.0};
  bool valid{false};
};

void store_batch_gpu_profile(const BatchGpuProfile& profile);
bool load_batch_gpu_profile(BatchGpuProfile& out);

}  // namespace gvfi
