#pragma once
// GVFI EventSource — clean-room redesign inspired by IOKit IOEventSource.

#include <atomic>
#include <chrono>
#include <cstdint>
#include <functional>
#include <mutex>
#include <string>
#include <vector>

namespace gvfi {

class WorkLoop;

/// Base event source polled by WorkLoop::runEventSources().
class EventSource {
 public:
  using Action = std::function<void()>;

  explicit EventSource(std::string name = {});
  virtual ~EventSource();

  EventSource(const EventSource&) = delete;
  EventSource& operator=(const EventSource&) = delete;

  const std::string& name() const noexcept { return name_; }

  void setEnabled(bool enabled) noexcept { enabled_.store(enabled, std::memory_order_release); }
  bool enabled() const noexcept { return enabled_.load(std::memory_order_acquire); }

  void setAction(Action action) { action_ = std::move(action); }

  /// Called on the work-loop thread. Return true if more work remains.
  virtual bool checkForWork();

  /// Mark that work is available and wake the owning loop (if any).
  void signalWork();

  void setWorkLoop(WorkLoop* loop) noexcept { loop_ = loop; }
  WorkLoop* workLoop() const noexcept { return loop_; }

 protected:
  void invokeAction();

  std::string name_;
  std::atomic<bool> enabled_{true};
  std::atomic<bool> work_to_do_{false};
  Action action_;
  WorkLoop* loop_{nullptr};
};

/// Queues callable actions from any thread; drained on the work-loop thread.
class CommandGate final : public EventSource {
 public:
  explicit CommandGate(std::string name = "command-gate");

  void submit(Action action);
  bool checkForWork() override;

 private:
  std::mutex mu_;
  std::vector<Action> queue_;
};

/// One-shot / repeating timer event source (Win32 waitable timer friendly API).
class TimerEventSource final : public EventSource {
 public:
  explicit TimerEventSource(std::string name = "timer");

  void setIntervalMs(std::uint64_t interval_ms);
  void arm(bool repeating = true);
  void cancel();

  bool checkForWork() override;

 private:
  std::atomic<std::uint64_t> interval_ms_{0};
  std::atomic<bool> repeating_{false};
  std::atomic<bool> armed_{false};
  std::chrono::steady_clock::time_point next_fire_{};
  std::mutex timing_mu_;
};

}  // namespace gvfi
