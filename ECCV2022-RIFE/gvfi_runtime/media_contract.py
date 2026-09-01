"""Read-only media metadata contract used before the PNG production pipeline."""

from __future__ import annotations

import json
import subprocess
from dataclasses import asdict, dataclass, field
from typing import Any


def _rate(value: Any) -> float:
    text = str(value or "0/1")
    try:
        if "/" in text:
            numerator, denominator = text.split("/", 1)
            return float(numerator) / float(denominator) if float(denominator) else 0.0
        return float(text)
    except (TypeError, ValueError, ZeroDivisionError):
        return 0.0


def _bit_depth(stream: dict) -> int:
    try:
        raw = int(stream.get("bits_per_raw_sample") or 0)
        if raw > 0:
            return raw
    except (TypeError, ValueError):
        pass
    pixel_format = str(stream.get("pix_fmt") or "").lower()
    for depth in (16, 14, 12, 10, 9):
        if str(depth) in pixel_format:
            return depth
    return 8


def _rotation(stream: dict) -> int:
    tags = stream.get("tags") or {}
    try:
        if "rotate" in tags:
            return int(float(tags["rotate"])) % 360
    except (TypeError, ValueError):
        pass
    for side_data in stream.get("side_data_list") or []:
        try:
            if "rotation" in side_data:
                return int(float(side_data["rotation"])) % 360
        except (TypeError, ValueError):
            continue
    return 0


@dataclass(frozen=True)
class MediaContract:
    video_codec: str
    width: int
    height: int
    average_fps: float
    nominal_fps: float
    frame_count: int
    duration_seconds: float
    variable_frame_rate: bool
    pixel_format: str
    bit_depth: int
    color_space: str
    color_range: str
    color_transfer: str
    color_primaries: str
    rotation: int
    audio_stream_count: int
    has_alpha: bool
    hdr: bool
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def as_dict(self) -> dict:
        return asdict(self)


def parse_media_contract(payload: dict) -> MediaContract:
    streams = payload.get("streams") or []
    video = next((item for item in streams if item.get("codec_type") == "video"), None)
    if video is None:
        raise ValueError("input has no video stream")
    audio_count = sum(1 for item in streams if item.get("codec_type") == "audio")
    average_fps = _rate(video.get("avg_frame_rate"))
    nominal_fps = _rate(video.get("r_frame_rate"))
    variable = bool(
        average_fps > 0
        and nominal_fps > 0
        and abs(average_fps - nominal_fps) > max(0.01, nominal_fps * 0.001)
    )
    pixel_format = str(video.get("pix_fmt") or "unknown")
    lowered = pixel_format.lower()
    has_alpha = any(token in lowered for token in ("rgba", "bgra", "argb", "abgr", "yuva", "gbrap"))
    transfer = str(video.get("color_transfer") or "unknown")
    primaries = str(video.get("color_primaries") or "unknown")
    hdr = transfer in {"smpte2084", "arib-std-b67"} or primaries.startswith("bt2020")
    depth = _bit_depth(video)
    rotation = _rotation(video)
    try:
        duration = float(video.get("duration") or (payload.get("format") or {}).get("duration") or 0.0)
    except (TypeError, ValueError):
        duration = 0.0
    try:
        frame_count = int(video.get("nb_frames") or 0)
    except (TypeError, ValueError):
        frame_count = 0
    if frame_count <= 0 and duration > 0 and (average_fps or nominal_fps) > 0:
        frame_count = max(1, int(round(duration * (average_fps or nominal_fps))))
    warnings = []
    if variable:
        warnings.append("VFR input is normalized to the configured constant output FPS")
    if audio_count > 1:
        warnings.append("only the first audio stream is preserved")
    if rotation:
        warnings.append("FFmpeg autorotation is applied during frame extraction")
    if hdr or depth > 8:
        warnings.append("the RGB8 PNG intermediate path does not preserve HDR or source bit depth")
    if has_alpha:
        warnings.append("alpha is not preserved by the RGB/YUV production path")
    if int(video.get("width") or 0) % 2 or int(video.get("height") or 0) % 2:
        warnings.append("odd dimensions are padded by at most one pixel for encoder compatibility")
    if str(video.get("color_space") or "unknown") == "unknown":
        warnings.append("missing source matrix metadata; SDR output uses the existing BT.709 policy")
    return MediaContract(
        video_codec=str(video.get("codec_name") or "unknown"),
        width=int(video.get("width") or 0),
        height=int(video.get("height") or 0),
        average_fps=average_fps or nominal_fps,
        nominal_fps=nominal_fps or average_fps,
        frame_count=frame_count,
        duration_seconds=duration,
        variable_frame_rate=variable,
        pixel_format=pixel_format,
        bit_depth=depth,
        color_space=str(video.get("color_space") or "unknown"),
        color_range=str(video.get("color_range") or "unknown"),
        color_transfer=transfer,
        color_primaries=primaries,
        rotation=rotation,
        audio_stream_count=audio_count,
        has_alpha=has_alpha,
        hdr=hdr,
        warnings=tuple(warnings),
    )


def probe_media_contract(ffprobe: str, input_path: str) -> MediaContract:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", input_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        check=False,
        timeout=30.0,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode != 0:
        detail = (result.stderr or b"").decode("utf-8", "replace")[-1000:]
        raise RuntimeError(f"ffprobe media contract failed ({result.returncode}): {detail}")
    try:
        payload = json.loads((result.stdout or b"{}").decode("utf-8", "replace"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"ffprobe returned invalid JSON: {exc}") from exc
    return parse_media_contract(payload)


def build_output_video_filter(use_sdr_bt709: bool) -> str:
    """Return the RGB conversion and encoder geometry filter chain."""
    filters = []
    if use_sdr_bt709:
        filters.append("scale=in_range=full:out_color_matrix=bt709:out_range=tv")
    filters.append("pad=ceil(iw/2)*2:ceil(ih/2)*2")
    if use_sdr_bt709:
        filters.append(
            "setparams=range=limited:color_primaries=bt709:"
            "color_trc=bt709:colorspace=bt709"
        )
    return ",".join(filters)
