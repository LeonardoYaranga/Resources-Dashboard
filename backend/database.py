from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://lyaranga:tortilla@espe2210-oopsw7996.77wv341.mongodb.net/?retryWrites=true&w=majority&appName=ESPE2210-OOPSW7996"
client = AsyncIOMotorClient(MONGO_URI)

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

db = client["monitoring_system"]
users_collection = db["user"]
cpu_report_collection=db["cpu_report"]
memory_report_collection=db["memory_report"]
network_report_collection=db["network_report"]
process_report_collection=db["process_report"]
disk_report_collection=db["disk_report"]
config_collection = db["config"]



# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
# uri = "mongodb+srv://lyaranga:tortilla@espe2210-oopsw7996.77wv341.mongodb.net/?retryWrites=true&w=majority&appName=ESPE2210-OOPSW7996"
# client = MongoClient(uri, server_api=ServerApi('1'))
# try:
#     client.admin.command('ping')
#     print("Pinged your deployment. You successfully connected to MongoDB!")
# except Exception as e:
#     print(e)