from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.database import engine, get_db
from app.auth import get_current_user

# Criar tabelas no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="aMORA Simulator API")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de autenticação
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    # Check for duplicate email
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = crud.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.User)
def get_current_user_info(current_user: schemas.User = Depends(get_current_user)):
    return current_user

# Rotas de simulações
@app.post("/api/simulations", response_model=schemas.Simulation)
def create_simulation(
    simulation: schemas.SimulationCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.create_simulation(db=db, simulation=simulation, user_id=current_user.id)

@app.get("/api/simulations", response_model=List[schemas.Simulation])
def read_simulations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_simulations(db, user_id=current_user.id, skip=skip, limit=limit)

@app.get("/api/simulations/{simulation_id}", response_model=schemas.Simulation)
def read_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    simulation = crud.get_simulation(db, simulation_id=simulation_id)
    if simulation is None or simulation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation

@app.put("/api/simulations/{simulation_id}", response_model=schemas.Simulation)
def update_simulation(
    simulation_id: int,
    simulation: schemas.SimulationUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    db_simulation = crud.get_simulation(db, simulation_id=simulation_id)
    if db_simulation is None or db_simulation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return crud.update_simulation(db=db, simulation_id=simulation_id, simulation=simulation)

@app.delete("/api/simulations/{simulation_id}")
def delete_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    db_simulation = crud.get_simulation(db, simulation_id=simulation_id)
    if db_simulation is None or db_simulation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    crud.delete_simulation(db=db, simulation_id=simulation_id)
    return {"detail": "Simulation deleted successfully"}
