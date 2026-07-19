import asyncio

from core.logger import logger
from db.database import create_database_if_not_exists, db_connection, init_db


async def main():
    await create_database_if_not_exists()
    await db_connection.connect()
    try:
        await init_db()
        logger.info("Migration complete")
    finally:
        await db_connection.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
