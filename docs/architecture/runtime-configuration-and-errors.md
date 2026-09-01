# Runtime Configuration and Error Contract

## Scope

Phase D1 centralizes VideoWorker runtime settings and establishes stable error
metadata without changing GUI controls, backend defaults, or encoding behavior.

## Configuration

`gvfi_runtime.runtime_config.RuntimeConfig` is an immutable task snapshot. It:

- keeps `backend_mode=cli` and `pipeline_mode=disk` as production defaults;
- normalizes numeric, boolean, and mode values once at the VideoWorker boundary;
- rejects unsupported modes and unsafe ranges before backend creation;
- preserves unknown extension keys in the compatibility `VideoWorker.params` mapping;
- exposes `as_dict()` for deterministic task logging.

Existing code may continue reading `VideoWorker.params`. New runtime code should
prefer `VideoWorker.runtime_config` and must not mutate it.

## Error taxonomy

`gvfi_runtime.errors.ErrorCode` defines stable categories:

- `CONFIG_ERROR`
- `INPUT_ERROR`
- `DECODE_ERROR`
- `MODEL_ERROR`
- `VULKAN_ERROR`
- `BACKEND_ERROR`
- `ENCODE_ERROR`
- `CANCELLED`
- `UNKNOWN_ERROR`

`GvfiError` carries `code`, `stage`, `message`, and serializable `details`.
Existing `BackendError`, `TaskCancelled`, and `ProcessExecutionError` remain
catch-compatible while now participating in this contract.

## Observability

Each VideoWorker creates a unique `task_id` and logs its normalized configuration
before environment validation. Structured exceptions include their error code and
stage in the existing text log, allowing the GUI and API to remain compatible.

## Compatibility boundary

This phase intentionally does not:

- change GUI parameter creation;
- change the CLI or Native backend selection policy;
- change Native-to-CLI fallback behavior;
- change FFmpeg, scene detection, model, or encoding behavior.
