from __future__ import annotations

import unittest
from dataclasses import FrozenInstanceError

from gvfi_runtime.errors import BackendRuntimeError, ErrorCode
from gvfi_runtime.runtime_config import ConfigurationError, RuntimeConfig


class RuntimeConfigTests(unittest.TestCase):
    def test_defaults_keep_production_modes(self) -> None:
        config = RuntimeConfig.from_mapping({})
        self.assertEqual(config.backend_mode, "cli")
        self.assertEqual(config.pipeline_mode, "disk")

    def test_normalizes_types_and_preserves_extension_keys(self) -> None:
        source = {"fps": "48", "keep_audio": "false", "custom": "kept"}
        config = RuntimeConfig.from_mapping(source)
        merged = config.apply_to(source)
        self.assertEqual(config.fps, 48.0)
        self.assertFalse(config.keep_audio)
        self.assertEqual(merged["custom"], "kept")

    def test_snapshot_is_immutable(self) -> None:
        config = RuntimeConfig.from_mapping({})
        with self.assertRaises(FrozenInstanceError):
            config.backend_mode = "native"

    def test_rejects_invalid_modes_and_ranges(self) -> None:
        for values in ({"backend_mode": "magic"}, {"pipeline_mode": "pipe"}, {"fps": 0}, {"queue_size": 0}):
            with self.subTest(values=values), self.assertRaises(ConfigurationError):
                RuntimeConfig.from_mapping(values)

    def test_configuration_error_has_stable_code(self) -> None:
        with self.assertRaises(ConfigurationError) as raised:
            RuntimeConfig.from_mapping({"backend_mode": "magic"})
        self.assertEqual(raised.exception.code, ErrorCode.CONFIG_ERROR)

    def test_structured_error_contract(self) -> None:
        error = BackendRuntimeError("forward failed", stage="inference", details={"gpu": 0})
        self.assertEqual(error.to_dict(), {
            "code": ErrorCode.BACKEND_ERROR.value,
            "stage": "inference",
            "message": "forward failed",
            "details": {"gpu": 0},
        })


if __name__ == "__main__":
    unittest.main()
