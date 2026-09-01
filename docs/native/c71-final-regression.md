C7.1 — Native Final Production Regression Report

Developed by Mr. Gong
Copyright (c) 2026 Mr. Gong. All Rights Reserved.

Constraints
- No production logic changes during this phase
- Default backend_mode remains cli
- C7.2 not executed

Prior context
- C5.4: production acceptance without default switch (PASS historically)
- C6.5: batch coalescing no meaningful steady-state gain
- C6.6: pipeline overlap gain 1.33% (<15%), STOP expansion

Git note
- Working tree contains C6.x native PoC + DLL changes; production default still cli

Results

- Test A Native Normal Task: PASS
  frames=48 fps=48/1 res=1920x1080 audio=aac
- Test B Native Fallback: PASS
- Test C Cross-Task State Recovery: PASS
- Test D Continuous Stability: PASS
- Test E Default Config Protection: PASS
- Test F Native Continuous Stability x10: PASS
  passed=10/10 crashes=0
- Test G Native vs CLI Correctness: PASS
  MAE=1.822838652182999 PSNR=28.138900306483944 maxΔ=255
  cli_codec=hevc native_codec=hevc pix_fmt=yuv420p

Overall: ALL PASS

Default backend_mode
- Value: cli
- Protected: True

C7.2 readiness
READY FOR C7.2 DISCUSSION ONLY: functional regression PASS and default remains cli. C7.2 must still decide whether/when to switch default; C6.5/C6.6 showed no >=15% steady-state gain from batch/pipeline, so performance is NOT a reason to switch yet.

JSON: D:\GVFI-deps\native-video-worker-ab\c71_final\c71_results.json
