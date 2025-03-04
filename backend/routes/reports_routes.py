from fastapi import APIRouter, Request, HTTPException
from database import cpu_report_collection, memory_report_collection, network_report_collection, disk_report_collection, process_report_collection
from auth.jwt_handler import get_current_user
from bson import ObjectId

reports_router = APIRouter()

@reports_router.get("/cpu")
async def get_cpu_reports(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    reports = await cpu_report_collection.find({"user_id": str(user["_id"])}).to_list(None)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports

@reports_router.get("/memory")
async def get_memory_reports(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    reports = await memory_report_collection.find({"user_id": str(user["_id"])}).to_list(None)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports

@reports_router.get("/network")
async def get_network_reports(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    reports = await network_report_collection.find({"user_id": str(user["_id"])}).to_list(None)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports

@reports_router.get("/disk")
async def get_disk_reports(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    reports = await disk_report_collection.find({"user_id": str(user["_id"])}).to_list(None)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports

@reports_router.get("/processes")
async def get_processes_reports(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")
    token = token.split(" ")[1]
    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación fallida")
    
    reports = await process_report_collection.find({"user_id": str(user["_id"])}).to_list(None)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports