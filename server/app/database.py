import psycopg2
from contextlib import contextmanager
from config import DB_CONFIG
from typing import Annotated
from fastapi import Depends
from pydantic import EmailStr


@contextmanager
def get_db():
    connection = psycopg2.connect(**DB_CONFIG)
    try:
        yield connection
    finally:
        connection.close()


db_dependency = Annotated[psycopg2.extensions.connection, Depends(get_db)]


def init_db():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS users")
            cursor.execute(
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
            conn.commit()
            cursor.close()
            print("Database init bhayo hai")
    except psycopg2.Error as e:
        print(f"An error occured on the database init: {e}")


def get_user_by_username(username: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users where username = %s", (username,))
        user = cursor.fetchone()

        if user:
            columns = [desc[0] for desc in cursor.description]
            user_dict = dict(zip(columns, user))
            cursor.close()
            return user_dict
        cursor.close()
        return None


def get_user_by_email(email: EmailStr):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users where email = %s", (email,))
        user = cursor.fetchone()
        if user:
            columns = [desc[0] for desc in cursor.description]
            user_dict = dict(zip(columns, user))
            cursor.close()
            return user_dict
        cursor.close()
        return None
