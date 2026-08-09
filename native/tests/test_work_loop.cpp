#include "gvfi/work_loop.hpp"
#include "gvfi/event_source.hpp"

#include <atomic>
#include <chrono>
#include <iostream>
#include <thread>

using namespace gvfi;
using namespace std::chrono_literals;

static int g_failures = 0;

#define EXPECT(cond)                                                           \
  do {                                                                         \
    if (!(cond)) {                                                             \
      std::cerr << "FAIL: " << #cond << " @ " << __FILE__ << ":" << __LINE__   \
                << "\n";                                                       \
      ++g_failures;                                                            \
    }                                                                          \
  } while (0)

int main() {
  WorkLoop loop;
  EXPECT(loop.start());

  std::atomic<int> hits{0};
  auto gate = std::make_shared<CommandGate>("test-gate");
  gate->setAction([&] { /* unused default */ });
  EXPECT(loop.addEventSource(gate) == WorkStatus::Ok);

  gate->submit([&] { hits.fetch_add(1); });
  gate->submit([&] { hits.fetch_add(1); });

  for (int i = 0; i < 50 && hits.load() < 2; ++i) {
    std::this_thread::sleep_for(10ms);
  }
  EXPECT(hits.load() == 2);

  std::atomic<bool> on_loop{false};
  EXPECT(loop.runOnLoop([&] {
    on_loop = loop.onLoopThread();
    hits.fetch_add(1);
  }) == WorkStatus::Ok);
  EXPECT(on_loop.load());
  EXPECT(hits.load() == 3);

  auto timer = std::make_shared<TimerEventSource>("tick");
  std::atomic<int> ticks{0};
  timer->setAction([&] { ticks.fetch_add(1); });
  timer->setIntervalMs(20);
  EXPECT(loop.addEventSource(timer) == WorkStatus::Ok);
  timer->arm(false);
  for (int i = 0; i < 100 && ticks.load() < 1; ++i) {
    std::this_thread::sleep_for(10ms);
  }
  EXPECT(ticks.load() >= 1);

  loop.stop();
  EXPECT(!loop.isRunning());

  if (g_failures == 0) {
    std::cout << "test_work_loop: PASS\n";
    return 0;
  }
  std::cerr << "test_work_loop: " << g_failures << " failure(s)\n";
  return 1;
}
