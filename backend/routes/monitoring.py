from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import psutil
import asyncio
from datetime import datetime
import json
from fastapi.websockets import WebSocket
from motor.motor_asyncio import AsyncIOMotorClient
from database import db,config_collection,cpu_report_collection,memory_report_collection,network_report_collection,process_report_collection,disk_report_collection
from auth.jwt_handler import get_current_user
from bson import ObjectId  # Para manejar IDs de MongoDB

monitoring_router = APIRouter()

@monitoring_router.websocket("/ws/cpu")
async def websocket_cpu(websocket: WebSocket, token: str):
    await websocket.accept()
    user = await get_current_user(token)
    if not user:
        await websocket.close()
        return

    user_id = str(user["_id"])
    report_date = datetime.today().date()
    report_date = datetime.combine(report_date, datetime.min.time()).isoformat()

    # Crear un reporte vacío al iniciar la conexión
    report = {
        "user_id": user_id,
        "report_date": report_date,
        "usage": [],
        "temp": [],
        "frequency": [],
        "timestamps": []
    }
    result = await cpu_report_collection.insert_one(report)
    report_id = result.inserted_id

    buffer_data = {"usage": [], "temp": [], "frequency": [], "timestamps": []}
    start_time = datetime.utcnow()

    # Obtener configuración del usuario
    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 1}  # Valores por defecto

    try:
        while True:
            # Recoger datos de CPU
            frequency = psutil.cpu_freq().current if psutil.cpu_freq() else None
            temperatures = None
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if "coretemp" in temps:
                    temperatures = temps["coretemp"][0].current

            data = {
                "usage": psutil.cpu_percent(),
                "temp": temperatures if temperatures else None,  # Cambié "No disponible" a None para facilitar manejo en frontend
                "frequency": frequency,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Agregar datos al buffer
            buffer_data["usage"].append(data["usage"])
            buffer_data["temp"].append(data["temp"])
            buffer_data["frequency"].append(data["frequency"])
            buffer_data["timestamps"].append(data["timestamp"])

            # Enviar datos al frontend según update_frequency
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await cpu_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "usage": {"$each": buffer_data["usage"]},
                        "temp": {"$each": buffer_data["temp"]},
                        "frequency": {"$each": buffer_data["frequency"]},
                        "timestamps": {"$each": buffer_data["timestamps"]}
                    }}
                )
                buffer_data = {key: [] for key in buffer_data}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["timestamps"]:  # Si hay datos en el buffer
            await cpu_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "usage": {"$each": buffer_data["usage"]},
                    "temp": {"$each": buffer_data["temp"]},
                    "frequency": {"$each": buffer_data["frequency"]},
                    "timestamps": {"$each": buffer_data["timestamps"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")

@monitoring_router.websocket("/ws/memoria")
async def websocket_memoria(websocket: WebSocket, token: str):
    await websocket.accept()

    # Validar autenticación con JWT
    user = await get_current_user(token)
    if not user:
        await websocket.close(code=1008)  # Código de cierre por política (auth fallida)
        return

    user_id = str(user["_id"])
    report_date = datetime.today().date()
    report_date = datetime.combine(report_date, datetime.min.time()).isoformat()

    # Crear un reporte vacío en MongoDB
    report = {
        "user_id": user_id,
        "report_date": report_date,
        "total": [],
        "used": [],
        "free": [],
        "buffers": [],
        "cache": [],
        "usage": [],
        "timestamps": []
    }
    result = await memory_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para almacenar datos antes de guardar
    buffer_data = {
        "total": [], "used": [], "free": [], "buffers": [], "cache": [],
        "usage": [], "timestamps": []
    }
    start_time = datetime.utcnow()

    # Obtener configuración del usuario
    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 1}  # Valores por defecto

    try:
        while True:
            mem = psutil.virtual_memory()
            data = {
                "total": mem.total,
                "used": mem.used,
                "free": mem.available,
                "buffers": mem.buffers if hasattr(mem, "buffers") else None,
                "cache": mem.cached if hasattr(mem, "cached") else None,
                "usage": mem.percent,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Agregar al buffer
            buffer_data["total"].append(data["total"])
            buffer_data["used"].append(data["used"])
            buffer_data["free"].append(data["free"])
            buffer_data["buffers"].append(data["buffers"])
            buffer_data["cache"].append(data["cache"])
            buffer_data["usage"].append(data["usage"])
            buffer_data["timestamps"].append(data["timestamp"])

            # Enviar datos al frontend según update_frequency
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await memory_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "total": {"$each": buffer_data["total"]},
                        "used": {"$each": buffer_data["used"]},
                        "free": {"$each": buffer_data["free"]},
                        "buffers": {"$each": buffer_data["buffers"]},
                        "cache": {"$each": buffer_data["cache"]},
                        "usage": {"$each": buffer_data["usage"]},
                        "timestamps": {"$each": buffer_data["timestamps"]}
                    }}
                )
                buffer_data = {key: [] for key in buffer_data}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["timestamps"]:  # Si hay datos en el buffer
            await memory_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "total": {"$each": buffer_data["total"]},
                    "used": {"$each": buffer_data["used"]},
                    "free": {"$each": buffer_data["free"]},
                    "buffers": {"$each": buffer_data["buffers"]},
                    "cache": {"$each": buffer_data["cache"]},
                    "usage": {"$each": buffer_data["usage"]},
                    "timestamps": {"$each": buffer_data["timestamps"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")


@monitoring_router.websocket("/ws/procesos")
async def websocket_procesos(websocket: WebSocket, token: str):
    await websocket.accept()

    # Validar autenticación con JWT
    user = await get_current_user(token)
    if not user:
        await websocket.close(code=1008)  # Código de cierre por política (auth fallida)
        return

    user_id = str(user["_id"])
    report_date = datetime.today().date()
    report_date = datetime.combine(report_date, datetime.min.time()).isoformat()

    # Crear un reporte vacío en MongoDB
    report = {
        "user_id": user_id,
        "report_date": report_date,
        "processes": [],  # Lista de procesos con timestamps
    }
    result = await process_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para almacenar datos antes de guardar
    buffer_data = {"processes": []}
    start_time = datetime.utcnow()

    # Obtener configuración del usuario
    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 2}  # Valores por defecto

    try:
        while True:
            procesos = []
            for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                procesos.append(proc.info)  # Extrae solo la info relevante

            data = {
                "timestamp": datetime.utcnow().isoformat(),
                "procesos": procesos
            }

            # Agregar al buffer
            buffer_data["processes"].append(data)

            # Enviar datos al frontend
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await process_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "processes": {"$each": buffer_data["processes"]}
                    }}
                )
                buffer_data = {"processes": []}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["processes"]:  # Si hay datos en el buffer
            await process_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "processes": {"$each": buffer_data["processes"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")


@monitoring_router.websocket("/ws/network")
async def websocket_network(websocket: WebSocket):
    await websocket.accept()
    
    # Obtener valores iniciales para calcular la velocidad de transmisión
    prev_counters = psutil.net_io_counters()

    while True:
        current_counters = psutil.net_io_counters()

        data = {
            "bytes_sent": current_counters.bytes_sent,  # Total de bytes enviados
            "bytes_recv": current_counters.bytes_recv,  # Total de bytes recibidos
            "packets_sent": current_counters.packets_sent,  # Total de paquetes enviados
            "packets_recv": current_counters.packets_recv,  # Total de paquetes recibidos
            "errors_in": current_counters.errin,  # Errores de entrada
            "errors_out": current_counters.errout,  # Errores de salida
            "drop_in": current_counters.dropin,  # Paquetes descartados de entrada
            "drop_out": current_counters.dropout,  # Paquetes descartados de salida
            "speed_sent": (current_counters.bytes_sent - prev_counters.bytes_sent) / 2,  # Velocidad de subida (bytes/s)
            "speed_recv": (current_counters.bytes_recv - prev_counters.bytes_recv) / 2,  # Velocidad de bajada (bytes/s)
            "timestamp": datetime.utcnow().isoformat()
        }

        await websocket.send_json(data)

        # Actualizar valores previos
        prev_counters = current_counters

        await asyncio.sleep(1)  

@monitoring_router.websocket("/ws/disk")
async def websocket_disk(websocket: WebSocket):
    await websocket.accept()
    
    prev_io_counters = psutil.disk_io_counters()

    while True:
        disk_usage = psutil.disk_usage("/")  # Usa la partición raíz "/"
        current_io_counters = psutil.disk_io_counters()

        data = {
            "total": disk_usage.total,  # Espacio total en bytes
            "used": disk_usage.used,  # Espacio usado en bytes
            "free": disk_usage.free,  # Espacio libre en bytes
            "percent": disk_usage.percent,  # Porcentaje de uso del disco
            "read_speed": (current_io_counters.read_bytes - prev_io_counters.read_bytes) / 2,  # Velocidad de lectura (bytes/s)
            "write_speed": (current_io_counters.write_bytes - prev_io_counters.write_bytes) / 2,  # Velocidad de escritura (bytes/s)
            "read_count": current_io_counters.read_count,  # Número total de lecturas
            "write_count": current_io_counters.write_count,  # Número total de escrituras
            "timestamp": datetime.utcnow().isoformat(),
        }

        await websocket.send_json(data)
        prev_io_counters = current_io_counters
        await asyncio.sleep(1)  # Actualización cada 2 segundos