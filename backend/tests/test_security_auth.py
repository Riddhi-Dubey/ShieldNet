import pytest
from fastapi.testclient import TestClient
from backend.app.security.authentication import hash_password, verify_password


def test_password_hashing():
    pw = "SuperSecure@999"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_auth_login_flow(client: TestClient):
    # Login with initial admin user
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin@12345"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "admin"
    token = token_data["access_token"]

    # Verify protected endpoint /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "admin"

    # Invalid login
    bad_login = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "IncorrectPassword"
    })
    assert bad_login.status_code == 401


def test_unauthorized_access(client: TestClient):
    # Attempting to access /api/auth/me without token
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "credentials" in res.json()["detail"].lower()
