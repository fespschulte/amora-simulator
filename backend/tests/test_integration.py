import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import User, Simulation

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def test_user():
    # Create test user
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    return response.json()

@pytest.fixture
def auth_headers(test_user):
    # Login and get token
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_register_and_login_flow():
    # Test registration
    register_response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "newpassword"
        }
    )
    assert register_response.status_code == 200
    user_data = register_response.json()
    assert user_data["email"] == "new@example.com"

    # Test login
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "new@example.com",
            "password": "newpassword"
        }
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_simulation_crud_flow(auth_headers):
    # Create simulation
    create_response = client.post(
        "/api/simulations",
        json={
            "property_value": 500000,
            "down_payment_percentage": 20,
            "contract_years": 30,
            "name": "Test Simulation",
            "notes": "Test notes"
        },
        headers=auth_headers
    )
    assert create_response.status_code == 200
    sim_data = create_response.json()
    sim_id = sim_data["id"]

    # Get simulation
    get_response = client.get(f"/api/simulations/{sim_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == sim_id

    # Update simulation
    update_response = client.put(
        f"/api/simulations/{sim_id}",
        json={
            "property_value": 550000,
            "down_payment_percentage": 25,
            "contract_years": 25,
            "name": "Updated Simulation",
            "notes": "Updated notes"
        },
        headers=auth_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["property_value"] == 550000

    # List simulations
    list_response = client.get("/api/simulations", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) > 0

    # Delete simulation
    delete_response = client.delete(f"/api/simulations/{sim_id}", headers=auth_headers)
    assert delete_response.status_code == 200

    # Verify deletion
    get_deleted_response = client.get(f"/api/simulations/{sim_id}", headers=auth_headers)
    assert get_deleted_response.status_code == 404

def test_unauthorized_access():
    # Try to access protected endpoints without token
    response = client.get("/api/simulations")
    assert response.status_code == 401

def test_invalid_token():
    # Try to access protected endpoints with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/simulations", headers=headers)
    assert response.status_code == 401 