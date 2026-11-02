import uuid

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Skill, User

client = TestClient(app)


def test_cookie_auth_and_csrf():
    email = f"test-{uuid.uuid4().hex[:12]}@example.com"
    try:
        response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "secret123", "full_name": "Test User"},
        )
        assert response.status_code == 201
        assert "copilot_access" in client.cookies
        assert "copilot_csrf" in client.cookies

        me = client.get("/api/users/me")
        assert me.status_code == 200
        assert me.json()["email"] == email

        blocked = client.post(
            "/api/skills", json={"name": "Python", "proficiency": 2}
        )
        assert blocked.status_code == 403

        csrf = client.cookies.get("copilot_csrf")
        allowed = client.post(
            "/api/skills",
            json={"name": "Python", "proficiency": 2},
            headers={"X-CSRF-Token": csrf},
        )
        assert allowed.status_code == 201

        login = client.post(
            "/api/auth/login",
            json={"email": email, "password": "secret123"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]
        bearer = client.get(
            "/api/users/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert bearer.status_code == 200
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.query(Skill).filter(Skill.user_id == user.id).delete(
                synchronize_session=False
            )
            db.delete(user)
            db.commit()
        db.close()
