from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
import psutil
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket
import json
import asyncio

app = FastAPI()

# Conexión con MongoDB
MONGO_URI = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URI)
db = client["monitoring_system"]

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API de monitoreo en tiempo real"}


@app.websocket("/ws/cpu")
async def websocket_cpu(websocket: WebSocket):
    await websocket.accept()
    while True:
        frequency = psutil.cpu_freq().current if psutil.cpu_freq() else None
        
        # Obtener temperatura de la CPU (puede no estar disponible en todos los sistemas)
        temperatures = None
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if "coretemp" in temps:
                temperatures = temps["coretemp"][0].current  # Primer sensor de temperatura
        
        data = {
            "usage": psutil.cpu_percent(),
            "temp": temperatures if temperatures else "No disponible",
            "frequency": frequency, 
            "timestamp": datetime.utcnow().isoformat() 
        }
        await websocket.send_json(data)
        await asyncio.sleep(1)

@app.websocket("/ws/memoria")
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
@app.websocket("/ws/procesos")
async def websocket_procesos(websocket: WebSocket):
    await websocket.accept()
    while True:
        procesos = []
        for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            procesos.append(proc.info)  # Extrae solo la info relevante

        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "procesos": procesos
        }
        await websocket.send_json(data)
        await asyncio.sleep(2)  # Actualizar cada 2 segundos

@app.websocket("/ws/network")
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

@app.websocket("/ws/disk")
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

#//////////////////////////////////////////////////////////////////////////////////
# Endpoint GET para obtener procesos
@app.get("/procesos")
async def get_procesos():
    procesos = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
        procesos.append(proc.info)

    data = {
        "timestamp": datetime.utcnow(),
        "procesos": procesos
    }

    # Guardar en MongoDB
    await db.procesos.insert_one(data)

    return data

@app.get("/cpu")
async def get_cpu_usage():
    cpu_percent = psutil.cpu_percent(interval=1)
    frequency = psutil.cpu_freq().current
    temperature = None  # En Linux, se puede obtener con `sensors` o `lm-sensors`

    data = {
        "usage_percentage": cpu_percent,
        "frequency": frequency,
        "temperature": temperature,
        "timestamp": datetime.utcnow()
    }
    
    # Guardar en MongoDB
    await db.cpu.insert_one(data)

    return data

@app.get("/memoria")
async def get_memory_usage():
    mem = psutil.virtual_memory()

    data = {
        "total": mem.total,
        "used": mem.used,
        "free": mem.available,
        "timestamp": datetime.utcnow()
    }
    
    await db.memoria.insert_one(data)
    
    return data

@app.get("/red")
async def get_network_usage():
    net = psutil.net_io_counters()

    data = {
        "bytes_sent": net.bytes_sent,
        "bytes_received": net.bytes_recv,
        "packets_sent": net.packets_sent,
        "packets_received": net.packets_recv,
        "timestamp": datetime.utcnow()
    }
    
    await db.red.insert_one(data)
    
    return data


