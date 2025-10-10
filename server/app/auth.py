from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import psycopg2
from starlette import status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from models import CreateUserRequest,User
from database import get_user_by_email,get_user_by_username, get_db
router = APIRouter(prefix="/auth", tags=["auth"])

bcryp_context = CryptContext(schemes=["bcrypt"], depricated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def password_hash(password:str):
    return bcryp_context.hash(password)

@router.post("/register",response_model=User)
async def register(user:CreateUserRequest):
    if get_user_by_username(user.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    if get_user_by_email(user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    hash_password = password_hash(user.password)
    with get_db as conn:
        cursor = conn.execute("INSERT into users(email,username,password) VALUES (?, ?, ?)",(user.email,user.username,hash_password))
        conn.commit()
        user_id = cursor.lastrowid
    return User(user_id,user.username,user.email)