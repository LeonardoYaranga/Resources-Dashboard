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
        data = {
            "usage": psutil.cpu_percent(),
            "timestamp": datetime.utcnow().isoformat() 
        }
        await websocket.send_json(data)
        await asyncio.sleep(1)


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


