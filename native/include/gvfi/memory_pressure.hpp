#pragma once
// Memory pressure monitor — design inspired by XNU memorystatus/jetsam ideas.
// Implemented with Windows GlobalMemoryStatusEx + working-set queries.

#include <atomic>
#include <cstdint>
#include <functional>
#include <mutex>
#include <thread>
#include <vector>

namespace gvfi {

enum class PressureLevel : int {
  Normal = 0,
  Warning = 1,
  Critical = 2,
};

struct MemorySnapshot {
  std::uint64_t total_phys_bytes{0};
  std::uint64_t avail_phys_bytes{0};
  std::uint64_t total_pagefile_bytes{0};
  std::uint64_t avail_pagefile_bytes{0};
  std::uint32_t memory_load_percent{0};
  PressureLevel level{PressureLevel::Normal};
};

class MemoryPressureMonitor {
 public:
  using Listener = std::function<void(const MemorySnapshot&)>;

  MemoryPressureMonitor();
  ~MemoryPressureMonitor();

  MemoryPressureMonitor(const MemoryPressureMonitor&) = delete;
  MemoryPressureMonitor& operator=(const MemoryPressureMonitor&) = delete;

  void setThresholds(std::uint32_t warn_load_percent,
                     std::uint32_t critical_load_percent);

  void addListener(Listener listener);
  bool start(std::uint32_t poll_interval_ms = 500);
  void stop();

  MemorySnapshot sample() const;
  PressureLevel level() const noexcept {
    return level_.load(std::memory_order_acquire);
  }

  /// True when callers should shed caches / pause non-critical work.
  bool shouldBackpressure() const noexcept {
    return level() >= PressureLevel::Warning;
  }

 private:
  void threadMain();
  MemorySnapshot sampleUnlocked() const;
  PressureLevel classify(const MemorySnapshot& snap) const;

  std::uint32_t warn_pct_{75};
  std::uint32_t critical_pct_{90};
  std::uint32_t poll_ms_{500};
  std::atomic<PressureLevel> level_{PressureLevel::Normal};
  std::atomic<bool> running_{false};
  std::thread worker_;
  mutable std::mutex listeners_mu_;
  std::vector<Listener> listeners_;
};

}  // namespace gvfi
