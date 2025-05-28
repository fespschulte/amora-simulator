from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime

client = TestClient(app)

def get_token(client: TestClient):
    # Use unique email and username for each test run
    timestamp = int(datetime.now().timestamp())
    test_username = f"simuser_{timestamp}"
    test_email = f"simuser_{timestamp}@example.com"

    # Register a user
    client.post(
        "/api/auth/register",
        json={
            "username": test_username,
            "email": test_email,
            "password": "testpassword"
        }
    )
    # Login using email
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_email,
            "password": "testpassword"
        }
    )
    return response.json()["access_token"]

def test_create_and_list_simulation():
    token = get_token(client)
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

def test_read_simulation():
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    # Create a simulation first
    create_response = client.post(
        "/api/simulations",
        json={
            "property_value": 600000,
            "down_payment_percentage": 25,
            "contract_years": 20,
            "name": "Read Test Simulation",
            "notes": "Notes for read test"
        },
        headers=headers
    )
    assert create_response.status_code == 200
    sim_id = create_response.json()["id"]

    # Read the created simulation
    read_response = client.get(f"/api/simulations/{sim_id}", headers=headers)
    assert read_response.status_code == 200
    read_sim_data = read_response.json()
    assert read_sim_data["id"] == sim_id
    assert read_sim_data["name"] == "Read Test Simulation"

    # Test reading a non-existent simulation
    non_existent_response = client.get("/api/simulations/99999", headers=headers)
    assert non_existent_response.status_code == 404

def test_update_simulation():
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    # Create a simulation first
    create_response = client.post(
        "/api/simulations",
        json={
            "property_value": 700000,
            "down_payment_percentage": 30,
            "contract_years": 15,
            "name": "Update Test Simulation",
            "notes": "Notes for update test"
        },
        headers=headers
    )
    assert create_response.status_code == 200
    sim_id = create_response.json()["id"]

    # Update the simulation
    updated_data = {
        "property_value": 750000,
        "down_payment_percentage": 35,
        "contract_years": 10,
        "name": "Updated Simulation Name",
        "notes": "Updated notes for test"
    }
    update_response = client.put(
        f"/api/simulations/{sim_id}",
        json=updated_data,
        headers=headers
    )
    assert update_response.status_code == 200
    updated_sim_data = update_response.json()
    assert updated_sim_data["id"] == sim_id
    assert updated_sim_data["name"] == "Updated Simulation Name"
    assert updated_sim_data["property_value"] == 750000.0

    # Test updating a non-existent simulation
    non_existent_update_response = client.put(
        "/api/simulations/99999",
        json=updated_data,
        headers=headers
    )
    assert non_existent_update_response.status_code == 404

def test_delete_simulation():
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    # Create a simulation first
    create_response = client.post(
        "/api/simulations",
        json={
            "property_value": 800000,
            "down_payment_percentage": 40,
            "contract_years": 10,
            "name": "Delete Test Simulation",
            "notes": "Notes for delete test"
        },
        headers=headers
    )
    assert create_response.status_code == 200
    sim_id = create_response.json()["id"]

    # Delete the simulation
    delete_response = client.delete(f"/api/simulations/{sim_id}", headers=headers)
    assert delete_response.status_code == 200
    assert delete_response.json() == {"detail": "Simulation deleted successfully"}

    # Verify the simulation is gone
    verify_response = client.get(f"/api/simulations/{sim_id}", headers=headers)
    assert verify_response.status_code == 404

    # Test deleting a non-existent simulation
    non_existent_delete_response = client.delete("/api/simulations/99999", headers=headers)
    assert non_existent_delete_response.status_code == 404

def test_unauthorized_simulation_access():
    # Attempt to access list without token
    response_list = client.get("/api/simulations")
    assert response_list.status_code == 401

    # Attempt to access single simulation without token
    response_single = client.get("/api/simulations/1") # Use a dummy ID
    assert response_single.status_code == 401

    # Attempt to create without token
    response_create = client.post(
        "/api/simulations",
        json={
            "property_value": 100000,
            "down_payment_percentage": 10,
            "contract_years": 5,
            "name": "Unauthorized Test",
            "notes": "Unauthorized notes"
        }
    )
    assert response_create.status_code == 401

    # Attempt to update without token
    response_update = client.put(
        "/api/simulations/1", # Use a dummy ID
        json={
            "property_value": 110000,
            "down_payment_percentage": 11,
            "contract_years": 6,
            "name": "Unauthorized Update",
            "notes": "Unauthorized notes"
        }
    )
    assert response_update.status_code == 401

    # Attempt to delete without token
    response_delete = client.delete("/api/simulations/1") # Use a dummy ID
    assert response_delete.status_code == 401