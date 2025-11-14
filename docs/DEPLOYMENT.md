# Deployment Guide

This document captures the recommended approaches for running the order-ingestion service in production and keeping it
extensible as you add OCR, layout, and multi-tenant orchestration features.

## 1. Deployment Targets

| Target | When to use | Notes |
|--------|-------------|-------|
| Docker / single VM | Pilots, air-gapped installs, manual ops | Keep `/tmp` writable for PDF/OCR staging. Mount `/data` if you need persistent logs or traces. |
| Docker Compose | Small teams with one FastAPI replica plus supporting services (Redis, tracing) | Add a reverse proxy (nginx/Traefik) for TLS termination and request limits. |
| Kubernetes | Production, multiple customers, >500 docs/day | Define separate Deployments for the API and optional async workers. Mount secrets via `Secret` objects. Expose metrics through a `ServiceMonitor`. |

Regardless of the platform, the container published in `Dockerfile` is the single artifact. Supply the correct env vars for the
LLM + OCR providers when the container starts.

## 2. Environment Variables

All configuration values are loaded through `config.py`. Provide them as env vars or secrets at runtime:

- `OPENAI_API_KEY`, `MODEL_NAME`
- `DEEPSEEK_OCR_API_KEY`, `DEEPSEEK_OCR_ENDPOINT`, `DEEPSEEK_OCR_TIMEOUT`
- `EXTRACTOR_MIN_CHARACTERS`, `EXTRACTOR_MIN_ALPHA_RATIO`, `OCR_RENDER_DPI`
- `PIPELINE_RATE_LIMIT_QPS`, `PIPELINE_MAX_RETRIES` (future ready values)

For Kubernetes, store sensitive keys in a `Secret` and map them into the container environment. For Docker Compose, use an
`.env` file but ensure it is excluded from version control.

## 3. File System + Temp Storage

OCR rendering writes temporary PNGs to the container filesystem. The default location is the OS temp directory, but you can
configure `TMPDIR`/`TEMP`. Allocate enough space for large PDFs (each 300‑dpi page can be 1–2 MB). Mount a persistent volume if
you need to keep diagnostic artifacts for audits.

## 4. Scaling Out

1. Run multiple FastAPI replicas (Gunicorn/Uvicorn workers or multiple pods) behind a load balancer.
2. Ensure the OpenAI + DeepSeek quotas support the combined throughput. Rate-limit per customer to prevent noisy neighbors.
3. Externalize stateful concerns (logs, metrics, traces) to shared services (Elastic, Loki, Prometheus).
4. Monitor OCR latency—rendering and DeepSeek calls dominate CPU + GPU usage. Add autoscaling rules based on CPU and request
   queue length.

## 5. Observability + Monitoring

- Emit structured logs that include `customer_profile_id`, extractor engine used, and confidence score.
- Publish metrics such as OCR latency, fallback counts, and schema validation failures. In Kubernetes, expose `/metrics`
  through a sidecar or add a Prometheus FastAPI instrumentor.
- Forward unhandled exceptions to Sentry or a similar tool for rapid triage.

## 6. Security Considerations

- Terminate TLS at a reverse proxy and only allow HTTPS traffic.
- Enforce request authentication (JWT or Basic auth) via FastAPI dependencies when moving beyond prototyping.
- Restrict outbound network access so only the LLM/OCR providers are reachable.
- Scrub uploaded PDFs after processing—`OrderIngestionPipeline` already deletes temp files; verify this behavior on each target.

## 7. Rolling Out Updates

1. Build the Docker image via CI (e.g., `docker build -t registry/order-ingestion:<git-sha> .`).
2. Run tests (`pytest`) inside CI before publishing the image.
3. For Kubernetes, update the Deployment image tag and let the rolling updater drain pods; for Compose, restart the service.
4. Keep backward compatibility in the schema so downstream NAV jobs are unaffected.

## 8. Disaster Recovery

- Store configuration in source control + backup secret stores.
- Keep a history of Docker images; tag releases semantically.
- Document manual runbooks (e.g., reprocess PDF, replay queue) so operators can restore service quickly.

## 9. Future Enhancements

- Add an async worker tier for high-volume OCR so API pods stay responsive.
- Attach a message queue (RabbitMQ, SQS) to buffer ingestion jobs.
- Integrate feature flags to toggle new extraction or reasoning modules per tenant.
- Capture layout JSON from DeepSeek and persist it for downstream analytics.

With these practices, the service can grow from a single-node pilot to a multi-tenant ingestion platform with clear upgrade and
monitoring paths.
