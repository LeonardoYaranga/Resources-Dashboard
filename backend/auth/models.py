from pydantic import BaseModel, EmailStr
from datetime import datetime
from bson import ObjectId
from typing import List, Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CPUReport(BaseModel):
    user_id: str  # Se almacena como string porque ObjectId no es serializable
    report_date: datetime  # Fecha de creación del reporte
    usage: List[float] = []  # Lista de valores de uso de CPU
    temp: List[str] = []  # Lista de temperaturas
    frequency: List[float] = []  # Lista de frecuencias
    timestamps: List[datetime] = []  # Lista de timestamps
