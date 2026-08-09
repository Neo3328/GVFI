#include "gvfi/memory_pressure.hpp"

#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>

#include <chrono>

namespace gvfi {

MemoryPressureMonitor::MemoryPressureMonitor() = default;

MemoryPressureMonitor::~MemoryPressureMonitor() { stop(); }

void MemoryPressureMonitor::setThresholds(std::uint32_t warn_load_percent,
                                          std::uint32_t critical_load_percent) {
  warn_pct_ = warn_load_percent;
  critical_pct_ = critical_load_percent;
}

void MemoryPressureMonitor::addListener(Listener listener) {
  if (!listener) {
    return;
  }
  std::lock_guard<std::mutex> lock(listeners_mu_);
  listeners_.push_back(std::move(listener));
}

bool MemoryPressureMonitor::start(std::uint32_t poll_interval_ms) {
  if (running_.exchange(true)) {
    return true;
  }
  poll_ms_ = poll_interval_ms == 0 ? 500 : poll_interval_ms;
  worker_ = std::thread([this] { threadMain(); });
  return true;
}

void MemoryPressureMonitor::stop() {
  if (!running_.exchange(false)) {
    return;
  }
  if (worker_.joinable()) {
    worker_.join();
  }
}

MemorySnapshot MemoryPressureMonitor::sample() const {
  return sampleUnlocked();
}

MemorySnapshot MemoryPressureMonitor::sampleUnlocked() const {
  MEMORYSTATUSEX status{};
  status.dwLength = sizeof(status);
  MemorySnapshot snap;
  if (GlobalMemoryStatusEx(&status)) {
    snap.total_phys_bytes = status.ullTotalPhys;
    snap.avail_phys_bytes = status.ullAvailPhys;
    snap.total_pagefile_bytes = status.ullTotalPageFile;
    snap.avail_pagefile_bytes = status.ullAvailPageFile;
    snap.memory_load_percent = static_cast<std::uint32_t>(status.dwMemoryLoad);
  }
  snap.level = classify(snap);
  return snap;
}

PressureLevel MemoryPressureMonitor::classify(
    const MemorySnapshot& snap) const {
  if (snap.memory_load_percent >= critical_pct_) {
    return PressureLevel::Critical;
  }
  if (snap.memory_load_percent >= warn_pct_) {
    return PressureLevel::Warning;
  }
  return PressureLevel::Normal;
}

void MemoryPressureMonitor::threadMain() {
  PressureLevel last = PressureLevel::Normal;
  while (running_.load(std::memory_order_acquire)) {
    const auto snap = sampleUnlocked();
    level_.store(snap.level, std::memory_order_release);
    if (snap.level != last) {
      last = snap.level;
      std::vector<Listener> copy;
      {
        std::lock_guard<std::mutex> lock(listeners_mu_);
        copy = listeners_;
      }
      for (auto& fn : copy) {
        fn(snap);
      }
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(poll_ms_));
  }
}

}  // namespace gvfi
