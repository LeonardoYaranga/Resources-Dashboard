from fastapi import FastAPI
import psutil
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

from auth.routes import auth_router
from routes.monitoring import monitoring_router
from routes.config_routes import config_router
from routes.reports_routes import reports_router

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(monitoring_router, prefix="/monitoring", tags=["Monitoring"])
app.include_router(config_router, prefix="/config", tags=["Config"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {"message": "API de monitoreo en tiempo real"}


#Endpoints par recursos que no son en tiempo real (websockets)
#//////////////////////////////////////////////////////////////////////////////////
# Endpoint GET para obtener procesos
# @app.get("/procesos")
# async def get_procesos():
#     procesos = []
#     for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
#         procesos.append(proc.info)

#     data = {
#         "timestamp": datetime.utcnow(),
#         "procesos": procesos
#     }

#     # Guardar en MongoDB
#     await db.procesos.insert_one(data)

#     return data

# @app.get("/cpu")
# async def get_cpu_usage():
#     cpu_percent = psutil.cpu_percent(interval=1)
#     frequency = psutil.cpu_freq().current
#     temperature = None  # En Linux, se puede obtener con `sensors` o `lm-sensors`

#     data = {
#         "usage_percentage": cpu_percent,
#         "frequency": frequency,
#         "temperature": temperature,
#         "timestamp": datetime.utcnow()
#     }
    
#     # Guardar en MongoDB
#     await db.cpu.insert_one(data)

#     return data

# @app.get("/memoria")
# async def get_memory_usage():
#     mem = psutil.virtual_memory()

#     data = {
#         "total": mem.total,
#         "used": mem.used,
#         "free": mem.available,
#         "timestamp": datetime.utcnow()
#     }
    
#     await db.memoria.insert_one(data)
    
#     return data

# @app.get("/red")
# async def get_network_usage():
#     net = psutil.net_io_counters()

#     data = {
#         "bytes_sent": net.bytes_sent,
#         "bytes_received": net.bytes_recv,
#         "packets_sent": net.packets_sent,
#         "packets_received": net.packets_recv,
#         "timestamp": datetime.utcnow()
#     }
    
#     await db.red.insert_one(data)
    
#     return data


