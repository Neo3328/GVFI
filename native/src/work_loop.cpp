#include "gvfi/work_loop.hpp"

#include <algorithm>
#include <utility>

namespace gvfi {

WorkLoop::WorkLoop() = default;

WorkLoop::~WorkLoop() { stop(); }

bool WorkLoop::start() {
  if (running_.exchange(true)) {
    return true;
  }
  terminate_.store(false, std::memory_order_release);
  work_pending_.store(true, std::memory_order_release);
  worker_ = std::thread([this] { threadMain(); });
  return true;
}

void WorkLoop::stop() {
  if (!running_.load(std::memory_order_acquire)) {
    return;
  }
  terminate_.store(true, std::memory_order_release);
  signalWork();
  if (worker_.joinable()) {
    worker_.join();
  }
  running_.store(false, std::memory_order_release);
  worker_id_ = {};
}

WorkStatus WorkLoop::addEventSource(std::shared_ptr<EventSource> source) {
  if (!source) {
    return WorkStatus::Error;
  }
  closeGate();
  source->setWorkLoop(this);
  sources_.push_back(std::move(source));
  openGate();
  signalWork();
  return WorkStatus::Ok;
}

WorkStatus WorkLoop::removeEventSource(EventSource* source) {
  if (!source) {
    return WorkStatus::Error;
  }
  closeGate();
  sources_.erase(
      std::remove_if(sources_.begin(), sources_.end(),
                     [source](const std::shared_ptr<EventSource>& s) {
                       if (s.get() == source) {
                         s->setWorkLoop(nullptr);
                         return true;
                       }
                       return false;
                     }),
      sources_.end());
  openGate();
  signalWork();
  return WorkStatus::Ok;
}

void WorkLoop::signalWork() {
  {
    std::lock_guard<std::mutex> lock(wake_mu_);
    work_pending_.store(true, std::memory_order_release);
  }
  wake_cv_.notify_one();
}

WorkStatus WorkLoop::runOnLoop(std::function<void()> fn) {
  if (!fn) {
    return WorkStatus::Error;
  }
  if (onLoopThread()) {
    closeGate();
    fn();
    openGate();
    return WorkStatus::Ok;
  }
  auto gate = std::make_shared<CommandGate>("run-on-loop");
  std::mutex done_mu;
  std::condition_variable done_cv;
  bool done = false;
  WorkStatus status = WorkStatus::Ok;

  gate->submit([&] {
    try {
      fn();
    } catch (...) {
      status = WorkStatus::Error;
    }
    {
      std::lock_guard<std::mutex> lock(done_mu);
      done = true;
    }
    done_cv.notify_one();
  });
  addEventSource(gate);
  {
    std::unique_lock<std::mutex> lock(done_mu);
    done_cv.wait(lock, [&] { return done || terminate_.load(); });
  }
  removeEventSource(gate.get());
  return terminate_.load() ? WorkStatus::Aborted : status;
}

bool WorkLoop::onLoopThread() const noexcept {
  return std::this_thread::get_id() == worker_id_;
}

void WorkLoop::closeGate() { gate_.lock(); }

void WorkLoop::openGate() { gate_.unlock(); }

bool WorkLoop::runEventSources() {
  closeGate();
  if (terminate_.load(std::memory_order_acquire)) {
    openGate();
    return false;
  }

  bool more = false;
  do {
    more = false;
    work_pending_.store(false, std::memory_order_release);
    for (auto& src : sources_) {
      if (terminate_.load(std::memory_order_acquire)) {
        openGate();
        return false;
      }
      if (src && src->enabled()) {
        more = src->checkForWork() || more;
      }
    }
  } while (more);

  openGate();
  return true;
}

void WorkLoop::threadMain() {
  worker_id_ = std::this_thread::get_id();
  for (;;) {
    if (!runEventSources()) {
      break;
    }
    std::unique_lock<std::mutex> lock(wake_mu_);
    wake_cv_.wait(lock, [&] {
      return work_pending_.load(std::memory_order_acquire) ||
             terminate_.load(std::memory_order_acquire);
    });
    if (terminate_.load(std::memory_order_acquire) &&
        !work_pending_.load(std::memory_order_acquire)) {
      // Drain once more then exit.
      lock.unlock();
      if (!runEventSources()) {
        break;
      }
      if (terminate_.load(std::memory_order_acquire)) {
        break;
      }
    }
  }
  running_.store(false, std::memory_order_release);
}

}  // namespace gvfi
