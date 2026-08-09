#pragma once
// GVFI WorkLoop — clean-room redesign inspired by IOKit IOWorkLoop concepts.
// Windows user-space, C++20. No APSL Original Code.

#include "gvfi/event_source.hpp"

#include <atomic>
#include <condition_variable>
#include <functional>
#include <memory>
#include <mutex>
#include <thread>
#include <vector>

namespace gvfi {

enum class WorkStatus : int {
  Ok = 0,
  Busy = 1,
  Aborted = 2,
  Error = 3,
};

/// Single-threaded event marshaller: one worker thread walks event sources
/// under a recursive gate, sleeps when idle, wakes on signalWork().
class WorkLoop {
 public:
  WorkLoop();
  ~WorkLoop();

  WorkLoop(const WorkLoop&) = delete;
  WorkLoop& operator=(const WorkLoop&) = delete;

  bool start();
  void stop();

  WorkStatus addEventSource(std::shared_ptr<EventSource> source);
  WorkStatus removeEventSource(EventSource* source);

  /// Wake the worker to re-scan event sources.
  void signalWork();

  /// Run `fn` on the work-loop thread (serialized by the gate).
  WorkStatus runOnLoop(std::function<void()> fn);

  bool onLoopThread() const noexcept;
  bool isRunning() const noexcept { return running_.load(std::memory_order_acquire); }

  /// Recursive gate — mirrors IOWorkLoop closeGate/openGate semantics.
  void closeGate();
  void openGate();

 private:
  void threadMain();
  bool runEventSources();

  std::vector<std::shared_ptr<EventSource>> sources_;
  mutable std::recursive_mutex gate_;
  std::mutex wake_mu_;
  std::condition_variable wake_cv_;
  std::atomic<bool> work_pending_{false};
  std::atomic<bool> running_{false};
  std::atomic<bool> terminate_{false};
  std::thread worker_;
  std::thread::id worker_id_{};
};

}  // namespace gvfi
