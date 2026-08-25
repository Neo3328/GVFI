"""Ordered scene task scheduler for the file-based RIFE CLI backend."""

from __future__ import annotations

import queue
import threading
import time
from dataclasses import dataclass
from typing import Callable, Optional, Sequence, Tuple


class SceneContractError(ValueError):
    """Raised before scheduling when scene ranges or ordering are unsafe."""


@dataclass(frozen=True)
class SceneTask:
    scene_index: int
    input_frames: Tuple[str, ...]
    input_path: str
    output_path: str
    final_output_path: str
    output_start_index: int
    target_frames: int
    model: str
    gpu: int
    resolution: Tuple[int, int]
    requires_inference: bool = True

    @property
    def compatibility_key(self) -> Tuple[str, int, Tuple[int, int]]:
        return self.model, self.gpu, self.resolution

    @property
    def expected_output_frames(self) -> int:
        return self.target_frames if self.requires_inference else len(self.input_frames)

    @property
    def output_end_index(self) -> int:
        return self.output_start_index + self.expected_output_frames


@dataclass(frozen=True)
class SceneProcessResult:
    """Optional process callback result for actual model-load accounting."""

    model_loaded: bool = True


def validate_scene_tasks(tasks: Sequence[SceneTask]) -> None:
    seen_indices = set()
    previous_scene_index = None
    next_output_by_path = {}
    for task in tasks:
        if task.scene_index in seen_indices:
            raise SceneContractError(f"duplicate scene_index: {task.scene_index}")
        if previous_scene_index is not None and task.scene_index <= previous_scene_index:
            raise SceneContractError("scene tasks must be strictly ordered")
        if not task.input_frames:
            raise SceneContractError(f"scene {task.scene_index} has no input frames")
        if task.target_frames <= 0 or task.expected_output_frames <= 0:
            raise SceneContractError(f"scene {task.scene_index} has invalid output count")
        if task.output_start_index <= 0:
            raise SceneContractError(f"scene {task.scene_index} has invalid output start")
        if any(int(value) <= 0 for value in task.resolution):
            raise SceneContractError(f"scene {task.scene_index} has invalid resolution")
        if task.input_path == task.output_path:
            raise SceneContractError(f"scene {task.scene_index} reuses input as output")
        expected_start = next_output_by_path.get(task.final_output_path)
        if expected_start is not None and task.output_start_index != expected_start:
            raise SceneContractError(
                f"scene {task.scene_index} output range is not contiguous: "
                f"expected {expected_start}, got {task.output_start_index}"
            )
        next_output_by_path[task.final_output_path] = task.output_end_index
        seen_indices.add(task.scene_index)
        previous_scene_index = task.scene_index


class SceneTaskQueue:
    """Bounded FIFO queue that drains queued scenes before reporting closure."""

    def __init__(self, maxsize: int = 2) -> None:
        if int(maxsize) <= 0:
            raise ValueError("maxsize must be positive")
        self.maxsize = int(maxsize)
        self._queue: "queue.Queue[SceneTask]" = queue.Queue(maxsize=self.maxsize)
        self._closed = threading.Event()

    def put(self, task: SceneTask, cancel: Optional[threading.Event] = None) -> None:
        while not self._closed.is_set() and not (cancel and cancel.is_set()):
            try:
                self._queue.put(task, timeout=0.1)
                return
            except queue.Full:
                continue
        raise RuntimeError("scene task queue is closed")

    def get(self, timeout: float = 0.1) -> Optional[SceneTask]:
        while True:
            if self._closed.is_set() and self._queue.empty():
                return None
            try:
                return self._queue.get(timeout=timeout)
            except queue.Empty:
                if self._closed.is_set():
                    return None

    def close(self) -> None:
        self._closed.set()


@dataclass
class RifeWorkerStats:
    worker_start: int = 0
    scene_count: int = 0
    model_reload_count: int = 0
    scene_process_count: int = 0
    compatibility_switch_count: int = 0
    scheduling_time: float = 0.0
    worker_idle_time: float = 0.0

    def format_log(self) -> str:
        return (
            "RIFE WORKER:\n"
            f"worker_start={self.worker_start}\n"
            f"scene_count={self.scene_count}\n"
            f"model_reload_count={self.model_reload_count}\n"
            f"scene_process_count={self.scene_process_count}\n"
            f"compatibility_switch_count={self.compatibility_switch_count}\n"
            f"worker_idle_time={self.worker_idle_time:.3f}s\n"
            f"scheduling_time={self.scheduling_time:.3f}s"
        )


StageFn = Callable[[SceneTask], None]
ProcessFn = Callable[[SceneTask], Optional[SceneProcessResult]]
CollectFn = Callable[[SceneTask], None]
StopFn = Optional[Callable[[], None]]


class RifeWorkerManager:
    """Overlap scene staging while preserving one ordered RIFE consumer."""

    def __init__(self, queue_size: int = 2) -> None:
        self.queue_size = max(1, int(queue_size))
        self._states_lock = threading.Lock()
        self._states = {}

    def state_snapshot(self) -> dict[int, str]:
        with self._states_lock:
            return dict(self._states)

    def _set_state(self, scene_index: int, state: str) -> None:
        with self._states_lock:
            self._states[int(scene_index)] = state

    def run(
        self,
        tasks: Sequence[SceneTask],
        *,
        stage: StageFn,
        process: ProcessFn,
        collect: CollectFn,
        ensure_running: StopFn = None,
    ) -> RifeWorkerStats:
        stats = RifeWorkerStats(scene_count=len(tasks))
        validate_scene_tasks(tasks)
        with self._states_lock:
            self._states = {task.scene_index: "queued" for task in tasks}
        if not tasks:
            return stats

        started_at = time.perf_counter()
        task_queue = SceneTaskQueue(self.queue_size)
        cancel = threading.Event()
        producer_errors = []

        def cancel_unfinished() -> None:
            with self._states_lock:
                for scene_index, state in self._states.items():
                    if state not in {"completed", "failed"}:
                        self._states[scene_index] = "cancelled"

        def producer() -> None:
            try:
                for task in tasks:
                    try:
                        if ensure_running is not None:
                            ensure_running()
                        self._set_state(task.scene_index, "staging")
                        stage(task)
                        self._set_state(task.scene_index, "staged")
                        task_queue.put(task, cancel)
                    except BaseException:
                        self._set_state(
                            task.scene_index,
                            "cancelled" if cancel.is_set() else "failed",
                        )
                        raise
            except BaseException as exc:
                producer_errors.append(exc)
                cancel.set()
            finally:
                task_queue.close()

        staging_thread = threading.Thread(
            target=producer,
            name="rife-scene-staging",
            daemon=True,
        )
        staging_thread.start()

        active_key = None
        consumer_error = None
        try:
            while True:
                if ensure_running is not None:
                    ensure_running()
                idle_started_at = time.perf_counter()
                task = task_queue.get()
                stats.worker_idle_time += time.perf_counter() - idle_started_at
                if task is None:
                    break
                if task.compatibility_key != active_key:
                    stats.worker_start += 1
                    if active_key is not None:
                        stats.compatibility_switch_count += 1
                    active_key = task.compatibility_key
                self._set_state(task.scene_index, "processing")
                try:
                    if task.requires_inference:
                        process_result = process(task)
                        if not isinstance(process_result, SceneProcessResult) or process_result.model_loaded:
                            stats.model_reload_count += 1
                    collect(task)
                    stats.scene_process_count += 1
                    self._set_state(task.scene_index, "completed")
                except BaseException:
                    self._set_state(task.scene_index, "failed")
                    raise
        except BaseException as exc:
            consumer_error = exc
            cancel.set()
            task_queue.close()
            cancel_unfinished()
        finally:
            staging_thread.join(timeout=5.0)
            stats.scheduling_time = time.perf_counter() - started_at

        if staging_thread.is_alive():
            raise RuntimeError("scene staging thread did not stop") from consumer_error
        if consumer_error is not None:
            cancel_unfinished()
            raise consumer_error
        if producer_errors:
            cancel_unfinished()
            raise RuntimeError(f"scene staging failed: {producer_errors[0]}") from producer_errors[0]
        return stats
