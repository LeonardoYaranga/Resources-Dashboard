from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError, jwt
from datetime import timedelta
from database import users_collection
from config import hash_password, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from auth.jwt_handler import create_access_token, get_current_user
from auth.models import UserCreate, UserLogin
from config import SECRET_KEY, ALGORITHM

auth_router = APIRouter()

@auth_router.post("/register")
async def register(user: UserCreate):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    hashed_password = hash_password(user.password)
    new_user = {"username": user.username, "email": user.email, "password": hashed_password}
    await users_collection.insert_one(new_user)

    return {"message": "Usuario registrado exitosamente"}

# @auth_router.post("/login")
# async def login(user: UserLogin):   
#     db_user = await users_collection.find_one({"email": user.email})
#     if not db_user or not verify_password(user.password, db_user["password"]):
#         raise HTTPException(status_code=400, detail="Credenciales incorrectas")

#     access_token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login")
async def login(user: UserLogin): 
    print("Datos recibidos en el login:", user.dict())  
  
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": user.email}, expires_delta)

    # Decodificamos el token para obtener la fecha de expiración
    decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = decoded_token.get("exp")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": exp  # Devolvemos la fecha de expiración
    }

# @auth_router.post("/validate")
# async def validate_token(token: str = Depends(get_current_user)):
#     if not token:
#         raise HTTPException(status_code=401, detail="Token inválido")

#     return {"message": "Token válido"}

@auth_router.post("/validate")
async def validate_token(request: Request):
    token = request.headers.get("Authorization")

    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")

    token = token.split(" ")[1]  # Extraer solo el token sin "Bearer"

    user = await get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido")

    return {"message": "Token válido"}



##Ruta protegida (para probar el token)
@auth_router.get("/protected")
async def protected_route(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"message": "Ruta protegida", "user": current_user["email"]}
