# Fix: Improve default VFI model selection (P0-3)

## 1. Original problem

Jobs could silently land on **`rife-anime`** even when the user never chose an anime model:

| Layer | Behavior before |
|-------|-----------------|
| Web UI | `useState("gvfi:rife-anime")`; health fallback could keep anime |
| Preset chrome | Default selected preset was `anime-interp` |
| Params fallback | Placeholder id used `rife-anime` |
| PyQt prefs | `last_preset` defaulted to `SVFI风格` (anime) |
| API empty model | Fell back to `tools["rife_model"]` (list order) without an explicit general-purpose policy / reason log |

`rife-anime` is valid for anime workflows, but as a **silent default** it risks ghosting / finger artifacts / wrong optical flow on live-action, game captures, and film.

This change is **selection policy only** — no RIFE inference, FFmpeg, encode, GPU, or pipeline edits; model weight files untouched.

## 2. Modified logic

1. **User explicitly selects a model** → use that path (`reason=user_selected`).
2. **User does not select / empty `model`** → prefer **`rife-v4.6`** (`reason=default_general_model`).
3. **Requested id missing** → same general default (`reason=fallback_default_general_model`).
4. **`rife-anime` remains** an explicit catalog / preset option (e.g. `anime-interp`, `SVFI风格`).
5. `pick_default_rife_model()` never silently prefers `rife-anime` when any other candidate exists.

Job-start log:

```
MODEL CONFIG:
input_type=unknown
selected_model=rife-v4.6
reason=default_general_model
```

User-selected anime:

```
MODEL CONFIG:
input_type=unknown
selected_model=rife-anime
reason=user_selected
```

### Compatibility

`rife-v4.6` and `rife-anime` are both directories passed to `rife-ncnn-vulkan` via `-m <dir>` with the same CLI contract. No model file or inference code changes.

### Files

- `ECCV2022-RIFE/tool_resolver.py` — `DEFAULT_RIFE_MODEL_NAME`, `pick_default_rife_model`
- `ECCV2022-RIFE/gvfi_api.py` — `_resolve_rife_model_choice` + MODEL CONFIG log
- `ECCV2022-RIFE/main.py` — emit MODEL CONFIG; desktop params carry selection reason
- `ECCV2022-RIFE/svfi_pipeline.py` — comment on discover preference order
- `ECCV2022-RIFE/ui_prefs.py` — default `last_preset` → `电影ProRes` (v4.6)
- `web-ui/.../process-workspace-context.tsx` — default model / preset → v4.6
- `web-ui/.../params-panel.tsx` — placeholder fallback → v4.6
- `docs/fixes/model-selection-policy.md` — this document

## 3. Test results

Offline mapping with a fake catalog where **`rife-anime` is listed first**:

| Case | Input | Result |
|------|-------|--------|
| Test 1 — no selection | `model=""` | `selected_model=rife-v4.6`, `reason=default_general_model` |
| Test 2 — anime | `model=gvfi:rife-anime` | `selected_model=rife-anime`, `reason=user_selected` |
| Test 3 — other | `model=gvfi:rife-v3.1` | `selected_model=rife-v3.1`, `reason=user_selected` (not overwritten) |

All asserts passed.
