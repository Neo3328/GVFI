from __future__ import annotations

import unittest

from gvfi_runtime.resource_monitor import ResourceSnapshot, process_memory, summarize_resources


class ResourceMonitorTests(unittest.TestCase):
    def test_current_process_memory_is_available(self) -> None:
        rss, private = process_memory()
        self.assertGreater(rss, 0)
        self.assertGreater(private, 0)

    def test_summary_reports_deltas_and_peaks(self) -> None:
        samples = [
            ResourceSnapshot(1.0, 100, 200, 300, 10.0),
            ResourceSnapshot(2.0, 150, 260, 340, 30.0),
            ResourceSnapshot(3.0, 120, 230, 320, 20.0),
        ]
        summary = summarize_resources(samples)
        self.assertEqual(summary["rss_delta_bytes"], 20)
        self.assertEqual(summary["rss_peak_bytes"], 150)
        self.assertEqual(summary["private_delta_bytes"], 30)
        self.assertEqual(summary["gpu_memory_peak_mib"], 340)
        self.assertEqual(summary["gpu_utilization_average_percent"], 20.0)


if __name__ == "__main__":
    unittest.main()
