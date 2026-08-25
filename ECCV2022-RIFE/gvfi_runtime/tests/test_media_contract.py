from __future__ import annotations

import unittest

from gvfi_runtime.media_contract import build_output_video_filter, parse_media_contract


class MediaContractTests(unittest.TestCase):
    def test_sdr_cfr_contract(self) -> None:
        contract = parse_media_contract({"streams": [{
            "codec_type": "video", "codec_name": "h264", "width": 1920, "height": 1080,
            "avg_frame_rate": "24/1", "r_frame_rate": "24/1", "pix_fmt": "yuv420p",
            "nb_frames": "48", "duration": "2.0",
            "color_space": "bt709", "color_range": "tv", "color_transfer": "bt709",
            "color_primaries": "bt709",
        }]})
        self.assertFalse(contract.variable_frame_rate)
        self.assertEqual(contract.bit_depth, 8)
        self.assertEqual(contract.frame_count, 48)
        self.assertEqual(contract.duration_seconds, 2.0)
        self.assertEqual(contract.warnings, ())

    def test_vfr_multiaudio_rotation_hdr_and_alpha_policy(self) -> None:
        contract = parse_media_contract({"streams": [
            {
                "codec_type": "video", "codec_name": "hevc", "width": 1080, "height": 1920,
                "avg_frame_rate": "30000/1001", "r_frame_rate": "60/1",
                "pix_fmt": "yuva420p10le", "color_space": "bt2020nc", "color_range": "tv",
                "color_transfer": "smpte2084", "color_primaries": "bt2020",
                "side_data_list": [{"rotation": -90}],
            },
            {"codec_type": "audio", "codec_name": "aac"},
            {"codec_type": "audio", "codec_name": "opus"},
        ]})
        self.assertTrue(contract.variable_frame_rate)
        self.assertTrue(contract.hdr)
        self.assertTrue(contract.has_alpha)
        self.assertEqual(contract.bit_depth, 10)
        self.assertEqual(contract.rotation, 270)
        self.assertEqual(contract.audio_stream_count, 2)
        self.assertGreaterEqual(len(contract.warnings), 5)

    def test_rejects_missing_video_stream(self) -> None:
        with self.assertRaisesRegex(ValueError, "no video stream"):
            parse_media_contract({"streams": [{"codec_type": "audio"}]})

    def test_output_filter_preserves_color_policy_and_pads_odd_geometry(self) -> None:
        self.assertEqual(
            build_output_video_filter(True),
            "scale=in_range=full:out_color_matrix=bt709:out_range=tv,"
            "pad=ceil(iw/2)*2:ceil(ih/2)*2,"
            "setparams=range=limited:color_primaries=bt709:"
            "color_trc=bt709:colorspace=bt709",
        )
        self.assertEqual(
            build_output_video_filter(False),
            "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        )


if __name__ == "__main__":
    unittest.main()
