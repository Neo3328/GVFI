#include "gvfi/zone_pool.hpp"

#include <algorithm>
#include <cstring>

namespace gvfi {

namespace {
std::size_t alignUp(std::size_t value, std::size_t align) {
  return (value + align - 1) & ~(align - 1);
}
}  // namespace

ZonePool::ZonePool(std::size_t object_size, std::size_t objects_per_slab)
    : object_size_(alignUp(std::max(object_size, sizeof(FreeNode)),
                           alignof(std::max_align_t))),
      objects_per_slab_(std::max<std::size_t>(objects_per_slab, 1)),
      slab_bytes_(object_size_ * objects_per_slab_) {}

ZonePool::~ZonePool() {
  std::lock_guard<std::mutex> lock(mu_);
  for (void* slab : slabs_) {
    if (slab) {
      VirtualFree(slab, 0, MEM_RELEASE);
    }
  }
  slabs_.clear();
  free_list_ = nullptr;
  allocated_ = 0;
  free_count_ = 0;
}

void ZonePool::grow() {
  void* slab = VirtualAlloc(nullptr, slab_bytes_, MEM_COMMIT | MEM_RESERVE,
                            PAGE_READWRITE);
  if (!slab) {
    throw std::bad_alloc();
  }
  slabs_.push_back(slab);
  auto* bytes = static_cast<std::uint8_t*>(slab);
  for (std::size_t i = 0; i < objects_per_slab_; ++i) {
    auto* node = reinterpret_cast<FreeNode*>(bytes + i * object_size_);
    node->next = free_list_;
    free_list_ = node;
    ++free_count_;
  }
}

void* ZonePool::alloc() {
  std::lock_guard<std::mutex> lock(mu_);
  if (!free_list_) {
    grow();
  }
  FreeNode* node = free_list_;
  free_list_ = node->next;
  --free_count_;
  ++allocated_;
  return node;
}

void ZonePool::free(void* ptr) {
  if (!ptr) {
    return;
  }
  std::lock_guard<std::mutex> lock(mu_);
  auto* node = static_cast<FreeNode*>(ptr);
  node->next = free_list_;
  free_list_ = node;
  ++free_count_;
  if (allocated_ > 0) {
    --allocated_;
  }
}

std::size_t ZonePool::allocatedCount() const {
  std::lock_guard<std::mutex> lock(mu_);
  return allocated_;
}

std::size_t ZonePool::freeCount() const {
  std::lock_guard<std::mutex> lock(mu_);
  return free_count_;
}

std::size_t ZonePool::slabCount() const {
  std::lock_guard<std::mutex> lock(mu_);
  return slabs_.size();
}

}  // namespace gvfi
