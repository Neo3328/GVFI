from __future__ import annotations

import threading
from typing import List, Optional


class ZonePool:
    """Fixed-size object pool (zone allocator design idea)."""

    def __init__(self, object_size: int, objects_per_slab: int = 64) -> None:
        self.object_size = max(int(object_size), 1)
        self.objects_per_slab = max(int(objects_per_slab), 1)
        self._free: List[bytearray] = []
        self._slabs: List[List[bytearray]] = []
        self._allocated = 0
        self._lock = threading.Lock()

    def _grow(self) -> None:
        slab = [bytearray(self.object_size) for _ in range(self.objects_per_slab)]
        self._slabs.append(slab)
        self._free.extend(slab)

    def alloc(self) -> bytearray:
        with self._lock:
            if not self._free:
                self._grow()
            obj = self._free.pop()
            self._allocated += 1
            return obj

    def free(self, obj: Optional[bytearray]) -> None:
        if obj is None:
            return
        with self._lock:
            self._free.append(obj)
            if self._allocated > 0:
                self._allocated -= 1

    @property
    def allocated_count(self) -> int:
        with self._lock:
            return self._allocated

    @property
    def free_count(self) -> int:
        with self._lock:
            return len(self._free)

    @property
    def slab_count(self) -> int:
        with self._lock:
            return len(self._slabs)
