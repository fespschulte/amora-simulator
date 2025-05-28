import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import models
from app import crud
from app import schemas
from app.main import app # Corrigir importação do app

# Configurar o banco de dados de teste SQLite em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fixture para criar e derrubar o banco de dados para cada teste
@pytest.fixture
def db():
    # Criar tabelas
    Base.metadata.create_all(bind=engine)

    # Obter uma nova sessão de teste
    db_session = TestingSessionLocal()

    try:
        yield db_session
    finally:
        # Fechar a sessão
        db_session.close()
        # Derrubar tabelas
        Base.metadata.drop_all(bind=engine)

# Fixture para sobrescrever a dependência get_db do FastAPI
@pytest.fixture
def override_get_db(db):
    def _override_get_db():
        yield db
    app.dependency_overrides[crud.get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()

# Teste para criar um usuário
def test_create_user(db):
    user_data = schemas.UserCreate(username="testuser", email="test@example.com", password="testpassword123")
    db_user = crud.create_user(db=db, user=user_data)

    assert db_user is not None
    assert db_user.username == "testuser"
    assert db_user.email == "test@example.com"
    assert hasattr(db_user, "password_hash")
    assert db_user.id is not None

    fetched_user = crud.get_user_by_email(db=db, email="test@example.com")
    assert fetched_user is not None
    assert fetched_user.email == "test@example.com"
    assert fetched_user.username == "testuser"

# Teste para criar uma simulação e verificar cálculos
def test_create_simulation(db):
    # Primeiro, crie um usuário, pois simulações estão vinculadas a um usuário
    user_data = schemas.UserCreate(username="simuser", email="sim@example.com", password="testpassword456")
    db_user = crud.create_user(db=db, user=user_data)

    # Dados de entrada para a simulação
    simulation_data = schemas.SimulationCreate(
        property_value=500000.0,
        down_payment_percentage=20.0,
        contract_years=30,
        name="Minha Primeira Sim",
        notes="Testando os cálculos",
    )

    # Criar a simulação usando a função CRUD
    db_simulation = crud.create_simulation(db=db, simulation=simulation_data, user_id=db_user.id)

    # Verificar se a simulação foi criada corretamente
    assert db_simulation is not None
    assert db_simulation.user_id == db_user.id
    assert db_simulation.property_value == 500000.0
    assert db_simulation.down_payment_percentage == 20.0
    assert db_simulation.contract_years == 30
    assert db_simulation.name == "Minha Primeira Sim"
    assert db_simulation.notes == "Testando os cálculos"
    assert db_simulation.id is not None

    # Verificar os valores calculados
    expected_down_payment_value = 500000.0 * (20.0 / 100)
    expected_financing_amount = 500000.0 - expected_down_payment_value
    expected_additional_costs = 500000.0 * 0.15
    expected_monthly_savings = expected_additional_costs / (30 * 12)

    assert db_simulation.down_payment_value == expected_down_payment_value
    assert db_simulation.financing_amount == expected_financing_amount
    assert db_simulation.additional_costs == expected_additional_costs
    # Usar pytest.approx para comparação de floats para evitar problemas de precisão
    assert db_simulation.monthly_savings == pytest.approx(expected_monthly_savings)

# Teste para obter uma simulação por ID
def test_get_simulation(db):
    # Crie um usuário e uma simulação primeiro
    user_data = schemas.UserCreate(username="getuser", email="get@example.com", password="testpassword789")
    db_user = crud.create_user(db=db, user=user_data)
    simulation_data = schemas.SimulationCreate(
        property_value=100000.0,
        down_payment_percentage=10.0,
        contract_years=10,
    )
    created_simulation = crud.create_simulation(db=db, simulation=simulation_data, user_id=db_user.id)

    # Obter a simulação pelo ID
    fetched_simulation = crud.get_simulation(db=db, simulation_id=created_simulation.id)

    # Verificar se a simulação foi encontrada e os dados estão corretos
    assert fetched_simulation is not None
    assert fetched_simulation.id == created_simulation.id
    assert fetched_simulation.property_value == 100000.0
    assert fetched_simulation.user_id == db_user.id

    # Testar obter uma simulação que não existe
    not_found_simulation = crud.get_simulation(db=db, simulation_id=999)
    assert not_found_simulation is None

# Teste para obter todas as simulações para um usuário
def test_get_simulations_for_user(db):
    # Crie dois usuários
    user1_data = schemas.UserCreate(username="user1", email="user1@example.com", password="testpass1")
    db_user1 = crud.create_user(db=db, user=user1_data)

    user2_data = schemas.UserCreate(username="user2", email="user2@example.com", password="testpass2")
    db_user2 = crud.create_user(db=db, user=user2_data)

    # Crie simulações para o usuário 1
    sim1_user1_data = schemas.SimulationCreate(property_value=100, down_payment_percentage=10, contract_years=10, name="User1 Sim1")
    crud.create_simulation(db=db, simulation=sim1_user1_data, user_id=db_user1.id)
    sim2_user1_data = schemas.SimulationCreate(property_value=200, down_payment_percentage=20, contract_years=20, name="User1 Sim2")
    crud.create_simulation(db=db, simulation=sim2_user1_data, user_id=db_user1.id)

    # Crie uma simulação para o usuário 2
    sim1_user2_data = schemas.SimulationCreate(property_value=300, down_payment_percentage=30, contract_years=30, name="User2 Sim1")
    crud.create_simulation(db=db, simulation=sim1_user2_data, user_id=db_user2.id)

    # Obter simulações para o usuário 1
    user1_simulations = crud.get_simulations(db=db, user_id=db_user1.id)
    assert len(user1_simulations) == 2
    assert all(sim.user_id == db_user1.id for sim in user1_simulations)
    assert {sim.name for sim in user1_simulations} == {"User1 Sim1", "User1 Sim2"}

    # Obter simulações para o usuário 2
    user2_simulations = crud.get_simulations(db=db, user_id=db_user2.id)
    assert len(user2_simulations) == 1
    assert user2_simulations[0].user_id == db_user2.id
    assert user2_simulations[0].name == "User2 Sim1"

    # Obter simulações para um usuário sem simulações
    user3_data = schemas.UserCreate(username="user3", email="user3@example.com", password="testpass3")
    db_user3 = crud.create_user(db=db, user=user3_data)
    user3_simulations = crud.get_simulations(db=db, user_id=db_user3.id)
    assert len(user3_simulations) == 0

# Teste para atualizar uma simulação e verificar recálculos
def test_update_simulation(db):
    # Crie um usuário e uma simulação inicial
    user_data = schemas.UserCreate(username="updateuser", email="update@example.com", password="testpassword_u")
    db_user = crud.create_user(db=db, user=user_data)
    initial_simulation_data = schemas.SimulationCreate(
        property_value=400000.0,
        down_payment_percentage=25.0,
        contract_years=20,
        name="Sim Inicial",
        notes="Notas iniciais",
    )
    created_simulation = crud.create_simulation(db=db, simulation=initial_simulation_data, user_id=db_user.id)

    # Verificar valores iniciais calculados
    assert created_simulation.down_payment_value == 400000.0 * 0.25
    assert created_simulation.financing_amount == 400000.0 - created_simulation.down_payment_value
    assert created_simulation.additional_costs == 400000.0 * 0.15
    assert created_simulation.monthly_savings == pytest.approx((400000.0 * 0.15) / (20 * 12))

    # Dados de atualização para a simulação
    update_data = schemas.SimulationUpdate(
        property_value=600000.0,
        down_payment_percentage=30.0,
        contract_years=15,
        name="Sim Atualizada",
        notes="Notas atualizadas",
    )

    # Atualizar a simulação
    updated_simulation = crud.update_simulation(db=db, simulation_id=created_simulation.id, simulation=update_data)

    # Verificar se a simulação foi atualizada corretamente
    assert updated_simulation is not None
    assert updated_simulation.id == created_simulation.id
    assert updated_simulation.user_id == db_user.id # User ID não deve mudar na atualização
    assert updated_simulation.property_value == 600000.0
    assert updated_simulation.down_payment_percentage == 30.0
    assert updated_simulation.contract_years == 15
    assert updated_simulation.name == "Sim Atualizada"
    assert updated_simulation.notes == "Notas atualizadas"

    # Verificar se os valores calculados foram recalculados corretamente
    expected_updated_down_payment_value = 600000.0 * (30.0 / 100)
    expected_updated_financing_amount = 600000.0 - expected_updated_down_payment_value
    expected_updated_additional_costs = 600000.0 * 0.15
    expected_updated_monthly_savings = expected_updated_additional_costs / (15 * 12)

    assert updated_simulation is not None
    assert updated_simulation.down_payment_value == expected_updated_down_payment_value
    assert updated_simulation.financing_amount == expected_updated_financing_amount
    assert updated_simulation.additional_costs == expected_updated_additional_costs
    assert updated_simulation.monthly_savings == pytest.approx(expected_updated_monthly_savings)

    # Testar atualizar uma simulação que não existe
    not_found_update = crud.update_simulation(db=db, simulation_id=999, simulation=update_data)
    assert not_found_update is None

# Teste para deletar uma simulação
def test_delete_simulation(db):
    # Crie um usuário e uma simulação
    user_data = schemas.UserCreate(username="deleteuser", email="delete@example.com", password="testpassword_d")
    db_user = crud.create_user(db=db, user=user_data)
    simulation_data = schemas.SimulationCreate(
        property_value=700000.0,
        down_payment_percentage=10.0,
        contract_years=5,
    )
    created_simulation = crud.create_simulation(db=db, simulation=simulation_data, user_id=db_user.id)

    # Verificar que a simulação existe antes de deletar
    assert crud.get_simulation(db=db, simulation_id=created_simulation.id) is not None

    # Deletar a simulação
    deleted_simulation = crud.delete_simulation(db=db, simulation_id=created_simulation.id)

    # Verificar se a simulação retornada pela função delete é a correta
    assert deleted_simulation is not None
    assert deleted_simulation.id == created_simulation.id

    # Verificar que a simulação não existe mais no banco de dados
    assert crud.get_simulation(db=db, simulation_id=created_simulation.id) is None

    # Testar deletar uma simulação que não existe
    not_found_delete = crud.delete_simulation(db=db, simulation_id=999)
    assert not_found_delete is None

# Teste de edge case para cálculo com contract_years = 0
def test_create_simulation_zero_years(db):
    user_data = schemas.UserCreate(username="zeroyearsuser", email="zero@example.com", password="testpass0")
    db_user = crud.create_user(db=db, user=user_data)

    simulation_data = schemas.SimulationCreate(
        property_value=100000.0,
        down_payment_percentage=10.0,
        contract_years=0,
        name="Zero Years Sim",
    )

    db_simulation = crud.create_simulation(db=db, simulation=simulation_data, user_id=db_user.id)

    # Verificar se os cálculos lidam corretamente com anos = 0
    expected_down_payment_value = 100000.0 * 0.10
    expected_financing_amount = 100000.0 - expected_down_payment_value
    expected_additional_costs = 100000.0 * 0.15
    # De acordo com a lógica implementada, monthly_savings será igual a additional_costs se contract_years for 0
    expected_monthly_savings = expected_additional_costs

    assert db_simulation.down_payment_value == expected_down_payment_value
    assert db_simulation.financing_amount == expected_financing_amount
    assert db_simulation.additional_costs == expected_additional_costs
    assert db_simulation.monthly_savings == expected_monthly_savings

# Teste de edge case para atualização com contract_years = 0
def test_update_simulation_zero_years(db):
    user_data = schemas.UserCreate(username="updatezeroyearsuser", email="updatezero@example.com", password="testpass_u0")
    db_user = crud.create_user(db=db, user=user_data)
    initial_simulation_data = schemas.SimulationCreate(
        property_value=200000.0,
        down_payment_percentage=20.0,
        contract_years=10,
        name="Sim Update Zero",
    )
    created_simulation = crud.create_simulation(db=db, simulation=initial_simulation_data, user_id=db_user.id)

    # Dados de atualização com anos = 0
    update_data = schemas.SimulationUpdate(
        property_value=200000.0,
        down_payment_percentage=20.0,
        contract_years=0,
        name="Sim Update Zero",
        notes="Testing zero years update",
    )

    updated_simulation = crud.update_simulation(db=db, simulation_id=created_simulation.id, simulation=update_data)

    # Verificar se os cálculos lidam corretamente com anos = 0 na atualização
    expected_down_payment_value = 200000.0 * 0.20
    expected_financing_amount = 200000.0 - expected_down_payment_value
    expected_additional_costs = 200000.0 * 0.15
    # De acordo com a lógica implementada, monthly_savings será igual a additional_costs se contract_years for 0
    expected_monthly_savings = expected_additional_costs

    assert updated_simulation is not None
    assert updated_simulation.down_payment_value == expected_down_payment_value
    assert updated_simulation.financing_amount == expected_financing_amount
    assert updated_simulation.additional_costs == expected_additional_costs
    assert updated_simulation.monthly_savings == expected_monthly_savings 