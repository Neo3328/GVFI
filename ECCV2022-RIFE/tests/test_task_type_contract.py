"""task_type (interp / sr / both) parameter-mapping contract tests.

Covers `gvfi_api._settings_to_worker_params` behavior introduced by the
"split interpolation and super-resolution tasks" feature:
- both:  original behavior (RIFE + optional Real-ESRGAN)
- interp: RIFE only; super-resolution is forcibly disabled and resolution
          collapses to "source" regardless of what the UI sent
- sr:     Real-ESRGAN only; the VideoWorker keeps the source fps and copies
          raw frames straight through the RIFE stage
- unknown values fall back to "both"
"""
from __future__ import annotations

import os
import sys

import pytest

ENGINE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)

from gvfi_api import _settings_to_worker_params  # noqa: E402

TOOLS = {"rife_models": {}}


def _params(**overrides):
    settings = {"fps": 60, "superResolution": True, "resolution": "1080p"}
    settings.update(overrides)
    return _settings_to_worker_params(settings, TOOLS)


class TestTaskTypeContract:
    def test_default_is_both_when_absent(self):
        # No task_type key supplied — verify the default branch.
        out = _settings_to_worker_params(
            {"fps": 60, "superResolution": True, "resolution": "1080p"}, TOOLS
        )
        assert out["task_type"] == "both"
        assert out["superResolution"] is True

    def test_both_keeps_super_resolution_and_scale(self):
        out = _params(task_type="both", resolution="1080p")
        assert out["task_type"] == "both"
        assert out["superResolution"] is True
        assert out["scale"] == "2x"

    @pytest.mark.parametrize("requested_resolution", ["1080p", "4k", "1440p"])
    def test_interp_forces_sr_off_and_source_resolution(self, requested_resolution):
        out = _params(
            task_type="interp",
            superResolution=True,  # UI may still send True; backend must override.
            resolution=requested_resolution,
        )
        assert out["task_type"] == "interp"
        assert out["superResolution"] is False
        assert out["resolution"] == "source"
        assert out["scale"] == "原始"

    def test_sr_keeps_super_resolution_enabled(self):
        out = _params(task_type="sr", resolution="1080p")
        assert out["task_type"] == "sr"
        assert out["superResolution"] is True
        assert out["scale"] == "2x"

    def test_sr_respects_explicit_super_resolution_off(self):
        out = _params(task_type="sr", superResolution=False, resolution="1080p")
        assert out["task_type"] == "sr"
        # User explicitly disabled SR — task_type alone must not re-enable it.
        assert out["superResolution"] is False
        assert out["scale"] == "原始"

    @pytest.mark.parametrize("bad_value", ["", "BOTH", "interpolation", "sr-only", "none", "all"])
    def test_unknown_task_type_falls_back_to_both(self, bad_value):
        out = _params(task_type=bad_value)
        assert out["task_type"] == "both"

    def test_case_insensitive_task_type(self):
        out = _params(task_type="INTERP", resolution="4k")
        assert out["task_type"] == "interp"
        assert out["superResolution"] is False

    def test_interp_does_not_mutate_other_contract_fields(self):
        out = _params(task_type="interp", model="rife-v4.6", fps=120, quality=0.9)
        assert out["model"] == "rife-v4.6"
        assert out["fps"] == "120"
        # CRF mapping must remain intact regardless of task_type.
        assert isinstance(out["crf"], int)
