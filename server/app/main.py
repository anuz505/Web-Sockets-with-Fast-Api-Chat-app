from fastapi import FastAPI
from api.auth import auth_router
from api.friends import friends_router
from api.websocket import websocket_router
from api.message import message_router
from db.database import init_db, db_connection, create_database_if_not_exists
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from core.logger import logger
from core.redis_service import redis_service
import asyncio


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
    listener_task = None
    try:
        await create_database_if_not_exists()
        await db_connection.connect()
        await init_db()
        logger.info("db init bhayo hai ta ")

        # Connect to Redis and start listener
        if await redis_service.connect():
            listener_task = asyncio.create_task(redis_service.start_message_listener())
            logger.info("Redis connected and listener started")
        else:
            logger.error("Failed to connect to Redis")

    except Exception as e:
        logger.error(f" Startup failed: {e}", exc_info=True)
        raise

    yield
    logger.info("shutting application")
    try:
        # Cancel Redis listener task
        if listener_task:
            listener_task.cancel()
            try:
                await listener_task
            except asyncio.CancelledError:
                logger.info("Redis listener cancelled")

        # Disconnect Redis
        await redis_service.disconnect()
        logger.info("Redis disconnected")

        # Disconnect database
        await db_connection.disconnect()
        logger.info("database disconnected")
    except Exception as e:
        logger.error(f"shutting down: {e}", exc_info=True)


app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(websocket_router)
app.include_router(friends_router)
app.include_router(message_router)
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
