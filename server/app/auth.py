from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import psycopg2
from starlette import status
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import CreateUserRequest, User
from database import get_user_by_email, get_user_by_username, get_db

auth_router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
password_hash = PasswordHash.recommended()


def get_hash_password(password: str):
    return password_hash.hash(password)


def verify_password(plain_pw: str, hashed_pw):
    return password_hash.verify(plain_pw, hashed_pw)


@auth_router.post("/register", response_model=User)
async def register(user: CreateUserRequest):
    if get_user_by_username(user.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    if get_user_by_email(user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    hash_password = get_hash_password(user.password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users(email, username, hashed_password) VALUES (%s, %s, %s) RETURNING id",
            (user.email, user.username, hash_password),
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()

    return User(id=user_id, username=user.username, email=user.email)
