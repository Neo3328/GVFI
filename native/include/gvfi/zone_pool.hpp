#pragma once
// Fixed-size slab pool — design inspired by XNU zone allocator (zalloc).
// Uses VirtualAlloc for large slabs; no APSL code.

#include <cstddef>
#include <cstdint>
#include <mutex>
#include <new>
#include <vector>

#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>

namespace gvfi {

class ZonePool {
 public:
  ZonePool(std::size_t object_size, std::size_t objects_per_slab);
  ~ZonePool();

  ZonePool(const ZonePool&) = delete;
  ZonePool& operator=(const ZonePool&) = delete;

  void* alloc();
  void free(void* ptr);

  std::size_t objectSize() const noexcept { return object_size_; }
  std::size_t allocatedCount() const;
  std::size_t freeCount() const;
  std::size_t slabCount() const;

 private:
  struct FreeNode {
    FreeNode* next;
  };

  void grow();

  std::size_t object_size_;
  std::size_t objects_per_slab_;
  std::size_t slab_bytes_;
  mutable std::mutex mu_;
  FreeNode* free_list_{nullptr};
  std::vector<void*> slabs_;
  std::size_t allocated_{0};
  std::size_t free_count_{0};
};

}  // namespace gvfi
