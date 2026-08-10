"""In-memory frame pipeline primitives for the incremental pipeline migration.

The existing PNG pipeline remains the default.  This module intentionally has no
RIFE or encoder dependency; it only provides frame ownership and queueing.
"""

from __future__ import annotations

import queue
import subprocess
import threading
import time
from dataclasses import dataclass
from typing import Optional


class FrameQueueClosed(RuntimeError):
    """Raised when a queue is stopped while a producer/consumer is waiting."""


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
        self._queue: "queue.Queue[Frame]" = queue.Queue(maxsize=self.maxsize)
        self._stopped = threading.Event()

    @property
    def stopped(self) -> bool:
        return self._stopped.is_set()

    def put(self, frame: Frame, timeout: Optional[float] = None) -> None:
        self._put_or_get("put", frame, timeout)

    def get(self, timeout: Optional[float] = None) -> Frame:
        return self._put_or_get("get", None, timeout)

    def stop(self) -> None:
        self._stopped.set()

    close = stop

    def qsize(self) -> int:
        return self._queue.qsize()

    def _put_or_get(self, operation: str, item: Optional[Frame], timeout: Optional[float]):
        deadline = None if timeout is None else time.monotonic() + timeout
        while True:
            if operation == "put" and self.stopped:
                raise FrameQueueClosed("frame queue is stopped")
            if operation == "get" and self.stopped and self._queue.empty():
                raise FrameQueueClosed("frame queue is stopped and empty")
            wait = 0.1
            if deadline is not None:
                wait = max(0.0, min(wait, deadline - time.monotonic()))
                if wait <= 0:
                    raise queue.Full if operation == "put" else queue.Empty
            try:
                if operation == "put":
                    self._queue.put(item, timeout=wait)
                    return None
                return self._queue.get(timeout=wait)
            except (queue.Full, queue.Empty):
                if deadline is not None and time.monotonic() >= deadline:
                    raise


@dataclass
class FramePipeline:
    """Queues shared by decoder, processor workers, and the eventual encoder."""

    input_queue: FrameQueue
    output_queue: FrameQueue

    @classmethod
    def create(cls, queue_size: int = 32) -> "FramePipeline":
        return cls(FrameQueue(queue_size), FrameQueue(queue_size))

    def stop(self) -> None:
        self.input_queue.stop()
        self.output_queue.stop()


def decode_and_consume(
    ffmpeg: str,
    video_path: str,
    width: int,
    height: int,
    queue_size: int = 32,
    worker_count: int = 1,
    fps: float = 30.0,
    stop_event: Optional[threading.Event] = None,
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
    consumed = 0
    consumed_lock = threading.Lock()
    errors = []

    process = subprocess.Popen(
        [ffmpeg, "-v", "error", "-i", video_path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-vsync", "0", "-"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    def producer() -> None:
        try:
            index = 0
            while not stop_event.is_set():
                data = process.stdout.read(frame_bytes) if process.stdout else b""
                if not data:
                    break
                if len(data) != frame_bytes:
                    raise RuntimeError("FFmpeg returned a partial raw frame")
                input_queue.put(Frame(data, width, height, "rgb24", index, index / max(fps, 1e-6)))
                index += 1
        except FrameQueueClosed:
            if not stop_event.is_set():
                errors.append(RuntimeError("input frame queue closed unexpectedly"))
        except BaseException as exc:
            errors.append(exc)
        finally:
            input_queue.stop()

    def processor() -> None:
        while not stop_event.is_set():
            try:
                frame = input_queue.get(timeout=0.2)
                output_queue.put(frame)
            except queue.Empty:
                continue
            except FrameQueueClosed:
                return
            except BaseException as exc:
                errors.append(exc)
                stop_event.set()
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
        thread.join()
    output_queue.stop()
    sink_thread.join()
    if (stop_event.is_set() or errors) and process.poll() is None:
        process.terminate()
    return_code = process.wait()
    detail = (process.stderr.read() if process.stderr else b"").decode("utf-8", "replace")
    if process.stdout:
        process.stdout.close()
    if process.stderr:
        process.stderr.close()
    if return_code != 0 and not stop_event.is_set():
        raise RuntimeError(f"FFmpeg memory decode failed ({return_code}): {detail[-1000:]}")
    if stop_event.is_set():
        return consumed
    if errors:
        raise RuntimeError(f"memory frame pipeline failed: {errors[0]}") from errors[0]
    return consumed
