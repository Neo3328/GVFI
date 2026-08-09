#include "gvfi/event_source.hpp"
#include "gvfi/work_loop.hpp"

#include <utility>

namespace gvfi {

EventSource::EventSource(std::string name) : name_(std::move(name)) {}

EventSource::~EventSource() = default;

void EventSource::signalWork() {
  work_to_do_.store(true, std::memory_order_release);
  if (loop_) {
    loop_->signalWork();
  }
}

void EventSource::invokeAction() {
  if (action_) {
    action_();
  }
}

bool EventSource::checkForWork() {
  if (!enabled_.load(std::memory_order_acquire)) {
    return false;
  }
  if (!work_to_do_.exchange(false, std::memory_order_acq_rel)) {
    return false;
  }
  invokeAction();
  return work_to_do_.load(std::memory_order_acquire);
}

CommandGate::CommandGate(std::string name) : EventSource(std::move(name)) {}

void CommandGate::submit(Action action) {
  if (!action) {
    return;
  }
  {
    std::lock_guard<std::mutex> lock(mu_);
    queue_.push_back(std::move(action));
  }
  signalWork();
}

bool CommandGate::checkForWork() {
  if (!enabled_.load(std::memory_order_acquire)) {
    return false;
  }
  std::vector<Action> batch;
  {
    std::lock_guard<std::mutex> lock(mu_);
    batch.swap(queue_);
  }
  for (auto& fn : batch) {
    if (fn) {
      fn();
    }
  }
  std::lock_guard<std::mutex> lock(mu_);
  return !queue_.empty();
}

TimerEventSource::TimerEventSource(std::string name)
    : EventSource(std::move(name)) {}

void TimerEventSource::setIntervalMs(std::uint64_t interval_ms) {
  interval_ms_.store(interval_ms, std::memory_order_release);
}

void TimerEventSource::arm(bool repeating) {
  repeating_.store(repeating, std::memory_order_release);
  const auto ms = interval_ms_.load(std::memory_order_acquire);
  {
    std::lock_guard<std::mutex> lock(timing_mu_);
    next_fire_ = std::chrono::steady_clock::now() +
                 std::chrono::milliseconds(ms);
  }
  armed_.store(true, std::memory_order_release);
  signalWork();
}

void TimerEventSource::cancel() {
  armed_.store(false, std::memory_order_release);
}

bool TimerEventSource::checkForWork() {
  if (!enabled_.load(std::memory_order_acquire) ||
      !armed_.load(std::memory_order_acquire)) {
    return false;
  }
  const auto now = std::chrono::steady_clock::now();
  bool fire = false;
  {
    std::lock_guard<std::mutex> lock(timing_mu_);
    if (now >= next_fire_) {
      fire = true;
      if (repeating_.load(std::memory_order_acquire)) {
        next_fire_ =
            now + std::chrono::milliseconds(
                      interval_ms_.load(std::memory_order_acquire));
      } else {
        armed_.store(false, std::memory_order_release);
      }
    }
  }
  if (fire) {
    invokeAction();
  }
  // Keep the loop awake while a timer is armed (cheap poll).
  if (armed_.load(std::memory_order_acquire) && loop_) {
    loop_->signalWork();
  }
  return false;
}

}  // namespace gvfi
