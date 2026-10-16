"""StackFlow deployment target: a deliberately small, stateless FastAPI service."""
import os
from fastapi import FastAPI
from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest
from starlette.responses import Response

app = FastAPI(title="StackFlow Demo API", version="1.0.0")
counter = Counter("stackflow_demo_requests_total", "Demo requests", ["route"])

@app.get("/")
def index():
    counter.labels(route="/").inc()
    return {"service": "stackflow-demo-app", "version": os.getenv("APP_VERSION", "local"), "message": "Delivered with GitOps"}

@app.get("/health/live")
def live():
    return {"status": "alive"}

@app.get("/health/ready")
def ready():
    return {"status": "ready"}

@app.get("/metrics", include_in_schema=False)
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
