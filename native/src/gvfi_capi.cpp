#define GVFI_NATIVE_EXPORTS
#include "gvfi/gvfi_capi.h"

#include "gvfi/memory_pressure.hpp"
#include "gvfi/work_loop.hpp"
#include "gvfi/zone_pool.hpp"

#include <memory>
#include <string>

using gvfi::CommandGate;
using gvfi::MemoryPressureMonitor;
using gvfi::MemorySnapshot;
using gvfi::PressureLevel;
using gvfi::WorkLoop;
using gvfi::WorkStatus;
using gvfi::ZonePool;

namespace {

struct GateHandle {
  std::shared_ptr<CommandGate> gate;
  WorkLoop* loop{nullptr};
};

struct Callback {
  gvfi_void_fn fn;
  void* user;
};

}  // namespace

extern "C" {

const char* gvfi_version(void) { return "gvfi_native/0.1.0"; }

gvfi_workloop_t gvfi_workloop_create(void) {
  return reinterpret_cast<gvfi_workloop_t>(new WorkLoop());
}

void gvfi_workloop_destroy(gvfi_workloop_t loop) {
  if (!loop) {
    return;
  }
  auto* wl = reinterpret_cast<WorkLoop*>(loop);
  wl->stop();
  delete wl;
}

int gvfi_workloop_start(gvfi_workloop_t loop) {
  if (!loop) {
    return 0;
  }
  return reinterpret_cast<WorkLoop*>(loop)->start() ? 1 : 0;
}

void gvfi_workloop_stop(gvfi_workloop_t loop) {
  if (!loop) {
    return;
  }
  reinterpret_cast<WorkLoop*>(loop)->stop();
}

int gvfi_workloop_is_running(gvfi_workloop_t loop) {
  if (!loop) {
    return 0;
  }
  return reinterpret_cast<WorkLoop*>(loop)->isRunning() ? 1 : 0;
}

void gvfi_workloop_signal(gvfi_workloop_t loop) {
  if (!loop) {
    return;
  }
  reinterpret_cast<WorkLoop*>(loop)->signalWork();
}

int gvfi_workloop_run(gvfi_workloop_t loop, gvfi_void_fn fn, void* user) {
  if (!loop || !fn) {
    return static_cast<int>(WorkStatus::Error);
  }
  auto* wl = reinterpret_cast<WorkLoop*>(loop);
  const auto st = wl->runOnLoop([fn, user] { fn(user); });
  return static_cast<int>(st);
}

gvfi_gate_t gvfi_gate_create(gvfi_workloop_t loop, const char* name) {
  if (!loop) {
    return nullptr;
  }
  auto* wl = reinterpret_cast<WorkLoop*>(loop);
  auto* handle = new GateHandle();
  handle->loop = wl;
  handle->gate = std::make_shared<CommandGate>(name ? name : "gate");
  wl->addEventSource(handle->gate);
  return reinterpret_cast<gvfi_gate_t>(handle);
}

void gvfi_gate_destroy(gvfi_gate_t gate) {
  if (!gate) {
    return;
  }
  auto* handle = reinterpret_cast<GateHandle*>(gate);
  if (handle->loop && handle->gate) {
    handle->loop->removeEventSource(handle->gate.get());
  }
  delete handle;
}

int gvfi_gate_submit(gvfi_gate_t gate, gvfi_void_fn fn, void* user) {
  if (!gate || !fn) {
    return 0;
  }
  auto* handle = reinterpret_cast<GateHandle*>(gate);
  handle->gate->submit([fn, user] { fn(user); });
  return 1;
}

gvfi_zone_t gvfi_zone_create(unsigned object_size, unsigned objects_per_slab) {
  try {
    return reinterpret_cast<gvfi_zone_t>(
        new ZonePool(object_size, objects_per_slab));
  } catch (...) {
    return nullptr;
  }
}

void gvfi_zone_destroy(gvfi_zone_t zone) {
  if (!zone) {
    return;
  }
  delete reinterpret_cast<ZonePool*>(zone);
}

void* gvfi_zone_alloc(gvfi_zone_t zone) {
  if (!zone) {
    return nullptr;
  }
  try {
    return reinterpret_cast<ZonePool*>(zone)->alloc();
  } catch (...) {
    return nullptr;
  }
}

void gvfi_zone_free(gvfi_zone_t zone, void* ptr) {
  if (!zone) {
    return;
  }
  reinterpret_cast<ZonePool*>(zone)->free(ptr);
}

unsigned gvfi_zone_allocated(gvfi_zone_t zone) {
  if (!zone) {
    return 0;
  }
  return static_cast<unsigned>(
      reinterpret_cast<ZonePool*>(zone)->allocatedCount());
}

unsigned gvfi_zone_free_count(gvfi_zone_t zone) {
  if (!zone) {
    return 0;
  }
  return static_cast<unsigned>(reinterpret_cast<ZonePool*>(zone)->freeCount());
}

int gvfi_memory_sample(gvfi_memory_snapshot_t* out,
                       unsigned warn_pct,
                       unsigned critical_pct) {
  if (!out) {
    return 0;
  }
  MemoryPressureMonitor mon;
  mon.setThresholds(warn_pct ? warn_pct : 75, critical_pct ? critical_pct : 90);
  const MemorySnapshot snap = mon.sample();
  out->total_phys_bytes = snap.total_phys_bytes;
  out->avail_phys_bytes = snap.avail_phys_bytes;
  out->memory_load_percent = snap.memory_load_percent;
  out->level = static_cast<int>(snap.level);
  return 1;
}

}  // extern "C"
