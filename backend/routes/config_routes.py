from fastapi import APIRouter, HTTPException, Request
from database import config_collection
from auth.jwt_handler import get_current_user
from bson import ObjectId  # Para manejar ObjectId

config_router = APIRouter()

@config_router.get("/")
async def get_config(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    config = await config_collection.find_one({"user_id": str(user["_id"])})
    if not config:
        default_config = {
            "user_id": str(user["_id"]),
            "save_interval": 60,
            "thresholds": {},
            "update_frequency": 1
        }
        # Insertar y capturar el documento creado
        result = await config_collection.insert_one(default_config)
        default_config["_id"] = str(result.inserted_id)  # Agregar el _id generado
        return default_config
    
    config["_id"] = str(config["_id"])
    return config

@config_router.post("/")
async def update_config(config_data: dict, request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    # Asegurar que user_id esté en config_data
    config_data["user_id"] = str(user["_id"])
    
    # Buscar el documento existente
    config = await config_collection.find_one({"user_id": config_data["user_id"]})
    if not config:
        # Esto no debería pasar, pero manejamos el caso por seguridad
        raise HTTPException(status_code=500, detail="Documento de configuración no encontrado inesperadamente")
    
    # Eliminar _id de config_data para no intentar modificarlo
    config_data.pop("_id", None)
    
    # Actualizar el documento existente usando su _id
    result = await config_collection.update_one(
        {"_id": ObjectId(config["_id"])},  # Usar ObjectId para el filtro
        {"$set": config_data}  # Usar $set para actualizar los campos
    )
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=500, detail="No se pudo actualizar la configuración")
    
    return {"message": "Configuración actualizada"}