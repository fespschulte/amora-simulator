from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from typing import Optional

from app import models, schemas
from app.auth import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Funções de autenticação
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Funções de usuário
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    # Atualizar último login
    user.last_login = datetime.utcnow()
    db.commit()
    return user

# Funções de simulação
def get_simulation(db: Session, simulation_id: int):
    return db.query(models.Simulation).filter(models.Simulation.id == simulation_id).first()

def get_simulations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Simulation).filter(
        models.Simulation.user_id == user_id
    ).offset(skip).limit(limit).all()

def create_simulation(db: Session, simulation: schemas.SimulationCreate, user_id: int):
    # Calcular valores derivados
    down_payment_value = simulation.property_value * (simulation.down_payment_percentage / 100)
    financing_amount = simulation.property_value - down_payment_value
    additional_costs = simulation.property_value * 0.15
    monthly_savings = additional_costs / (simulation.contract_years * 12)
    
    db_simulation = models.Simulation(
        user_id=user_id,
        property_value=simulation.property_value,
        down_payment_percentage=simulation.down_payment_percentage,
        contract_years=simulation.contract_years,
        down_payment_value=down_payment_value,
        financing_amount=financing_amount,
        additional_costs=additional_costs,
        monthly_savings=monthly_savings,
        name=simulation.name,
        notes=simulation.notes
    )
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def update_simulation(db: Session, simulation_id: int, simulation: schemas.SimulationUpdate):
    db_simulation = get_simulation(db, simulation_id)
    
    # Atualizar campos
    db_simulation.property_value = simulation.property_value
    db_simulation.down_payment_percentage = simulation.down_payment_percentage
    db_simulation.contract_years = simulation.contract_years
    db_simulation.name = simulation.name
    db_simulation.notes = simulation.notes
    
    # Recalcular valores derivados
    db_simulation.down_payment_value = simulation.property_value * (simulation.down_payment_percentage / 100)
    db_simulation.financing_amount = simulation.property_value - db_simulation.down_payment_value
    db_simulation.additional_costs = simulation.property_value * 0.15
    db_simulation.monthly_savings = db_simulation.additional_costs / (simulation.contract_years * 12)
    
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

def delete_simulation(db: Session, simulation_id: int):
    db_simulation = get_simulation(db, simulation_id)
    db.delete(db_simulation)
    db.commit()
    return db_simulation
