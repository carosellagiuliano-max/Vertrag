# Deployment Guide

This document explains how to run the order-ingestion platform in production, extend it with OCR/vision upgrades, and
operate it safely at scale. The guidance applies whether you deploy on a single VM, Docker Compose stack, or Kubernetes
cluster.

---

## 1. Architecture Overview

```
Client -> FastAPI /extract-order -> OrderIngestionPipeline ->
  ChainedTextExtractor (pdfplumber -> pypdf -> DeepSeek OCR -> future engines)
  -> Layout analyzer (future) -> Customer profile resolver -> Schema registry ->
  Prompt builder + LLM reasoning (OpenAI JSON schema mode) -> OrderExtractionResult
  -> NAV/BC integration hooks + monitoring/logging
```

Key traits:

* **Modular pipeline:** every stage implements an interface (extraction, layout, reasoning, schema) so new engines drop in
  without touching the API surface.
* **OCR-ready:** DeepSeek-OCR renders each PDF page with PyMuPDF, calls the OCR API, and returns per-page text + layout
  metadata. Chained extraction heuristics (minimum characters, alpha ratio, errors) decide when to escalate from
  pdfplumber/pypdf to OCR or future vision/table engines.
* **Profile-aware reasoning:** YAML customer profiles carry aliases, defaults, few-shot examples, and reasoning notes so the
  prompt builder can steer the LLM regardless of template chaos.
* **JSON-schema enforcement:** the schema registry provides literals + JSON Schema definitions; the reasoning layer forces
  deterministic JSON, validates via Pydantic, normalizes decimals/empty strings, and computes confidence scores.
* **Ops hooks:** centralized logging, metrics, and rate-limit placeholders allow observability, retries, and human-in-the-loop
  flows.

---

## 2. Build Artifact

1. Install dependencies (Python 3.11+ recommended).
2. Run tests: `pytest`.
3. Build container:
   ```bash
   docker build -t registry.example.com/order-ingestion:<git-sha> .
   ```
4. Push to the registry used by your deployment platform.

All environments below assume this container image.

---

## 3. Environment Configuration & Secrets

`config.py` reads environment variables only; never bake secrets into the image. Provide them at runtime via env files,
Kubernetes Secrets, or secret managers (Vault, AWS Secrets Manager, etc.).

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for reasoning engine. |
| `MODEL_NAME` | OpenAI model (default `gpt-4o-2025-09-01`). |
| `OPENAI_BASE_URL`, `OPENAI_TIMEOUT` | Optional overrides for custom gateways/timeouts. |
| `DEEPSEEK_OCR_API_KEY`, `DEEPSEEK_OCR_ENDPOINT`, `DEEPSEEK_OCR_TIMEOUT` | Credentials + endpoint for OCR. |
| `EXTRACTOR_MIN_CHARACTERS`, `EXTRACTOR_MIN_ALPHA_RATIO` | Heuristics that trigger OCR fallbacks. |
| `OCR_RENDER_DPI`, `OCR_MAX_PARALLEL_PAGES` | Controls PyMuPDF rasterization. |
| `PIPELINE_RATE_LIMIT_QPS`, `PIPELINE_MAX_RETRIES` | Future-ready knobs for throttling and retries. |
| `LOG_LEVEL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT` | Observability integrations. |

Secrets management tips:

* **Single VM / Compose:** Store credentials in a `.env` file owned by root and excluded from source control. Mount read-only.
* **Kubernetes:** Store sensitive values in a `Secret` and project them as env vars. Use sealed secrets or an external secret
  operator for GitOps workflows.
* **Rotations:** Support hot rotations by reloading pods/containers after updating the secret source.

---

## 4. Deployment Targets & Procedures

### 4.1 Single VM (Docker or systemd)

Use this for pilots or air-gapped installs.

1. Install Docker Engine and ensure outbound access to OpenAI + DeepSeek endpoints.
2. Copy `.env` with all configuration.
3. Run:
   ```bash
   docker run -d \
     --name order-ingestion \
     --env-file /opt/order/.env \
     -p 8000:8000 \
     -v /opt/order/tmp:/tmp \
     registry.example.com/order-ingestion:<git-sha>
   ```
4. Optionally wrap the container with systemd for automatic restarts.
5. Place nginx/Traefik in front for TLS, auth, and request limiting.

### 4.2 Docker Compose (single node, multiple services)

Create `docker-compose.yaml` (example below) to run FastAPI plus observability dependencies.

```yaml
version: "3.9"
services:
  api:
    image: registry.example.com/order-ingestion:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env
    ports:
      - "8000:8000"
    volumes:
      - ./tmp:/tmp
    depends_on:
      - tempo
  tempo:  # example tracing backend
    image: grafana/tempo:2.5.0
    restart: unless-stopped
    ports:
      - "3200:3200"
```

Steps:

1. `cp .env.example .env` → fill in secrets.
2. `docker compose pull && docker compose up -d`.
3. Point nginx/Traefik at `api:8000` for TLS + auth.
4. Add more services (Redis, Prometheus) as you grow.

### 4.3 Kubernetes (recommended for multi-tenant scale)

Deploy the API as a stateless Deployment; add HPA and ConfigMaps/Secrets for settings.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: order-ingestion
---
apiVersion: v1
kind: Secret
metadata:
  name: order-secrets
  namespace: order-ingestion
stringData:
  OPENAI_API_KEY: "sk-..."
  DEEPSEEK_OCR_API_KEY: "ds-..."
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
  namespace: order-ingestion
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-api
  template:
    metadata:
      labels:
        app: order-api
    spec:
      containers:
        - name: api
          image: registry.example.com/order-ingestion:latest
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: order-secrets
                  key: OPENAI_API_KEY
            - name: DEEPSEEK_OCR_API_KEY
              valueFrom:
                secretKeyRef:
                  name: order-secrets
                  key: DEEPSEEK_OCR_API_KEY
          ports:
            - containerPort: 8000
          resources:
            requests:
              cpu: "1"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "2Gi"
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: order-api
  namespace: order-ingestion
spec:
  selector:
    app: order-api
  ports:
    - port: 80
      targetPort: 8000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-api
  namespace: order-ingestion
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

Add an Ingress/IngressController for TLS, plus ServiceMonitor or OpenTelemetry collector for metrics/traces.

---

## 5. Scaling & Performance Guidance

* **Workers/replicas:** Each FastAPI process is CPU-bound during OCR rendering and I/O-bound during LLM calls. Use
  Gunicorn with multiple Uvicorn workers (e.g., `--workers 4 --worker-class uvicorn.workers.UvicornWorker`) inside the
  container, or run multiple pods/containers behind a load balancer.
* **Concurrency:** The OCR pipeline renders pages sequentially per request. For very large PDFs, consider chunking pages and
  processing in parallel via async tasks or a worker tier.
* **Horizontal scaling:** Use load balancers (NGINX, ALB, Istio) and session-less design. Persist logs/metrics outside the
  pod so new replicas can scale instantly.
* **Resource sizing:** Start with 1 vCPU + 2 GB RAM per replica. Monitor CPU spikes when OCR rendering occurs; allocate more
  CPU or switch to GPU-enabled runners if DeepSeek offers GPU acceleration.
* **Queues + workers:** For thousands of docs/day, offload extraction to a worker pool (Celery/RQ) while the API handles
  uploads + status polling.

---

## 6. Logging, Observability & Monitoring

* **Structured logs:** Include request ID, `customer_profile_id`, chosen extractor, OCR latency, confidence score, and schema
  validation status. Emit JSON logs for easy ingestion by ELK, Loki, or Cloud Logging.
* **Metrics:** Expose FastAPI metrics (request count, latency), OCR metrics (render time, DeepSeek API duration, fallback
  counts), LLM metrics (tokens per request, errors), and confidence histograms. Use Prometheus (`prometheus-fastapi-instrumentator`)
  or OpenTelemetry exporters.
* **Tracing:** Enable OTLP tracing to capture time spent in extraction vs. reasoning. Annotate spans with page counts and
  fallback decisions.
* **Alerting:** Trigger alerts on sustained OCR failures, high 5xx rates, low confidence outputs, or queue backups.

---

## 7. Security Best Practices

* **Network boundaries:** Place the API in a private subnet; expose it through a reverse proxy or API gateway with WAF.
* **TLS everywhere:** Terminate HTTPS at the edge and enforce TLS for outbound requests to OpenAI/DeepSeek.
* **Authentication/authorization:** Enable JWT or Basic auth middleware; scope tokens per tenant. Rate-limit to prevent abuse.
* **Secrets:** Store keys in dedicated secret managers; enable audit logging on access. Do not echo secrets in logs.
* **Container hardening:** Use minimal base images, run as non-root, drop unnecessary Linux capabilities, and scan images for
  vulnerabilities (Trivy, Grype).
* **Data hygiene:** PDFs are written to temp storage only; verify that `/tmp` is on an encrypted volume and scrub files after
  processing (already handled in pipeline but double-check when customizing).

---

## 8. Rollout & Rollback Procedures

1. **Versioning:** Tag Docker images with semantic versions plus commit SHAs (`v1.3.0-<sha>`).
2. **Pre-deploy checks:** Run `pytest`, linting, and optional smoke tests (e.g., `scripts/offline_extract.py sample.txt`).
3. **Blue/green or rolling updates:**
   * Compose: start a new container with the new tag, health-check, then switch traffic.
   * Kubernetes: use rolling Deployment updates or blue/green via separate Deployments + Ingress switch.
4. **Rollback:** Keep the previous image available. If metrics or logs show regression, redeploy the old tag immediately and
   investigate offline.
5. **Schema compatibility:** Avoid breaking NAV integrations by evolving the schema backwards-compatibly; add optional fields
   first, remove fields only after consumers migrate.

---

## 9. Disaster Recovery & Business Continuity

* **Backups:** Store YAML profiles, configuration, and deployment manifests in version control plus offsite backups. Back up
  any persistent stores used for logs/metrics.
* **Secrets:** Use redundant secret stores (e.g., primary + DR region). Document restore procedures.
* **Artifact retention:** Keep signed Docker images for each release to allow deterministic rebuilds. Mirror them in multiple
  registries if operating across regions.
* **Failover:** Run multiple replicas across availability zones; for global deployments, replicate in multiple regions and use
  DNS-based traffic steering.
* **Data replay:** Save raw PDFs or extracted text (if allowed) to object storage so you can reprocess after outages. Encrypt
  at rest and scrub per data-retention policies.
* **Configuration drift control:** Manage infra with IaC (Terraform, Helm) and run regular drift detection to ensure staging
  and production stay aligned.

---

## 10. Additional Recommendations

* **Human-in-the-loop:** Route low-confidence outputs (<0.6) to a review queue; record corrections for future fine-tuning.
* **Feature flags:** Wrap new extraction engines or prompt strategies with flags for safe canarying per tenant.
* **Automated health checks:** `/healthz` endpoint should verify LLM + OCR reachability so probes catch upstream outages.
* **Cost monitoring:** Track token usage (OpenAI) and OCR page counts. Set quotas/alerts to prevent runaway costs.

Following these practices, the OCR-enabled ingestion engine can evolve from small pilots to a multi-tenant, high-throughput
platform with clear operational guardrails, security boundaries, and recovery procedures.
