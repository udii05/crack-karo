from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers.get("X-Request-ID")


def test_ready():
    response = client.get("/api/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
