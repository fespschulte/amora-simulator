import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/api/auth/register",
        json={
            "username": "uniqueuser1",
            "email": "uniqueuser1@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200

def test_register_duplicate_user():
    # Register once
    client.post(
        "/api/auth/register",
        json={
            "username": "uniqueuser2",
            "email": "uniqueuser2@example.com",
            "password": "testpassword"
        }
    )
    # Try to register again with same username
    response = client.post(
        "/api/auth/register",
        json={
            "username": "uniqueuser2",
            "email": "uniqueuser2@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 400

def test_login_user():
    # Register a user
    client.post(
        "/api/auth/register",
        json={
            "username": "uniqueuser3",
            "email": "uniqueuser3@example.com",
            "password": "testpassword"
        }
    )
    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "username": "uniqueuser3",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_login_invalid_user():
    response = client.post(
        "/api/auth/login",
        json={
            "username": "nonexistent",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401