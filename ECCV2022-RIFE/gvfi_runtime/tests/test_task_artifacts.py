from __future__ import annotations

import json
import os
import tempfile
import unittest
from unittest.mock import patch

from gvfi_runtime.task_artifacts import (
    DiskEstimate,
    InsufficientDiskSpaceError,
    require_disk_space,
    reserve_output_path,
    validate_output_video,
    write_task_report,
    estimate_disk_space,
)


class TaskArtifactTests(unittest.TestCase):
    def test_output_path_never_overwrites_existing_file(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            original = os.path.join(root, "video_enhanced.mp4")
            first = os.path.join(root, "video_enhanced_001.mp4")
            open(original, "wb").close()
            open(first, "wb").close()
            self.assertEqual(
                reserve_output_path(root, "video_enhanced.mp4"),
                os.path.join(root, "video_enhanced_002.mp4"),
            )

    def test_insufficient_disk_space_is_explicit(self) -> None:
        estimate = DiskEstimate(200, 100, 10, 20, 2)
        with self.assertRaises(InsufficientDiskSpaceError):
            require_disk_space(estimate)

    def test_super_resolution_estimate_only_scales_sr_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            with patch("gvfi_runtime.task_artifacts.shutil.disk_usage") as usage:
                usage.return_value.free = 10**12
                estimate = estimate_disk_space(root, 10, 10, 2, 4, scale_factor=2)
            # (2 raw + 4 RIFE + 4*4 SR) * 300 bytes * 1.25
            self.assertEqual(estimate.required_bytes, 8250)

    def test_report_is_valid_json_and_atomic_temp_is_removed(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            path = write_task_report(root, "abc", {"status": "failed", "reason": "test"})
            with open(path, "r", encoding="utf-8") as handle:
                self.assertEqual(json.load(handle)["status"], "failed")
            self.assertEqual([name for name in os.listdir(root) if name.endswith(".tmp")], [])

    def test_missing_output_fails_validation(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "missing or empty"):
            validate_output_video("ffprobe", "does-not-exist.mp4")


if __name__ == "__main__":
    unittest.main()
