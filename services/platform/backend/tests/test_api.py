import os
import tempfile
from unittest.mock import patch

fd, path = tempfile.mkstemp(suffix=".sqlite")
os.close(fd)
os.environ["DATABASE_URL"] = f"sqlite:///{path}"
os.environ["ALLOWED_GITHUB_REPO"] = "example-owner/stackflow-gitops"
os.environ["DEV_ADMIN_API_TOKEN"] = "test-local-secret"
os.environ.pop("GITHUB_API_TOKEN", None)

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-local-secret"}

def test_health_and_authentication():
    assert client.get("/health").status_code == 200
    assert client.get("/api/projects").status_code == 401
    assert client.get("/api/projects", headers=AUTH).status_code == 200

def test_allowlist():
    assert client.post("/api/projects", headers=AUTH,
                       json={"repository": "not-allowed/anything"}).status_code == 403

def test_onboarding_and_dispatch():
    response = client.post("/api/projects", headers=AUTH,
                           json={"repository": "example-owner/stackflow-gitops"})
    assert response.status_code == 201
    project_id = response.json()["id"]
    sha = "a" * 40
    url = f"/api/projects/{project_id}/deployments"
    headers = {**AUTH, "Idempotency-Key": "test-request-0001"}
    body = {"commit_sha": sha}
    # Without GitHub integration, no misleading deployment record is created.
    assert client.post(url, headers=headers, json=body).status_code == 503
    assert client.get("/api/deployments", headers=AUTH).json() == []
    with patch("app.main.github_dispatch") as dispatch:
        accepted = client.post(url, headers=headers, json=body)
        assert accepted.status_code == 202
        assert accepted.json()["status"] == "workflow_dispatched"
        dispatch.assert_called_once()
    with patch("app.main.github_dispatch") as dispatch:
        repeated = client.post(url, headers=headers, json=body)
        assert repeated.json()["id"] == accepted.json()["id"]
        dispatch.assert_not_called()
    assert client.post(url, headers=headers, json={"commit_sha": "b" * 40}).status_code == 409
    assert client.post(url, headers={**AUTH, "Idempotency-Key": "other-key-0001"},
                       json={"commit_sha": sha, "environment": "production"}).status_code == 403
    assert len(client.get("/api/events", headers=AUTH).json()) == 1

def test_unknown_request():
    assert client.get("/api/deployments/not-a-valid-id", headers=AUTH).status_code == 404
