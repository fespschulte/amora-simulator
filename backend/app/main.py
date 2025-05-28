from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Union
import time

from app import models, schemas, crud
from app.database import engine, get_db, Base
from app.auth import get_current_user
from app.core.logging import logger
from app.routers import auth, simulations

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="aMora API",
    description="API para o simulador de compra de imóveis aMora",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["simulations"])

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {process_time:.2f}s"
    )
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An error occurred while accessing the database"},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"},
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Rotas de autenticação
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # The test_auth.py still uses username for check, keeping this for now
    # Consider if you want to keep username unique or just email.
    # If username is just a display name, remove this check.
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    # Check for duplicate email - This is the primary unique identifier now.
    db_user_by_email = crud.get_user_by_email(db, email=user.email)
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # Authenticate using email and password
    user = crud.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O email e/ou a senha estão incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Create token using the user's email (or ID), as username might not be unique if we remove that check later
    # Using email in 'sub' is common practice
    access_token = crud.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.User)
def get_current_user_info(current_user: schemas.User = Depends(get_current_user)):
    # The get_current_user function currently uses the 'sub' from the token to get the user
    # Ensure get_current_user is updated to use email if 'sub' is email
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
