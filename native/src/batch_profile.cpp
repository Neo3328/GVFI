/**
 * GVFI — C6.5 batch GPU profile storage
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#include "gvfi/batch_profile.hpp"

#include <mutex>

namespace gvfi {
namespace {

std::mutex g_mu;
BatchGpuProfile g_last;

}  // namespace

void store_batch_gpu_profile(const BatchGpuProfile& profile) {
  std::lock_guard<std::mutex> lock(g_mu);
  g_last = profile;
  g_last.valid = true;
}

bool load_batch_gpu_profile(BatchGpuProfile& out) {
  std::lock_guard<std::mutex> lock(g_mu);
  if (!g_last.valid) {
    return false;
  }
  out = g_last;
  return true;
}

}  // namespace gvfi
