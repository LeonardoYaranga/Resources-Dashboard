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
        "cpu_data": [],  # Lista para almacenar datos de CPU con timestamps
    }
    result = await cpu_report_collection.insert_one(report)
    report_id = result.inserted_id

    buffer_data = {"cpu_data": []}
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
            buffer_data["cpu_data"].append(data)
           

            # Enviar datos al frontend según update_frequency
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await cpu_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "cpu_data": {"$each": buffer_data["cpu_data"]}
                    }}
                )
                buffer_data = {"cpu_data": []}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["cpu_data"]:  # Si hay datos en el buffer
            await cpu_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "cpu_data": {"$each": buffer_data["cpu_data"]}
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
        "ram_data": [],  # Lista para almacenar datos de RAM con timestamps
    }
    result = await memory_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para almacenar datos antes de guardar
    buffer_data = {
        "ram_data": []
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
            buffer_data["ram_data"].append(data)
            

            # Enviar datos al frontend según update_frequency
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await memory_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "ram_data": {"$each": buffer_data["ram_data"]}
                    }}
                )
                buffer_data = {"ram_data": []}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["ram_data"]:  # Si hay datos en el buffer
            await memory_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "ram_data": {"$each": buffer_data["ram_data"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")


# @monitoring_router.websocket("/ws/procesos")
# async def websocket_procesos(websocket: WebSocket, token: str):
#     await websocket.accept()

#     # Validar autenticación con JWT
#     user = await get_current_user(token)
#     if not user:
#         await websocket.close(code=1008)  # Código de cierre por política (auth fallida)
#         return

#     user_id = str(user["_id"])
#     report_date = datetime.today().date()
#     report_date = datetime.combine(report_date, datetime.min.time()).isoformat()

#     # Crear un reporte vacío en MongoDB
#     report = {
#         "user_id": user_id,
#         "report_date": report_date,
#         "processes": [],  # Lista de procesos con timestamps
#     }
#     result = await process_report_collection.insert_one(report)
#     report_id = result.inserted_id

#     # Buffer para almacenar datos antes de guardar
#     buffer_data = {"processes": []}
#     start_time = datetime.utcnow()

#     # Obtener configuración del usuario
#     config = await config_collection.find_one({"user_id": user_id})
#     if not config:
#         config = {"save_interval": 60, "update_frequency": 2}  # Valores por defecto

#     try:
#         while True:
#             procesos = []
#             for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
#                 procesos.append(proc.info)  # Extrae solo la info relevante

#             data = {
#                 "timestamp": datetime.utcnow().isoformat(),
#                 "procesos": procesos
#             }

#             # Agregar al buffer
#             buffer_data["processes"].append(data)

#             # Enviar datos al frontend
#             await websocket.send_json(data)
#             await asyncio.sleep(config["update_frequency"])

#             # Guardar en MongoDB según save_interval
#             if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
#                 await process_report_collection.update_one(
#                     {"_id": report_id},
#                     {"$push": {
#                         "processes": {"$each": buffer_data["processes"]}
#                     }}
#                 )
#                 buffer_data = {"processes": []}
#                 start_time = datetime.utcnow()

#     except WebSocketDisconnect:
#         # Guardar datos restantes al desconectarse
#         if buffer_data["processes"]:  # Si hay datos en el buffer
#             await process_report_collection.update_one(
#                 {"_id": report_id},
#                 {"$push": {
#                     "processes": {"$each": buffer_data["processes"]}
#                 }}
#             )
#         print(f"Usuario {user_id} desconectado del WebSocket")


@monitoring_router.websocket("/ws/procesos")
async def websocket_procesos(websocket: WebSocket, token: str):
    await websocket.accept()
    user = await get_current_user(token)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = str(user["_id"])
    report_date = datetime.today().date()
    report_date = datetime.combine(report_date, datetime.min.time()).isoformat()

    # Crear un reporte vacío con snapshot inicial
    initial_processes = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
        proc_info = proc.info
        proc_info["timestamp"] = datetime.utcnow().isoformat()
        initial_processes.append(proc_info)

    report = {
        "user_id": user_id,
        "report_date": report_date,
        "processes": {
            "initial_snapshot": initial_processes,
            "updates": []
        }
    }
    result = await process_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para cambios y estado anterior
    buffer_data = {"updates": []}
    last_processes = {p["pid"]: p for p in initial_processes}  # Diccionario para comparación
    start_time = datetime.utcnow()

    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 2}

    try:
        while True:
            current_processes = {}
            for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                current_processes[proc.info["pid"]] = proc.info

            # Detectar cambios
            changes = []
            timestamp = datetime.utcnow().isoformat()

            # Nuevos procesos o actualizaciones
            for pid, proc in current_processes.items():
                if pid not in last_processes:
                    changes.append({"pid": pid, "name": proc["name"], "cpu_percent": proc["cpu_percent"], "memory_percent": proc["memory_percent"], "status": proc["status"], "action": "added"})
                else:
                    last_proc = last_processes[pid]
                    cpu_diff = abs(proc["cpu_percent"] - last_proc["cpu_percent"])
                    mem_diff = abs(proc["memory_percent"] - last_proc["memory_percent"])
                    if cpu_diff > 1.0 or mem_diff > 0.1 or proc["status"] != last_proc["status"]:  # Umbrales de cambio
                        changes.append({"pid": pid, "name": proc["name"], "cpu_percent": proc["cpu_percent"], "memory_percent": proc["memory_percent"], "status": proc["status"], "action": "updated"})

            # Procesos terminados
            for pid in last_processes:
                if pid not in current_processes:
                    changes.append({"pid": pid, "name": last_processes[pid]["name"], "action": "terminated"})

            # Solo guardar si hay cambios
            if changes:
                buffer_data["updates"].append({"timestamp": timestamp, "changes": changes})

            # Enviar datos al frontend (lista completa para compatibilidad con el frontend actual)
            data = {"timestamp": timestamp, "procesos": list(current_processes.values())}
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                if buffer_data["updates"]:
                    await process_report_collection.update_one(
                        {"_id": report_id},
                        {"$push": {"processes.updates": {"$each": buffer_data["updates"]}}}
                    )
                    buffer_data["updates"] = []
                start_time = datetime.utcnow()

            # Actualizar estado anterior
            last_processes = current_processes

    except WebSocketDisconnect:
        if buffer_data["updates"]:
            await process_report_collection.update_one(
                {"_id": report_id},
                {"$push": {"processes.updates": {"$each": buffer_data["updates"]}}}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")
        

@monitoring_router.websocket("/ws/network")
async def websocket_network(websocket: WebSocket, token: str):
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
        "network_data": [],  # Lista para almacenar datos de red con timestamps
    }
    result = await network_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para almacenar datos antes de guardar
    buffer_data = {"network_data": []}
    start_time = datetime.utcnow()

    # Obtener configuración del usuario
    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 1}  # Valores por defecto

    # Obtener valores iniciales para calcular la velocidad
    prev_counters = psutil.net_io_counters()

    try:
        while True:
            current_counters = psutil.net_io_counters()

            data = {
                "bytes_sent": current_counters.bytes_sent,
                "bytes_recv": current_counters.bytes_recv,
                "packets_sent": current_counters.packets_sent,
                "packets_recv": current_counters.packets_recv,
                "errors_in": current_counters.errin,
                "errors_out": current_counters.errout,
                "drop_in": current_counters.dropin,
                "drop_out": current_counters.dropout,
                "speed_sent": (current_counters.bytes_sent - prev_counters.bytes_sent) / config["update_frequency"],  # Ajustar velocidad por intervalo
                "speed_recv": (current_counters.bytes_recv - prev_counters.bytes_recv) / config["update_frequency"],
                "timestamp": datetime.utcnow().isoformat()
            }

            # Agregar al buffer
            buffer_data["network_data"].append(data)

            # Enviar datos al frontend
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await network_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "network_data": {"$each": buffer_data["network_data"]}
                    }}
                )
                buffer_data = {"network_data": []}
                start_time = datetime.utcnow()

            # Actualizar valores previos
            prev_counters = current_counters

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["network_data"]:
            await network_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "network_data": {"$each": buffer_data["network_data"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")


@monitoring_router.websocket("/ws/disk")
async def websocket_disk(websocket: WebSocket, token: str):
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
        "disk_data": [],  # Lista para almacenar datos de disco con timestamps
    }
    result = await disk_report_collection.insert_one(report)
    report_id = result.inserted_id

    # Buffer para almacenar datos antes de guardar
    buffer_data = {"disk_data": []}
    start_time = datetime.utcnow()

    # Obtener configuración del usuario
    config = await config_collection.find_one({"user_id": user_id})
    if not config:
        config = {"save_interval": 60, "update_frequency": 1}  # Valores por defecto

    # Obtener valores iniciales para calcular velocidades
    prev_io_counters = psutil.disk_io_counters()

    try:
        while True:
            disk_usage = psutil.disk_usage("/")  # Usa la partición raíz "/"
            current_io_counters = psutil.disk_io_counters()

            data = {
                "total": disk_usage.total,
                "used": disk_usage.used,
                "free": disk_usage.free,
                "percent": disk_usage.percent,
                "read_speed": (current_io_counters.read_bytes - prev_io_counters.read_bytes) / 2,
                "write_speed": (current_io_counters.write_bytes - prev_io_counters.write_bytes) / 2,
                "read_count": current_io_counters.read_count,
                "write_count": current_io_counters.write_count,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Agregar al buffer
            buffer_data["disk_data"].append(data)

            # Enviar datos al frontend
            await websocket.send_json(data)
            await asyncio.sleep(config["update_frequency"])

            # Guardar en MongoDB según save_interval
            if (datetime.utcnow() - start_time).total_seconds() >= config["save_interval"]:
                await disk_report_collection.update_one(
                    {"_id": report_id},
                    {"$push": {
                        "disk_data": {"$each": buffer_data["disk_data"]}
                    }}
                )
                buffer_data = {"disk_data": []}
                start_time = datetime.utcnow()

            # Actualizar valores previos
            prev_io_counters = current_io_counters

    except WebSocketDisconnect:
        # Guardar datos restantes al desconectarse
        if buffer_data["disk_data"]:
            await disk_report_collection.update_one(
                {"_id": report_id},
                {"$push": {
                    "disk_data": {"$each": buffer_data["disk_data"]}
                }}
            )
        print(f"Usuario {user_id} desconectado del WebSocket")