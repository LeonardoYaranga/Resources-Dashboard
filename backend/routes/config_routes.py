#Permite modificar umbrales y frecuencias desde el frontend.

from fastapi import APIRouter, HTTPException
from database import config_collection

config_router = APIRouter()

@config_router.post("/set_config")
async def set_config(config: dict):
    if "cpu_threshold" not in config or "update_interval" not in config:
        raise HTTPException(status_code=400, detail="Configuración inválida")

    await config_collection.update_one({}, {"$set": config}, upsert=True)
    return {"message": "Configuración actualizada"}

@config_router.get("/get_config")
async def get_config():
    config = await config_collection.find_one({}, {"_id": 0})
    return config if config else {"cpu_threshold": 80, "update_interval": 1}
