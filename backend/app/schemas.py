from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Simulation schemas
class SimulationBase(BaseModel):
    property_value: float
    down_payment_percentage: float
    contract_years: int
    name: Optional[str] = None
    notes: Optional[str] = None

    @validator('property_value')
    def property_value_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Property value must be positive')
        return v

    @validator('down_payment_percentage')
    def down_payment_percentage_must_be_valid(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Down payment percentage must be between 0 and 100')
        return v

    @validator('contract_years')
    def contract_years_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Contract years must be positive')
        return v

class SimulationCreate(SimulationBase):
    pass

class SimulationUpdate(SimulationBase):
    pass

class Simulation(SimulationBase):
    id: int
    user_id: int
    down_payment_value: float
    financing_amount: float
    additional_costs: float
    monthly_savings: float
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
