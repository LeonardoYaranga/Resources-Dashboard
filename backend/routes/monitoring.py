from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import psutil
import asyncio
from datetime import datetime
import json
from fastapi.websockets import WebSocket
from motor.motor_asyncio import AsyncIOMotorClient
from database import db,cpu_report_collection
from auth.jwt_handler import get_current_user


monitoring_router = APIRouter()

# @monitoring_router.websocket("/ws/cpu")
# async def websocket_cpu(websocket: WebSocket):
#     await websocket.accept()
#     while True:
#         usage = psutil.cpu_percent()
#         data = {"usage": usage, "timestamp": datetime.utcnow().isoformat()}
#         await websocket.send_json(data)
#         await asyncio.sleep(1)



# @monitoring_router.websocket("/ws/cpu")
# async def websocket_cpu(websocket: WebSocket):
#     await websocket.accept()
#     while True:
#         frequency = psutil.cpu_freq().current if psutil.cpu_freq() else None
        
#         # Obtener temperatura de la CPU (puede no estar disponible en todos los sistemas)
#         temperatures = None
#         if hasattr(psutil, "sensors_temperatures"):
#             temps = psutil.sensors_temperatures()
#             if "coretemp" in temps:
#                 temperatures = temps["coretemp"][0].current  # Primer sensor de temperatura
        
#         data = {
#             "usage": psutil.cpu_percent(),
#             "temp": temperatures if temperatures else "No disponible",
#             "frequency": frequency, 
#             "timestamp": datetime.utcnow().isoformat() 
#         }
#         await websocket.send_json(data)
#         await asyncio.sleep(1)

#####Ruta ws cpu con autenticación
@monitoring_router.websocket("/ws/cpu")
async def websocket_cpu(websocket: WebSocket, token: str):
    await websocket.accept()
    #user = await get_current_user(token, db.users)

    user = await get_current_user(token)
    if not user:
        await websocket.close()
        return

    user_id = str(user["_id"])  # Convertir ObjectId a string
    #report_date = datetime.utcnow().date()  # Fecha del reporte
    report_date = datetime.today().date()  # Esto es un objeto datetime.date
    report_date = datetime.combine(report_date, datetime.min.time()).isoformat()  # 🔥 Convertir a string

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
    report_id = result.inserted_id  # Guardar el ID del reporte creado

    buffer_data = {"usage": [], "temp": [], "frequency": [], "timestamps": []}
    start_time = datetime.utcnow()

    try:
        while True:
            # Recoger datos cada segundo
            frequency = psutil.cpu_freq().current if psutil.cpu_freq() else None
            temperatures = None
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if "coretemp" in temps:
                    temperatures = temps["coretemp"][0].current

            data = {
                "usage": psutil.cpu_percent(),
                "temp": temperatures if temperatures else "No disponible",
                "frequency": frequency,
                "timestamp": datetime.utcnow().isoformat()  
            }

            # Agregar datos al buffer
            buffer_data["usage"].append(data["usage"])
            buffer_data["temp"].append(data["temp"])
            buffer_data["frequency"].append(data["frequency"])
            buffer_data["timestamps"].append(data["timestamp"])

            await websocket.send_json(data)
            await asyncio.sleep(1)

            # Cada 1 minuto, actualizar el reporte en MongoDB
            if (datetime.utcnow() - start_time).total_seconds() >= 6000:
                await cpu_report_collection.update_one(
                    {"_id": report_id},  # Buscamos el reporte por ID
                    {"$push": {
                        "usage": {"$each": buffer_data["usage"]},
                        "temp": {"$each": buffer_data["temp"]},
                        "frequency": {"$each": buffer_data["frequency"]},
                        "timestamps": {"$each": buffer_data["timestamps"]}
                    }}
                )
                buffer_data = {"usage": [], "temp": [], "frequency": [], "timestamps": []}
                start_time = datetime.utcnow()

    except WebSocketDisconnect:
        print(f"Usuario {user_id} desconectado del WebSocket")

# Actualizar el reporte con los datos restantes     
@monitoring_router.websocket("/ws/memoria")
async def websocket_memoria(websocket: WebSocket):
    await websocket.accept()
    while True:
        mem = psutil.virtual_memory()

        data = {
            "total": mem.total,  # Memoria total en bytes
            "used": mem.used,  # Memoria usada en bytes
            "free": mem.available,  # Memoria libre en bytes
            "buffers": mem.buffers if hasattr(mem, "buffers") else "No disponible",  # Buffers (algunos sistemas no lo soportan)
            "cache": mem.cached if hasattr(mem, "cached") else "No disponible",  # Caché (algunos sistemas no lo soportan)
            "usage": mem.percent,  # Uso de memoria en porcentaje
            "timestamp": datetime.utcnow().isoformat(),
        }

        await websocket.send_json(data)
        await asyncio.sleep(1)  # Actualización cada segundo


# WebSocket para procesos en tiempo real
@monitoring_router.websocket("/ws/procesos")
async def websocket_procesos(websocket: WebSocket):
    await websocket.accept()
    while True:
        procesos = []
        for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            procesos.monitoring_routerend(proc.info)  # Extrae solo la info relevante

        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "procesos": procesos
        }
        await websocket.send_json(data)
        await asyncio.sleep(2)  # Actualizar cada 2 segundos

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