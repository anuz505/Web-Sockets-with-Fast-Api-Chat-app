from fastapi import FastAPI
from api.auth import auth_router
from db.database import init_db, db_connection, create_database_if_not_exists
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from core.logger import logger


origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server (default)
    "http://localhost:5174",  # Alternative Vite port hai
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8000",  # FastAPI docs
    "http://127.0.0.1:8000",  # FastAPI server
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting the application")
    try:
        await create_database_if_not_exists()
        await db_connection.connect()
        await init_db()
        logger.info("db init bhayo hai ta ")

    except Exception as e:
        logger.error(f" Startup failed: {e}", exc_info=True)
        raise

    yield
    logger.info("shutting application")
    try:
        await db_connection.disconnect()
        logger.info("database disconnectyed")
    except Exception as e:
        logger.error(f"shutting down: {e}", exc_info=True)


app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
