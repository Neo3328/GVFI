#!/usr/bin/env python3
"""C7.3 — static audit: production call chain must stay cli-default and unpolluted."""

from __future__ import annotations

import ast
import inspect
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_ROOT = os.path.dirname(HERE)
REPO_ROOT = os.path.dirname(ENGINE_ROOT)
if ENGINE_ROOT not in sys.path:
    sys.path.insert(0, ENGINE_ROOT)


class TestC73ProductionCallchainAudit(unittest.TestCase):
    def test_default_backend_mode_is_cli(self) -> None:
        from main import VideoWorker
        from gvfi_runtime.interpolator_backend import create_interpolator_backend
        import gvfi_api

        vw_src = inspect.getsource(VideoWorker.__init__)
        self.assertIn('params.get("backend_mode", "cli")', vw_src)
        self.assertNotIn('backend_mode", "native")', vw_src)

        factory_src = inspect.getsource(create_interpolator_backend)
        self.assertIn('str(mode or "cli")', factory_src)

        api_src = inspect.getsource(gvfi_api)
        self.assertIn('or "cli"', api_src)

    def test_cli_backend_class_exists(self) -> None:
        from gvfi_runtime.interpolator_backend import RifeCLIBackend, NativeInterpolatorBackend

        self.assertTrue(issubclass(RifeCLIBackend, object))
        self.assertTrue(hasattr(RifeCLIBackend, "process_directory"))
        self.assertTrue(hasattr(NativeInterpolatorBackend, "process_directory"))
        self.assertTrue(hasattr(NativeInterpolatorBackend, "process_frames"))

    def test_native_backend_does_not_call_batch_or_pipeline(self) -> None:
        from gvfi_runtime import interpolator_backend as ib

        src = inspect.getsource(ib.NativeInterpolatorBackend)
        self.assertNotIn("process_batch", src)
        self.assertNotIn("get_last_batch_profile", src)
        self.assertNotIn("PipelinePocLoader", src)
        self.assertNotIn("gvfi_pipeline", src)
        # Production path uses single-frame library.process
        self.assertIn("self._library.process(", src)
        self.assertIn("map_native_directory_sample", src)

    def test_main_video_worker_does_not_import_batch_poc(self) -> None:
        main_path = os.path.join(ENGINE_ROOT, "main.py")
        with open(main_path, encoding="utf-8") as fh:
            tree = ast.parse(fh.read())
        imported = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                imported.append(node.module)
            if isinstance(node, ast.Import):
                imported.extend(a.name for a in node.names)
        joined = " ".join(imported)
        self.assertNotIn("batch_rife", joined)
        self.assertNotIn("pipeline_rife", joined)

        with open(main_path, encoding="utf-8") as fh:
            text = fh.read()
        self.assertNotIn("process_batch", text)
        self.assertNotIn("get_last_batch_profile", text)
        self.assertNotIn("PipelinePocLoader", text)

    def test_fallback_hook_still_present(self) -> None:
        from main import VideoWorker

        src = inspect.getsource(VideoWorker._ensure_interpolator_backend)
        self.assertIn("_switch_to_cli", src)
        switch = inspect.getsource(VideoWorker._switch_to_cli)
        self.assertIn("native_to_cli", switch)
        self.assertIn('create_interpolator_backend(\n            "cli"', switch)

    def test_emit_failure_detail_uses_getattr_traceback(self) -> None:
        from main import VideoWorker

        src = inspect.getsource(VideoWorker._emit_failure_detail)
        self.assertIn('getattr(exc, "__traceback__", None)', src)
        self.assertNotIn("exc.__traceback__", src)

    def test_c711_frame_mapping_tests_exist(self) -> None:
        path = os.path.join(HERE, "test_c711_frame_mapping.py")
        self.assertTrue(os.path.isfile(path))
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        self.assertIn("map_native_directory_sample", text)
        self.assertIn("test_24_to_48_endpoints_and_no_collapse", text)
        self.assertIn("TestEmitFailureDetailNoNameMangling", text)

    def test_pipeline_poc_loader_is_isolated(self) -> None:
        from gvfi_runtime.native_library import PipelinePocLoader, NativeLibraryLoader

        self.assertIsNot(PipelinePocLoader, NativeLibraryLoader)
        doc = (PipelinePocLoader.__doc__ or "").lower()
        self.assertIn("c6.6", doc)


if __name__ == "__main__":
    unittest.main()
