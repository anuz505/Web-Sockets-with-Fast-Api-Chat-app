from fastapi import FastAPI
from auth import auth_router
from database import init_db

init_db()
app = FastAPI()
app.include_router(auth_router)
