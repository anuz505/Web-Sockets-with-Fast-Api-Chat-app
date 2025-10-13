from fastapi import FastAPI
from auth import auth_router
from database import init_db
from fastapi.middleware.cors import CORSMiddleware


origins = [
    "http://localhost:3000",  # React dev server (Create React App)
    "http://localhost:5173",  # Vite dev server (default)
    "http://localhost:5174",  # Alternative Vite port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8000",  # FastAPI docs
    "http://127.0.0.1:8000",  # FastAPI server
]


init_db()
app = FastAPI()
app.include_router(auth_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
