"""In-memory frame pipeline primitives for the incremental pipeline migration.

The existing PNG pipeline remains the default.  This module intentionally has no
RIFE or encoder dependency; it only provides frame ownership and queueing.
"""

from __future__ import annotations

import queue
import subprocess
import threading
import time
from dataclasses import asdict, dataclass
from typing import Callable, Optional


class FrameQueueClosed(RuntimeError):
    """Raised when a queue is stopped while a producer/consumer is waiting."""

    def __init__(self, reason: str, error: BaseException | None = None) -> None:
        super().__init__(reason)
        self.reason = reason
        self.error = error


class FramePipelineError(RuntimeError):
    """Pipeline failure with queue state captured at the failure boundary."""

    def __init__(self, message: str, stats: dict) -> None:
        super().__init__(message)
        self.stats = stats


@dataclass
class FrameQueueStats:
    max_size: int = 0
    put_count: int = 0
    get_count: int = 0
    peak_size: int = 0
    put_wait_seconds: float = 0.0
    get_wait_seconds: float = 0.0
    timeout_count: int = 0
    dropped_frames: int = 0
    close_reason: str = "open"
    error: str = ""


@dataclass(frozen=True)
class FramePipelineResult:
    consumed_frames: int
    input_queue: dict
    output_queue: dict
    stopped: bool


@dataclass
class Frame:
    frame_data: object
    width: int
    height: int
    pixel_format: str
    frame_index: int
    timestamp: float


class FrameQueue:
    """Bounded, thread-safe producer/consumer queue with cooperative shutdown."""

    def __init__(self, maxsize: int = 32) -> None:
        if int(maxsize) <= 0:
            raise ValueError("maxsize must be positive")
        self.maxsize = int(maxsize)
        self._queue: "queue.Queue[object]" = queue.Queue(maxsize=self.maxsize)
        self._stopped = threading.Event()
        self._sentinel = object()
        self._close_reason = "open"
        self._error: BaseException | None = None
        self._stats = FrameQueueStats(max_size=self.maxsize)
        self._stats_lock = threading.Lock()
        self._sentinel_enqueued = False

    @property
    def stopped(self) -> bool:
        return self._stopped.is_set()

    def put(self, frame: Frame, timeout: Optional[float] = None) -> None:
        self._put_or_get("put", frame, timeout)

    def get(self, timeout: Optional[float] = None) -> Frame:
        return self._put_or_get("get", None, timeout)

    def stop(
        self,
        reason: str = "stopped",
        error: BaseException | None = None,
        discard: bool = False,
    ) -> None:
        if self._stopped.is_set():
            if error is not None and self._error is None:
                self._close_reason = str(reason or self._close_reason)
                self._error = error
                with self._stats_lock:
                    self._stats.close_reason = self._close_reason
                    self._stats.error = str(error)
            if discard:
                self._discard_pending()
            return
        self._close_reason = str(reason or "stopped")
        self._error = error
        self._stopped.set()
        if discard:
            self._discard_pending()
        with self._stats_lock:
            self._stats.close_reason = self._close_reason
            self._stats.error = "" if error is None else str(error)
        if self._queue.empty():
            try:
                self._queue.put_nowait(self._sentinel)
                self._sentinel_enqueued = True
            except queue.Full:
                pass

    close = stop

    def qsize(self) -> int:
        size = self._queue.qsize()
        return max(0, size - (1 if self._sentinel_enqueued else 0))

    def stats(self) -> dict:
        with self._stats_lock:
            snapshot = asdict(self._stats)
        snapshot["current_size"] = self.qsize()
        return snapshot

    def _closed_error(self) -> FrameQueueClosed:
        return FrameQueueClosed(self._close_reason, self._error)

    def _discard_pending(self) -> None:
        dropped = 0
        while True:
            try:
                item = self._queue.get_nowait()
                if item is self._sentinel:
                    self._sentinel_enqueued = False
                else:
                    dropped += 1
            except queue.Empty:
                break
        with self._stats_lock:
            self._stats.dropped_frames += dropped
        try:
            self._queue.put_nowait(self._sentinel)
            self._sentinel_enqueued = True
        except queue.Full:
            pass

    def _put_or_get(self, operation: str, item: Optional[Frame], timeout: Optional[float]):
        started = time.monotonic()
        deadline = None if timeout is None else time.monotonic() + timeout
        while True:
            if operation == "put" and self.stopped:
                with self._stats_lock:
                    self._stats.dropped_frames += 1
                    self._stats.put_wait_seconds += time.monotonic() - started
                raise self._closed_error()
            if operation == "get" and self.stopped and self._queue.empty():
                with self._stats_lock:
                    self._stats.get_wait_seconds += time.monotonic() - started
                raise self._closed_error()
            wait = 0.1
            if deadline is not None:
                wait = max(0.0, min(wait, deadline - time.monotonic()))
                if wait <= 0:
                    with self._stats_lock:
                        self._stats.timeout_count += 1
                        if operation == "put":
                            self._stats.put_wait_seconds += time.monotonic() - started
                        else:
                            self._stats.get_wait_seconds += time.monotonic() - started
                    raise queue.Full if operation == "put" else queue.Empty
            try:
                if operation == "put":
                    self._queue.put(item, timeout=wait)
                    size = self._queue.qsize()
                    with self._stats_lock:
                        self._stats.put_count += 1
                        self._stats.peak_size = max(self._stats.peak_size, size)
                        self._stats.put_wait_seconds += time.monotonic() - started
                    return None
                result = self._queue.get(timeout=wait)
                if result is self._sentinel:
                    self._sentinel_enqueued = False
                    try:
                        self._queue.put_nowait(self._sentinel)
                        self._sentinel_enqueued = True
                    except queue.Full:
                        pass
                    with self._stats_lock:
                        self._stats.get_wait_seconds += time.monotonic() - started
                    raise self._closed_error()
                with self._stats_lock:
                    self._stats.get_count += 1
                    self._stats.get_wait_seconds += time.monotonic() - started
                return result
            except (queue.Full, queue.Empty):
                if deadline is not None and time.monotonic() >= deadline:
                    with self._stats_lock:
                        self._stats.timeout_count += 1
                        if operation == "put":
                            self._stats.put_wait_seconds += time.monotonic() - started
                        else:
                            self._stats.get_wait_seconds += time.monotonic() - started
                    raise


@dataclass
class FramePipeline:
    """Queues shared by decoder, processor workers, and the eventual encoder."""

    input_queue: FrameQueue
    output_queue: FrameQueue

    @classmethod
    def create(cls, queue_size: int = 32) -> "FramePipeline":
        return cls(FrameQueue(queue_size), FrameQueue(queue_size))

    def stop(self, reason: str = "stopped", error: BaseException | None = None, discard: bool = False) -> None:
        self.input_queue.stop(reason, error, discard)
        self.output_queue.stop(reason, error, discard)

    def stats(self) -> dict:
        return {"input_queue": self.input_queue.stats(), "output_queue": self.output_queue.stats()}


def decode_and_consume(
    ffmpeg: str,
    video_path: str,
    width: int,
    height: int,
    queue_size: int = 32,
    worker_count: int = 1,
    fps: float = 30.0,
    stop_event: Optional[threading.Event] = None,
    stats_callback: Optional[Callable[[FramePipelineResult], None]] = None,
    frame_processor: Optional[Callable[[Frame], Frame]] = None,
) -> int:
    """Decode frames through bounded input/output queues, then release them."""
    if width <= 0 or height <= 0:
        raise ValueError("video dimensions are required for raw frame decoding")
    worker_count = max(1, int(worker_count))
    frame_bytes = width * height * 3
    pipeline = FramePipeline.create(queue_size)
    input_queue = pipeline.input_queue
    output_queue = pipeline.output_queue
    stop_event = stop_event or threading.Event()
    frame_processor = frame_processor or (lambda frame: frame)
    consumed = 0
    consumed_lock = threading.Lock()
    errors: list[BaseException] = []
    errors_lock = threading.Lock()

    process = subprocess.Popen(
        [ffmpeg, "-v", "error", "-i", video_path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-vsync", "0", "-"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    def fail(exc: BaseException, stage: str) -> None:
        with errors_lock:
            if not errors:
                errors.append(exc)
        stop_event.set()
        pipeline.stop(f"{stage}_failed", exc, discard=True)

    def producer() -> None:
        try:
            index = 0
            while not stop_event.is_set():
                data = process.stdout.read(frame_bytes) if process.stdout else b""
                if not data:
                    break
                if len(data) != frame_bytes:
                    raise RuntimeError("FFmpeg returned a partial raw frame")
                input_queue.put(
                    Frame(data, width, height, "rgb24", index, index / max(fps, 1e-6))
                )
                index += 1
        except FrameQueueClosed:
            if not stop_event.is_set():
                fail(RuntimeError("input frame queue closed unexpectedly"), "producer")
        except BaseException as exc:
            fail(exc, "producer")
        finally:
            input_queue.stop("producer_completed")

    def processor() -> None:
        while not stop_event.is_set():
            try:
                frame = input_queue.get(timeout=0.2)
                output_queue.put(frame_processor(frame))
            except queue.Empty:
                continue
            except FrameQueueClosed:
                return
            except BaseException as exc:
                fail(exc, "processor")
                return

    def sink() -> None:
        nonlocal consumed
        while not stop_event.is_set():
            try:
                frame = output_queue.get(timeout=0.2)
            except (FrameQueueClosed, queue.Empty):
                if output_queue.stopped:
                    return
                continue
            del frame
            with consumed_lock:
                consumed += 1

    producer_thread = threading.Thread(target=producer, name="frame-decoder", daemon=True)
    processor_threads = [threading.Thread(target=processor, name=f"frame-processor-{i}", daemon=True) for i in range(worker_count)]
    sink_thread = threading.Thread(target=sink, name="frame-sink", daemon=True)
    producer_thread.start()
    for thread in processor_threads:
        thread.start()
    sink_thread.start()
    while producer_thread.is_alive():
        producer_thread.join(timeout=0.1)
        if stop_event.is_set():
            pipeline.stop()
            if process.poll() is None:
                process.terminate()
    for thread in processor_threads:
        thread.join(timeout=10.0)
        if thread.is_alive():
            fail(RuntimeError(f"{thread.name} did not stop"), "processor_shutdown")
    output_queue.stop("processors_completed")
    sink_thread.join(timeout=10.0)
    if sink_thread.is_alive():
        fail(RuntimeError("frame-sink did not stop"), "sink_shutdown")
    if (stop_event.is_set() or errors) and process.poll() is None:
        process.terminate()
    try:
        return_code = process.wait(timeout=10.0)
    except subprocess.TimeoutExpired:
        process.kill()
        return_code = process.wait(timeout=5.0)
        fail(RuntimeError("FFmpeg did not stop within the shutdown timeout"), "ffmpeg_shutdown")
    detail = (process.stderr.read() if process.stderr else b"").decode("utf-8", "replace")
    if process.stdout:
        process.stdout.close()
    if process.stderr:
        process.stderr.close()
    if return_code != 0 and not stop_event.is_set():
        error = RuntimeError(f"FFmpeg memory decode failed ({return_code}): {detail[-1000:]}")
        pipeline.stop("ffmpeg_failed", error, discard=True)
        raise FramePipelineError(str(error), pipeline.stats()) from error
    if errors:
        raise FramePipelineError(
            f"memory frame pipeline failed: {errors[0]}", pipeline.stats()
        ) from errors[0]
    result = FramePipelineResult(
        consumed_frames=consumed,
        input_queue=input_queue.stats(),
        output_queue=output_queue.stats(),
        stopped=stop_event.is_set(),
    )
    if stats_callback is not None:
        stats_callback(result)
    return consumed
