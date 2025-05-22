from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    # Register and login a user
    client.post(
        "/api/auth/register",
        json={
            "username": "simuser",
            "email": "simuser@example.com",
            "password": "testpassword"
        }
    )
    response = client.post(
        "/api/auth/login",
        json={
            "username": "simuser",
            "password": "testpassword"
        }
    )
    return response.json()["access_token"]

def test_create_and_list_simulation():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    # Create simulation
    response = client.post(
        "/api/simulations",
        json={
            "property_value": 500000,
            "down_payment_percentage": 20,
            "contract_years": 30,
            "name": "Test Simulation",
            "notes": "Test notes"
        },
        headers=headers
    )
    assert response.status_code == 200
    sim_id = response.json()["id"]

    # List simulations
    response = client.get("/api/simulations", headers=headers)
    assert response.status_code == 200
    assert any(sim["id"] == sim_id for sim in response.json())