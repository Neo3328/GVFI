#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tests for JobStageOrchestrator."""

from __future__ import annotations

import os
import sys
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
ENGINE_ROOT = os.path.dirname(PKG)
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_runtime.job_orchestrator import JobStageOrchestrator  # noqa: E402


class TestJobStageOrchestrator(unittest.TestCase):
    def test_stage_pipeline_events(self) -> None:
        orch = JobStageOrchestrator()
        self.assertTrue(orch.start())
        updates = []
        logs = []
        finished = []

        orch.set_handlers(
            on_update=lambda jid, **fields: updates.append((jid, fields)),
            on_log=lambda jid, line: logs.append((jid, line)),
            on_finish=lambda jid, ok, msg: finished.append((jid, ok, msg)),
        )
        orch.bind_job("job1", stage="queued")
        orch.post_log("job1", "[1/4] 抽帧")
        orch.post_progress("job1", 0.25)
        orch.post_log("job1", "[2/4] RIFE")
        orch.post_progress("job1", 0.55)
        orch.post_log("job1", "[3/4] 超分 ESRGAN")
        orch.post_log("job1", "[4/4] FFmpeg 合成")
        orch.post_finished("job1", True, "完成")

        deadline = time.time() + 3.0
        while time.time() < deadline:
            if finished:
                break
            time.sleep(0.02)

        self.assertTrue(finished)
        self.assertEqual(finished[0][0], "job1")
        self.assertTrue(finished[0][1])
        stages = [u[1].get("stage") for u in updates if "stage" in u[1]]
        self.assertIn("extract", stages)
        self.assertIn("rife", stages)
        self.assertIn("upsample", stages)
        self.assertIn("encode", stages)
        self.assertTrue(any(l[1].startswith("[1/4]") for l in logs))
        self.assertIn(orch.backend, ("gvfi_native", "gvfi_runtime"))
        orch.stop()

    def test_infer_stage(self) -> None:
        orch = JobStageOrchestrator()
        self.assertEqual(orch.infer_stage_from_log("[1/4] extract"), "extract")
        self.assertEqual(orch.infer_stage_from_log("running rife vulkan"), "rife")
        self.assertEqual(orch.infer_stage_from_log("Real-ESRGAN 超分"), "upsample")
        self.assertEqual(orch.infer_stage_from_log("FFmpeg 合成"), "encode")


if __name__ == "__main__":
    unittest.main()
