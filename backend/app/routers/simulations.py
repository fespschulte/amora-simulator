from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Simulation)
def create_simulation(
    simulation: schemas.SimulationCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.create_simulation(db=db, simulation=simulation, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Simulation])
def read_simulations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_simulations(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{simulation_id}", response_model=schemas.Simulation)
def read_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    simulation = crud.get_simulation(db, simulation_id=simulation_id)
    if simulation is None or simulation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation

@router.put("/{simulation_id}", response_model=schemas.Simulation)
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

@router.delete("/{simulation_id}")
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