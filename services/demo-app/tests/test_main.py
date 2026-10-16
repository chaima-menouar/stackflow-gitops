from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "stackflow-demo-app"

def test_health():
    assert client.get("/health/live").json() == {"status": "alive"}
    assert client.get("/health/ready").json() == {"status": "ready"}

def test_prometheus_metrics():
    client.get("/")
    r = client.get("/metrics")
    assert r.status_code == 200
    assert b"stackflow_demo_requests_total" in r.content
