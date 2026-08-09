#include "gvfi/memory_pressure.hpp"

#include <iostream>

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
  gvfi::MemoryPressureMonitor mon;
  mon.setThresholds(70, 95);
  const auto snap = mon.sample();
  EXPECT(snap.total_phys_bytes > 0);
  EXPECT(snap.memory_load_percent <= 100);

  bool started = mon.start(200);
  EXPECT(started);
  mon.stop();

  if (g_failures == 0) {
    std::cout << "test_memory_pressure: PASS\n";
    return 0;
  }
  std::cerr << "test_memory_pressure: " << g_failures << " failure(s)\n";
  return 1;
}
