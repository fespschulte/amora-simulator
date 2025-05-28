from fastapi.testclient import TestClient
from datetime import datetime

def test_register_user(client: TestClient):
    # Use unique email and username for each test run
    timestamp = int(datetime.now().timestamp())
    test_username = f"testuser_{timestamp}"
    test_email = f"testuser_{timestamp}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "username": test_username,
            "email": test_email,
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_username
    assert data["email"] == test_email
    assert "id" in data

def test_register_duplicate_user(client: TestClient):
    # Use a fixed username and email for duplicate test
    duplicate_username = "duplicateuser"
    duplicate_email = "duplicate@example.com"
    # Register once
    response1 = client.post(
        "/api/auth/register",
        json={
            "username": duplicate_username,
            "email": duplicate_email,
            "password": "testpassword"
        }
    )
    assert response1.status_code == 200 # Assuming first registration succeeds

    # Attempt to register with the same email (should fail)
    response2 = client.post(
        "/api/auth/register",
        json={
            "username": "anotherusername", # Different username
            "email": duplicate_email, # Same email
            "password": "anotherpassword"
        }
    )
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email already registered"

    # Attempt to register with the same username (should fail)
    response3 = client.post(
        "/api/auth/register",
        json={
            "username": duplicate_username, # Same username
            "email": "anotheremail@example.com", # Different email
            "password": "anotherpassword"
        }
    )
    assert response3.status_code == 400
    assert response3.json()["detail"] == "Username already registered"

def test_login_user(client: TestClient):
    # Register a user for login test
    login_email = "loginuser@example.com"
    login_password = "loginpassword"
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser",
            "email": login_email,
            "password": login_password
        }
    )

    # Attempt to login with the correct email and password
    response = client.post(
        "/api/auth/login",
        json={
            "email": login_email, # Login using email
            "password": login_password
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient):
    # Attempt to login with incorrect email or password
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com", # Incorrect email
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "O email e/ou a senha estão incorretos"

    # Attempt to login with correct email but wrong password
    # First, register a user
    invalid_login_email = "invalidlogin@example.com"
    client.post(
        "/api/auth/register",
        json={
            "username": "invalidlogin",
            "email": invalid_login_email,
            "password": "correctpassword"
        }
    )
    response_wrong_password = client.post(
        "/api/auth/login",
        json={
            "email": invalid_login_email, # Correct email
            "password": "wrongpassword" # Wrong password
        }
    )
    assert response_wrong_password.status_code == 401
    assert response_wrong_password.json()["detail"] == "O email e/ou a senha estão incorretos"

def test_get_current_user(client: TestClient):
    # Register and login a user to get a token
    current_user_email = "currentuser@example.com"
    current_user_password = "currentpassword"
    client.post(
        "/api/auth/register",
        json={
            "username": "currentuser",
            "email": current_user_email,
            "password": current_user_password
        }
    )
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": current_user_email,
            "password": current_user_password
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get current user info with the token
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == current_user_email
    assert "id" in user_data
    # Note: The 'username' in the response might still be the registered username
    # depending on your schema and what's returned, but email is the key for auth.

def test_get_current_user_unauthorized(client: TestClient):
    # Attempt to get current user info without a token
    response = client.get("/api/auth/me")
    assert response.status_code == 401