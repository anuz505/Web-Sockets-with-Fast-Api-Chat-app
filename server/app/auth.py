from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import psycopg2
from starlette import status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["auth"])

bcryp_context = CryptContext(schemes=["bcrypt"], depricated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
