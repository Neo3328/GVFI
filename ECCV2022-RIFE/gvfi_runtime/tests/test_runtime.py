#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unit tests for gvfi_runtime (WorkLoop / ZonePool / MemoryPressure)."""

from __future__ import annotations

import os
import sys
import threading
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)  # .../gvfi_runtime
ENGINE_ROOT = os.path.dirname(PKG)  # .../ECCV2022-RIFE
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime import (  # noqa: E402
    CommandGate,
    MemoryPressureMonitor,
    NativeWorkLoop,
    NativeZonePool,
    PressureLevel,
    TimerEventSource,
    WorkLoop,
    WorkStatus,
    ZonePool,
    native_available,
    native_memory_sample,
    native_version,
)


class TestWorkLoop(unittest.TestCase):
    def test_command_gate_and_run_on_loop(self) -> None:
        loop = WorkLoop()
        self.assertTrue(loop.start())
        hits = []
        gate = CommandGate("g")
        self.assertEqual(loop.add_event_source(gate), WorkStatus.Ok)
        gate.submit(lambda: hits.append(1))
        gate.submit(lambda: hits.append(2))
        deadline = time.time() + 2.0
        while len(hits) < 2 and time.time() < deadline:
            time.sleep(0.01)
        self.assertEqual(hits, [1, 2])

        on_loop = {"ok": False}

        def mark() -> None:
            on_loop["ok"] = loop.on_loop_thread()
            hits.append(3)

        self.assertEqual(loop.run_on_loop(mark), WorkStatus.Ok)
        self.assertTrue(on_loop["ok"])
        self.assertEqual(hits[-1], 3)

        ticks = []
        timer = TimerEventSource("t")
        timer.set_action(lambda: ticks.append(1))
        timer.set_interval_ms(20)
        self.assertEqual(loop.add_event_source(timer), WorkStatus.Ok)
        timer.arm(repeating=False)
        deadline = time.time() + 2.0
        while not ticks and time.time() < deadline:
            time.sleep(0.01)
        self.assertGreaterEqual(len(ticks), 1)
        loop.stop()
        self.assertFalse(loop.is_running)


class TestZonePool(unittest.TestCase):
    def test_alloc_free(self) -> None:
        pool = ZonePool(64, 8)
        ptrs = [pool.alloc() for _ in range(20)]
        self.assertEqual(pool.allocated_count, 20)
        self.assertGreaterEqual(pool.slab_count, 3)
        for p in ptrs:
            pool.free(p)
        self.assertEqual(pool.allocated_count, 0)
        self.assertGreaterEqual(pool.free_count, 20)


class TestMemoryPressure(unittest.TestCase):
    def test_sample(self) -> None:
        mon = MemoryPressureMonitor()
        mon.set_thresholds(70, 95)
        snap = mon.sample()
        self.assertGreater(snap.total_phys_bytes, 0)
        self.assertLessEqual(snap.memory_load_percent, 100)
        self.assertIsInstance(snap.level, PressureLevel)
        self.assertTrue(mon.start(100))
        time.sleep(0.15)
        mon.stop()


class TestNativeBridge(unittest.TestCase):
    def test_native_dll_hot_path(self) -> None:
        self.assertTrue(native_available(), "gvfi_native.dll missing under native_bin/")
        self.assertEqual(native_version(), "gvfi_native/0.2.0")
        snap = native_memory_sample(70, 95)
        self.assertIsNotNone(snap)
        assert snap is not None
        self.assertGreater(snap["total_phys_mb"], 0)
        self.assertEqual(snap["runtime"], "gvfi_native")

        loop = NativeWorkLoop()
        self.assertTrue(loop.start())
        hits: list[int] = []
        gate = loop.create_gate("py")
        gate.submit(lambda: hits.append(1))
        deadline = time.time() + 2.0
        while not hits and time.time() < deadline:
            time.sleep(0.01)
        self.assertEqual(hits, [1])
        gate.close()
        loop.close()

        zone = NativeZonePool(64, 8)
        a = zone.alloc()
        b = zone.alloc()
        self.assertTrue(a)
        self.assertTrue(b)
        self.assertNotEqual(a, b)
        zone.free(a)
        zone.free(b)
        zone.close()


if __name__ == "__main__":
    unittest.main()
