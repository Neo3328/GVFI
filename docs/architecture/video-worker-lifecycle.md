# VideoWorker Lifecycle and Fallback Contract

## State model

Every VideoWorker owns a thread-safe `TaskLifecycle` with these states:

`created -> validating -> initializing -> running -> succeeded|failed`

Cancellation uses:

`created|validating|initializing|running -> cancelling -> cancelled`

Terminal states cannot be reopened by a late cancellation request.

## Backend lifecycle

The worker keeps the existing backend contract:

`initialize -> load_model -> process -> release`

Release is performed through a guarded worker method. Release failures are logged
and recorded without replacing the original task outcome. Native-to-CLI fallback
releases Native first; task completion releases the active CLI backend.

## Observable fallback

Native initialization, model-load, or processing failure produces an explicit block:

```text
NATIVE BACKEND FAILED
FALLBACK TO CLI
failure_stage=...
error_code=...
reason=...
```

Fallback state includes requested backend, active backend, structured failure data,
and released backend names. There is no silent fallback.

## Task result

The final `TASK RESULT` JSON contains task ID, terminal state, requested and active
backend, fallback details, last failure, release records, and timestamps. Existing
GUI and API consumers remain compatible because this is emitted through the current
text log signal.

## Non-goals

This phase does not change GUI controls, encoding, decoding, scene scheduling,
models, the Native ABI, or the default `backend_mode=cli` policy.
