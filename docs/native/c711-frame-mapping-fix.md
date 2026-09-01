# C7.1.1 — Native end-frame mapping + failure-detail fix

**Date:** 2026-08-12  
**Follows:** C7.1 FAIL (duplicate Native frames 46==47)

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

## Changes

1. `ECCV2022-RIFE/gvfi_runtime/interpolator_backend.py`
   - Added `map_native_directory_sample()` with inclusive mapping  
     `position = output_index * (input_count - 1) / (output_count - 1)`
   - `NativeInterpolatorBackend.process_directory` uses it
2. `ECCV2022-RIFE/main.py`
   - `_emit_failure_detail`: `getattr(exc, "__traceback__", None)` (avoids class name-mangling / broken `exc.__traceback()` access)
3. Tests: `ECCV2022-RIFE/tests/test_c711_frame_mapping.py`

## Results

- Unit mapping tests: PASS (24→48/72, 30→60, 24→24; emit_failure_detail)
- C7.1 F: PASS 10/10 (dups=0)
- C7.1 G: PASS (no Native dups; last-frame MAE ≈ 0.20)
- Full C7.1 A–G: ALL PASS
- Default `backend_mode`: still `cli`
- C7.2: not executed; functionally ready for C7.2 **discussion only** (C6.5/C6.6 still show no ≥15% perf reason to switch default)
