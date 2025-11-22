from databases import Database
from pydantic import EmailStr
from core.config import settings
from typing import Optional
from core.logger import logger
import asyncpg


db_connection = Database(settings.database_url)


async def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    try:
        # Connect to default 'postgres' database to check/create our database
        sys_conn = await asyncpg.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            user=settings.postgres_user,
            password=settings.postgres_password,
            database="postgres",  # Connect to default database
        )

        # Check if our database exists
        exists = await sys_conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", settings.postgres_db
        )

        if not exists:
            # Create database (cannot be done in a transaction)
            await sys_conn.execute(f"CREATE DATABASE {settings.postgres_db}")
            logger.info(f"Database '{settings.postgres_db}' created")
        else:
            logger.info(f"Database '{settings.postgres_db}' already exists")

        await sys_conn.close()

    except Exception as e:
        logger.error(f" Error creating database: {e}", exc_info=True)
        raise


async def init_db():
    try:
        await db_connection.execute(
            """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
        )
        logger.debug("Users table created/verified")
        # message tables
        await db_connection.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL,
                reciever_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                is_read BOOLEAN DEFAULT FALSE,
                
                CONSTRAINT fk_sender FOREIGN KEY (sender_id)
                    REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_reciever FOREIGN KEY (reciever_id)
                    REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        logger.debug("Messages table created/verified")
        # Create indexes for better query performance
        await db_connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_reciever
            ON messages(reciever_id, created_at DESC)
            """
        )
        await db_connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_sender
            ON messages(sender_id, created_at DESC)
            """
        )
        logger.debug("Database indexes created/verified")
        await db_connection.execute(
            """
                CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                friend_id INTEGER REFERENCES users(id),
                STATUS VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id,friend_id)
                ); 
            """
        )
        await db_connection.execute(
            """
                CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
            """
        )
        await db_connection.execute(
            """
                CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
            """
        )

        logger.debug("Friendships table init")

        logger.info("✅ Database initialization complete")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)
        raise


async def get_user_by_username(username: str) -> Optional[dict]:
    try:
        row = await db_connection.fetch_one(
            query="SELECT * FROM users WHERE username = :username",
            values={"username": username},
        )
        return dict(row) if row else None
    except Exception as e:
        logger.error(
            f"Error fetching user by username '{username}': {e}", exc_info=True
        )
        return None


async def get_user_by_email(email: EmailStr) -> Optional[dict]:
    try:
        row = await db_connection.fetch_one(
            query="SELECT * FROM users WHERE email = :email", values={"email": email}
        )
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error fetching user by email '{email}': {e}", exc_info=True)
        return None
