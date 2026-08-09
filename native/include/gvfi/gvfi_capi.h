#pragma once
// Stable C ABI for Python ctypes / other FFI. Windows DLL export.

#ifdef _WIN32
#  ifdef GVFI_NATIVE_EXPORTS
#    define GVFI_API __declspec(dllexport)
#  else
#    define GVFI_API __declspec(dllimport)
#  endif
#else
#  define GVFI_API
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef void* gvfi_workloop_t;
typedef void* gvfi_gate_t;
typedef void* gvfi_zone_t;

typedef void (*gvfi_void_fn)(void* user);

GVFI_API const char* gvfi_version(void);

/* WorkLoop */
GVFI_API gvfi_workloop_t gvfi_workloop_create(void);
GVFI_API void gvfi_workloop_destroy(gvfi_workloop_t loop);
GVFI_API int gvfi_workloop_start(gvfi_workloop_t loop);
GVFI_API void gvfi_workloop_stop(gvfi_workloop_t loop);
GVFI_API int gvfi_workloop_is_running(gvfi_workloop_t loop);
GVFI_API void gvfi_workloop_signal(gvfi_workloop_t loop);
GVFI_API int gvfi_workloop_run(gvfi_workloop_t loop, gvfi_void_fn fn, void* user);

/* CommandGate attached to a loop */
GVFI_API gvfi_gate_t gvfi_gate_create(gvfi_workloop_t loop, const char* name);
GVFI_API void gvfi_gate_destroy(gvfi_gate_t gate);
GVFI_API int gvfi_gate_submit(gvfi_gate_t gate, gvfi_void_fn fn, void* user);

/* ZonePool */
GVFI_API gvfi_zone_t gvfi_zone_create(unsigned object_size, unsigned objects_per_slab);
GVFI_API void gvfi_zone_destroy(gvfi_zone_t zone);
GVFI_API void* gvfi_zone_alloc(gvfi_zone_t zone);
GVFI_API void gvfi_zone_free(gvfi_zone_t zone, void* ptr);
GVFI_API unsigned gvfi_zone_allocated(gvfi_zone_t zone);
GVFI_API unsigned gvfi_zone_free_count(gvfi_zone_t zone);

/* Memory pressure one-shot sample */
typedef struct gvfi_memory_snapshot {
  unsigned long long total_phys_bytes;
  unsigned long long avail_phys_bytes;
  unsigned memory_load_percent;
  int level; /* 0 normal, 1 warning, 2 critical */
} gvfi_memory_snapshot_t;

GVFI_API int gvfi_memory_sample(gvfi_memory_snapshot_t* out,
                                unsigned warn_pct,
                                unsigned critical_pct);

#ifdef __cplusplus
}
#endif
