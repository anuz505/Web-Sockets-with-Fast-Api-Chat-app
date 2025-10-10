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
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def get_user_by_username(username:str):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users where username = ?",(username,).fetchone())
        return dict(user) if user else None
    
def get_user_by_email(email:EmailStr):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users where email = ?",(email,).fetchone())
        return dict(user) if user else None