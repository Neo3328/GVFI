#include "gvfi/zone_pool.hpp"

#include <iostream>
#include <vector>

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
  gvfi::ZonePool pool(64, 8);
  std::vector<void*> ptrs;
  for (int i = 0; i < 20; ++i) {
    void* p = pool.alloc();
    EXPECT(p != nullptr);
    ptrs.push_back(p);
  }
  EXPECT(pool.allocatedCount() == 20);
  EXPECT(pool.slabCount() >= 3);

  for (void* p : ptrs) {
    pool.free(p);
  }
  EXPECT(pool.allocatedCount() == 0);
  EXPECT(pool.freeCount() >= 20);

  void* a = pool.alloc();
  void* b = pool.alloc();
  EXPECT(a != b);
  pool.free(a);
  pool.free(b);

  if (g_failures == 0) {
    std::cout << "test_zone_pool: PASS\n";
    return 0;
  }
  std::cerr << "test_zone_pool: " << g_failures << " failure(s)\n";
  return 1;
}
